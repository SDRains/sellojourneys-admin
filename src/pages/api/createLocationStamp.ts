import {NextApiRequest, NextApiResponse} from "next";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import fs from "fs";
import path from 'path'

interface ReqBodyInterface {
    locations: Array<LocationInterface>;
}

interface LocationInterface {
    name: string; // For best results, structure like: "location_name in city, state"
    city: string;
    state: string;
    stamp: {
        stamp_image: string;
    }
}

interface GenerateImageResponseInterface {
    status: 'success' | 'error';
    message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).send({error: 'Method Not Allowed'});
        return
    }

    const { locations }: ReqBodyInterface = req.body;

    // Validate required fields
    if (!locations || locations.length === 0) {
        res.status(400).send({error: 'Missing required fields'});
        return;
    }

    // With location info, we first need Claude to generate an image prompt for GPT to generate
    for (const location of locations) {
        if (!location.name || !location.city || !location.state || !location.stamp.stamp_image) {
            res.status(400).send({error: 'Missing required fields within location data'});
        }

        const {name, city, state, stamp} = location;

        try {
            const claudePrompt = await getClaudeImagePrompt(`${name} in ${city}, ${state}`);
            console.log('Image prompt from Claude: ', claudePrompt)

            if (!claudePrompt || claudePrompt === '') {
                res.status(400).send({error: 'Claude did not return a valid image prompt for this location... Please try again later.'});
            }

            const imageGenRequest: GenerateImageResponseInterface = await generateImageWithChatGPT(claudePrompt, stamp.stamp_image)

            if (imageGenRequest.status === 'error') {
                res.status(400).send({error: `ChatGPT did not return an image for ${name}... Please try again later. Error: ${imageGenRequest.message}`});
            }

            res.status(200).json({
                success: true
            });
        } catch (error) {
            console.error('Error calling Claude API:', error);
            res.status(500).json({
                error: 'Failed to generate location stamp',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

async function getClaudeImagePrompt(locationInfo: string): Promise<string> {
    const BASE_IMAGE_PROMPT = `I need you to create an image prompt so chatGPT can generate high level images for me. I will provide you a location in a city and state in the U.S.
    
    Here is an example of a successful image creation: An illustrative flat drawing of Griffith Observatory in Los Angeles, California, featuring the iconic white Art Deco building with its distinctive copper domes perched on the southern slope of Mount Hollywood, overlooking the Los Angeles basin with the downtown skyline visible in the distance, surrounded by chaparral-covered hills and native California vegetation, with the building's three copper domes prominently displayed including the central rotunda dome, rendered in a vintage 1950s postage stamp aesthetic with vibrant, playful colors, geometric shapes, and soft gradients, no text or lettering, no grain, stamp fills entire frame, edge-to-edge composition, no margins, no border space, visible stamp perforations around the edges, transparent background, isolated stamp on transparent background, no background color, square 1:1 aspect ratio.
    
    Return ONLY the image prompt without any markdown formatting, explanations, or code blocks.
    `;

    const anthropic = new Anthropic({
        apiKey: process.env.CLAUDE_SELLO_JOURNEYS_API_KEY
    })

    const userPrompt = `Create me a prompt for ${locationInfo}`;

    const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        system: BASE_IMAGE_PROMPT,
        messages: [
            {
                role: "user",
                content: userPrompt
            }
        ]
    })

    // Return the prompt from Claude
    return message.content[0].type === 'text'
        ? message.content[0].text
        : '';
}

async function generateImageWithChatGPT(imagePrompt: string, stampName: string): Promise<GenerateImageResponseInterface> {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_SELLO_JOURNEYS_API_KEY
    })

    const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        size: "1024x1024",
        background: "transparent",
        quality: "high",
    });

    if (!result) {
        return {status: 'error', message: 'No image as returned from openai.images'};
    }

    // Save the image to local machine
    const image_base64 = result.data?.[0]?.b64_json;
    if (image_base64) {
        const image_bytes = Buffer.from(image_base64, "base64");
        fs.writeFileSync(`./src/generated_stamps/${stampName}`, image_bytes);
        console.log("***** STAMP SUCCESSFULLY GENERATED *****")
    } else {
        return {status: 'error', message: 'No image data was returned within openai results'};
    }

    return {status: 'success', message: 'Image created successfully'};
}