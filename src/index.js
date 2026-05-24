import express from "express"
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config()
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

import { defineConfig, env } from "@prisma/config";
export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: env("DATABASE_URL")
    }
})



const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
});


const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

const app = express();

app.use(express.json())  

app.post('/api/notes', async (req, res) => {
    const { user_id, content } = req.body;

    try {
        const prompt = `generate a short AI summary of the ${content}`;

        const response = await client.responses.create({
            model: "gpt-5.5",
            input: prompt,
        });

        // console.log(response.output_text);

        const contentData = response.output_text

        const users = await prisma.user.findMany();

        // console.log("post", users)

        const note = await prisma.post.create({
            authorId: user_id,
            content: contentData
        });
        return res.status(201).send({
            status: true,
            message: "Notes is created successfully"
        })

    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message || "Internal Server Error"
        })
    }

})

app.get('/api/notes/:user_id', async (req, res) => {
    try {
        const {user_id} = req.params
        const post = await prisma.post.findMany({
            where: { authorId: user_id },
            orderBy: { id: "desc" },
        });

        if (post.length === 0) {
            return res.status(400).send({
                status: false,
                message: "Data not Found"
            })
        }

        return res.status(200).send({
            status: false,
            message: "Notes Fetch Successfully",
            data: post
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message || "Internal Server Error"
        })
    }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})