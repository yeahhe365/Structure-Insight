import { GoogleGenAI } from "@google/genai";
import { ProcessedFiles } from '../types';
import { generateFullOutput } from "./fileProcessor";


export async function* streamAiChat(
    projectData: ProcessedFiles, 
    history: { role: 'user' | 'model', parts: { text: string }[] }[],
    question: string
): AsyncGenerator<string> {

    // Delay initialization until the function is called to avoid crashing the app on load
    // in browser environments where `process.env` is not defined.
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Cannot initialize AI Chat.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const model = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are an expert software engineer acting as a helpful code assistant.
The user has provided you with the full context of a project, including the file structure and the content of each file.
Your task is to answer the user's questions about this codebase.
Be concise and accurate in your answers.
When referencing code, specify the file path.
DO NOT repeat the project context in your response.
Project Context:\n${generateFullOutput(projectData.structureString, projectData.fileContents)}`
        },
        history: history
    });

    const result = await model.sendMessageStream({
        message: question,
    });

    for await (const chunk of result) {
        yield chunk.text;
    }
}