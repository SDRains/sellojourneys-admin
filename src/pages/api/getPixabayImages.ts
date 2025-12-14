import {NextApiRequest, NextApiResponse} from "next";
import { writeFile } from "fs/promises";
import { basename } from "path";

interface HitsInterface {
    largeImageURL: string;
    downloads: number;
    isAiGenerated: boolean;
}

interface ReqBodyInterface {
    locations: Array<string>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {locations}: ReqBodyInterface = req.body;

    // Validate required fields
    if (!locations || locations.length === 0) {
        res.status(400).send({error: 'Missing required fields'});
        return;
    }

    for (const locationName of locations) {
        let structuredLocationName = locationName.replaceAll("&", "");
        structuredLocationName = structuredLocationName.replaceAll(" ", "+");
        structuredLocationName = structuredLocationName.replaceAll("_", "+");

        const fetchRequest = await fetch('https://pixabay.com/api/?' +
            'key=53658719-a7c88de8599e6c9d3fa94a451' +
            `&q=${structuredLocationName}` +
            '&image_type=photo' +
            '&orientation=horizontal'
        )

        const res = await fetchRequest.json();
        const hits: HitsInterface[] = res.hits;

        // console.log(hits)

        // Sort by downloads descending and take top 3
        const topHits = hits
            .filter((hit) => !hit.isAiGenerated)
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 5);

        for (const hit of topHits) {
            const locationImageName = locationName.replaceAll(" ", "_").toLowerCase();
            const index = topHits.indexOf(hit);
            await downloadImage(hit.largeImageURL, `${locationImageName}_${index}.jpg`);
        }
    }

    res.status(200).send({success: true, locations: locations});

    async function downloadImage(url: string, filename?: string) {
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const name = filename || basename(new URL(url).pathname);
        await writeFile(`./src/location_images/${name}`, buffer);
    }
}