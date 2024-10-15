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

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-002",
});

const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
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
                        color: { type: "string" },
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
            }
        },
        required: ["canvasShapes"]
    }
};

function normalizeShape(shape) {
    const defaultSize = { width: 100, height: 100 };
    const normalizedShape = {
        action: shape.action || 'add',
        shape: shape.shape || 'circle',
        color: shape.color || "#000000", // Negro por defecto
        x: shape.x !== undefined ? Math.round(shape.x) : 400,
        y: shape.y !== undefined ? Math.round(shape.y) : 300,
        size: shape.size || defaultSize,
        id: shape.id || `shape${Date.now()}`,
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

app.post('/generate-canvas', async (req, res) => {
    const { prompt, canvasSummary } = req.body;

    try {
        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });

        const contextActual = JSON.stringify(canvasSummary);
        const fullPrompt = `${instructions.replace('{contextActual}', contextActual)}\n\nUsuario: ${prompt}\n\nGenera las instrucciones para manipular el canvas basadas en este prompt y el contexto actual, siguiendo ESTRICTAMENTE el esquema de respuesta especificado.`;

        console.log('Prompt completo: \n', fullPrompt);

        const result = await chatSession.sendMessage(fullPrompt);

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(result.response.text().trim());
        } catch (parseError) {
            console.error('Error al parsear la respuesta JSON:', parseError);
            return res.status(400).send('La respuesta del modelo no es un JSON válido');
        }

        if (!jsonResponse.canvasShapes || !Array.isArray(jsonResponse.canvasShapes)) {
            return res.status(400).send('La respuesta no contiene un array canvasShapes válido');
        }

        const normalizedShapes = jsonResponse.canvasShapes.map(normalizeShape);

        console.log('Formas normalizadas:', normalizedShapes);

        const isValid = normalizedShapes.every(shape => 
            shape.action && 
            (shape.action === 'add' || shape.action === 'edit' || shape.action === 'delete') &&
            (shape.action !== 'add' || (shape.shape && shape.color && 
                typeof shape.x === 'number' && typeof shape.y === 'number' &&
                shape.size && typeof shape.size.width === 'number' && typeof shape.size.height === 'number')) &&
            (shape.action !== 'edit' || shape.id) &&
            (shape.action !== 'delete' || shape.id)
        );

        if (!isValid) {
            console.error('La respuesta contiene formas inválidas:', normalizedShapes);
            return res.status(400).send('La respuesta contiene formas que no cumplen con todos los requisitos');
        }

        res.json({ canvasShapes: normalizedShapes });
    } catch (error) {
        console.error('Error en la generación de instrucciones:', error);
        res.status(500).send('Error al generar las instrucciones');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});