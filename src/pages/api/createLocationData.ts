import {NextApiRequest, NextApiResponse} from "next";
import Anthropic from "@anthropic-ai/sdk";

interface ReqBodyInterface {
    locations: string[];
    state: string;
}

const SYSTEM_PROMPT = `I am going to give you a list of locations and I need you to create SQL statements for each list to insert into my database table 'locations'. Here is the structure of the table:

id- uuid, primary key, unique, default: gen_random_uuid()
name- text
description- text, nullable
hero_image- text, nullable
latitude- double precision, nullable
longitude- double precision, nullable
address- text, nullable
city- text, nullable
state- text, nullable
zipcode- text, nullable
geofence_radius- integer, nullable
difficulty_level- integer, nullable
estimated_time- integer, nullable
best_time_to_visit- text, nullable
entry_fee- text, nullable
accessibility_info- text, nullable
is_active- boolean, nullable, default: true
is_featured- boolean, nullable, default: false
is_trending- boolean, nullable, default: false
admin_notes- text, nullable
created_at- timestamp with time zone, nullable, default: now()
last_updated_at- timestamp with time zone, nullable, default: now()
created_by- uuid, nullable
website- text, nullable
phone- text, nullable

For each location, you will set the following:
- is_active = true
- is_featured = false
- is_trending = false

Do not include: id, created_at, last_updated_at, created_by as they will auto fill with defaults

difficulty_level is an integer range from 1-5 with 1 being very easy and 5 being extremely difficult (rock climbing, etc. very few if any locations will ever be a 5)

estimated_time is in minutes. So a 1 hour visit would be 60 value

geofence_radius is typically a range from 100-2000 depending on location scale

latitude and longitude should have 4 decimal places

best_time_to_visit is a string and can be anything such as: "Evenings for stargazing; weekdays to avoid crowds" or "Year-round, but spring (March-May) offers the best weather and blooming flowers"

entry_fee and accessibility_info are also strings as needed

admin_notes are not included (will be null until a person actually goes and adds a note)

address should only include street and building/unit numbers if needed.

Descriptions should be at minimum 250 characters but no longer than 600

hero_image should be the location name in all lowercase with _ in for spaces and .jpg extension. Example: Griffith Park Observatory -> griffith_park_observatory.jpg. Also any special characters such as & should be removed. So if the location is Park & Gym -> park_gym.jpg

Return ONLY the SQL INSERT statement without any markdown formatting, explanations, or code blocks.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).send({error: 'Method Not Allowed'});
        return
    }

    const { locations, state }: ReqBodyInterface = req.body;

    // Validate required fields
    if (!locations || !state) {
        res.status(400).send({error: 'Missing required fields'});
        return;
    }

    // With the location name, city and state, we need to create a query for Claude to create the SQL statement
    try {
        const anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_SELLO_JOURNEYS_API_KEY
        })

        const userPrompt = `Create a SQL INSERT statement for the following locations:

Locations:
${locations.join('\n')}

State:
${state}`;

        const message = await anthropic.messages.create({
            model: "claude-4-sonnet-20250514",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: "user",
                    content: userPrompt
                }
            ]
        })

        // Extract the SQL from Claude's response
        const sqlStatement = message.content[0].type === 'text'
            ? message.content[0].text
            : '';

        res.status(200).json({
            success: true,
            sql: sqlStatement
        });
    } catch (error) {
        console.error('Error calling Claude API:', error);
        res.status(500).json({
            error: 'Failed to generate SQL statement',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}