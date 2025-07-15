import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { ProcessedFiles } from '../types';

// Store clients per key to avoid re-initialization
const aiClients = new Map<string, GoogleGenAI>();

function getAI(customApiKey?: string): GoogleGenAI {
    const keyToUse = customApiKey || process.env.API_KEY;

    if (!keyToUse) {
        throw new Error("未找到 API 密钥。请在设置中提供密钥或设置 API_KEY 环境变量。");
    }

    if (aiClients.has(keyToUse)) {
        return aiClients.get(keyToUse)!;
    }

    const newAiInstance = new GoogleGenAI({ apiKey: keyToUse });
    aiClients.set(keyToUse, newAiInstance);
    return newAiInstance;
}

function formatProjectContext(processedData: ProcessedFiles): string {
    let context = "## Project Context\n\n";
    context += "### File Structure\n";
    context += "```\n" + processedData.structureString + "\n```\n\n";
    context += "### File Contents\n";
    
    if (processedData.fileContents.length === 0) {
        context += "No file content was extracted.\n";
    } else {
        for (const file of processedData.fileContents) {
            const lang = file.language === 'xml' ? 'html' : file.language; // Use html for xml to get better highlighting in markdown
            context += `\n#### \`File: ${file.path}\`\n`;
            context += "```" + `${lang || ''}\n`
            context += file.content;
            context += "\n```\n";
        }
    }
    return context;
}

export function createChatSession(customApiKey?: string): Chat {
    const aiInstance = getAI(customApiKey);
    return aiInstance.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: "You are an expert software engineer and code analysis assistant. The user will provide you with the full context of a software project. Your task is to answer their questions about the code, suggest improvements, explain complex parts, or help them debug.",
        },
    });
}

export async function sendMessage(
    chat: Chat, 
    message: string, 
    processedData: ProcessedFiles,
    isFirstMessage: boolean
): Promise<AsyncGenerator<GenerateContentResponse>> {
    
    const parts: Part[] = [];

    if (isFirstMessage) {
        const projectContext = formatProjectContext(processedData);
        parts.push({ text: projectContext });
    }
    
    parts.push({ text: message });
    
    return chat.sendMessageStream({ message: parts });
}