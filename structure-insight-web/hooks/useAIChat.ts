import React from 'react';
import { createChatSession, sendMessage } from '../services/aiService';
import { ChatMessage, ProcessedFiles } from '../types';
import { usePersistentState } from './usePersistentState';
import { Chat } from '@google/genai';

interface AIChatProps {
    processedData: ProcessedFiles | null;
    isAiLoading: boolean;
    setIsAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
    handleShowToast: (message: string) => void;
    customApiKey: string;
}

export const useAIChat = ({
    processedData,
    isAiLoading,
    setIsAiLoading,
    handleShowToast,
    customApiKey,
}: AIChatProps) => {
    const [chatSession, setChatSession] = React.useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = usePersistentState<ChatMessage[]>('chatHistory', []);
    const [isApiKeyMissing, setIsApiKeyMissing] = React.useState(false);

    React.useEffect(() => {
        if (!customApiKey && !process.env.API_KEY) {
            setIsApiKeyMissing(true);
        } else {
            setIsApiKeyMissing(false);
        }
    }, [customApiKey]);
    
    const handleSendMessage = async (message: string) => {
        if (!message.trim() || isAiLoading || !processedData) return;

        let currentChat = chatSession;
        if (!currentChat) {
            try {
                currentChat = createChatSession(customApiKey);
                setChatSession(currentChat);
            } catch (error: any) {
                console.error("AI chat error:", error);
                handleShowToast(error.message);
                setIsAiLoading(false);
                return;
            }
        }
    
        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
        const loadingMessage: ChatMessage = { id: 'loading', role: 'loading', content: '' };
        
        const currentHistory = [...chatHistory, newUserMessage];
        setChatHistory([...currentHistory, loadingMessage]);
        setIsAiLoading(true);
    
        try {
            const isFirstMessage = chatHistory.filter(m => m.role === 'model').length === 0;
            const stream = await sendMessage(currentChat, message, processedData, isFirstMessage);
            
            let fullResponse = '';
            let modelMessageId = 'model-' + Date.now();
            let hasAddedModelMessage = false;

            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setChatHistory(prev => {
                    const newHistory = prev.filter(m => m.id !== 'loading');
                    if (!hasAddedModelMessage) {
                        newHistory.push({ id: modelMessageId, role: 'model', content: fullResponse });
                        hasAddedModelMessage = true;
                    } else {
                        const modelMsg = newHistory.find(m => m.id === modelMessageId);
                        if (modelMsg) modelMsg.content = fullResponse;
                    }
                    return newHistory;
                });
            }
    
        } catch (error: any) {
            console.error("AI chat error:", error);
            const errorMessage: ChatMessage = { id: 'error-' + Date.now(), role: 'model', content: `抱歉，我遇到了一个错误。请检查您的 API 密钥和网络连接。(错误: ${error.message})` };
            setChatHistory(prev => prev.filter(m => m.role !== 'loading').concat(errorMessage));
        } finally {
            setIsAiLoading(false);
            setChatHistory(prev => prev.filter(m => m.id !== 'loading'));
        }
    };
    
    const resetChat = () => {
        setChatSession(null);
        setChatHistory([]);
        setIsAiLoading(false);
    }
    
    return {
        chatHistory,
        setChatHistory,
        isApiKeyMissing,
        handleSendMessage,
        resetChat
    };
};