import express from 'express';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';
import { instructions } from './instructions.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

const generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 8192,
    responseSchema: {
        type: "object",
        properties: {
            canvasShapes: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        action: { type: "string" },
                        id: { type: "string" },
                        shape: { type: "string" },
                        fill: { type: "string" },
                        x: { type: "number" },
                        y: { type: "number" },
                        size: {
                            type: "object",
                            properties: {
                                width: { type: "number" },
                                height: { type: "number" },
                            },
                            required: ["width", "height"]
                        },
                        text: { type: "string" },
                        fontSize: { type: "number" },
                        fontFamily: { type: "string" },
                        rotation: { type: "number" },
                    },
                    required: ["action"]
                }
            },
            resume: {
                type: "string"
            }
        },
        required: ["canvasShapes", "resume"]
    }
};

const cache = new Map();

function normalizeShape(shape, existingShapes) {
    if (shape.action === 'edit' || shape.action === 'delete') {
        return shape
    }

    const defaultSize = { width: 100, height: 100 };
    let normalizedShape = {
        action: 'add',
        shape: shape.shape || 'circle',
        fill: shape.fill || "#000000",
        x: shape.x !== undefined ? Math.round(shape.x) : 400,
        y: shape.y !== undefined ? Math.round(shape.y) : 300,
        size: shape.size || defaultSize,
        id: `shape${Date.now()}`,
        rotation: shape.rotation || 0,
    };

    normalizedShape.size = {
        width: Math.round(normalizedShape.size.width) || defaultSize.width,
        height: Math.round(normalizedShape.size.height) || defaultSize.height,
    };

    if (normalizedShape.shape === 'circle') {
        const diameter = Math.max(normalizedShape.size.width, normalizedShape.size.height);
        normalizedShape.size = { width: diameter, height: diameter };
    }

    if (normalizedShape.shape === 'text') {
        normalizedShape.text = shape.text || 'Texto de ejemplo';
        normalizedShape.fontSize = shape.fontSize || 20;
        normalizedShape.fontFamily = shape.fontFamily || 'Arial';
    }

    return normalizedShape;
}

function validateShapeInput(shape) {
    let newShape = shape;
    if (typeof shape.x != 'number' || typeof shape.y != 'number') {
    }
    
    return newShape;
}

app.post('/generate-canvas', async (req, res) => {
    const { prompt, canvasSummary } = req.body;
    
    if (cache.has(prompt)) {
        return res.json(cache.get(prompt));
    }

    try {
        const fullPrompt = `${instructions}\n\nUsuario: ${prompt}\n\nContexto actual: ${JSON.stringify(canvasSummary)}`;

        console.log('Generating content with prompt:', fullPrompt);

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: fullPrompt }]}],
            generationConfig,
        });

        const response = await result.response;
        const text = response.text();

        let jsonResponse;
        const textFormatted = text.replace(/`/g, '"');
        try {
            jsonResponse = JSON.parse(textFormatted);
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            console.error('Response:', textFormatted);
            return res.status(400).send('Model response is not valid JSON');
        }

        if (!jsonResponse.canvasShapes || !Array.isArray(jsonResponse.canvasShapes)) {
            return res.status(400).send('Response does not contain a valid canvasShapes array');
        }

        const normalizedShapes = jsonResponse.canvasShapes.map(shape => normalizeShape(shape, canvasSummary));

        const isValid = normalizedShapes.every(shape => 
            shape.action && 
            (shape.action === 'add' || shape.action === 'edit' || shape.action === 'delete') &&
            (shape.action !== 'add' || (shape.shape && shape.fill && 
                typeof shape.x === 'number' && typeof shape.y === 'number' &&
                shape.size && typeof shape.size.width === 'number' && typeof shape.size.height === 'number')) &&
            (shape.action !== 'edit' || shape.id) &&
            (shape.action !== 'delete' || shape.id)
        );

        const test = normalizedShapes.map(shape => validateShapeInput(shape));

        console.log('Normalized shapes:', test);
        
        if (!isValid) {
            console.error('Response contains invalid shapes:', normalizedShapes);
            return res.status(400).send('Response contains shapes that do not meet all requirements');
        }

        const finalResponse = { canvasShapes: normalizedShapes, resume: jsonResponse.resume };
        cache.set(prompt, finalResponse);
        
        res.json(finalResponse);
    } catch (error) {
        console.error('Error in instruction generation:', error);
        res.status(500).send('Error generating instructions');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});