import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessedFiles } from '../types';
import { streamAiChat } from '../services/geminiService';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface AIChatProps {
    isOpen: boolean;
    onClose: () => void;
    projectData: ProcessedFiles | null;
}

type Message = {
    role: 'user' | 'model';
    content: string;
};

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, projectData }) => {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(scrollToBottom, [messages]);
    
    React.useEffect(() => {
        if (isOpen) {
             setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim() || !projectData || isLoading) return;
        
        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const geminiHistory = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        let fullResponse = '';
        setMessages(prev => [...prev, { role: 'model', content: '' }]);

        try {
            const stream = streamAiChat(projectData, geminiHistory, userMessage.content);
            for await (const chunk of stream) {
                fullResponse += chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = fullResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = "抱歉，分析时出现错误。请检查控制台了解详情。";
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const renderMessageContent = (content: string) => {
        const rawHtml = marked.parse(content);
        const sanitized = DOMPurify.sanitize(rawHtml);
        return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitized }} />;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-40 flex items-end justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/30" onClick={onClose} />
                    <motion.div
                        className="relative flex flex-col bg-light-panel dark:bg-dark-panel rounded-lg shadow-2xl border border-light-border dark:border-dark-border m-4 w-full max-w-2xl h-[80vh] max-h-[700px]"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <header className="flex items-center justify-between p-3 border-b border-light-border dark:border-dark-border shrink-0">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <i className="fa-solid fa-wand-magic-sparkles text-primary"></i> 
                                AI 助理 <span className="text-xs font-normal text-light-subtle-text dark:text-dark-subtle-text border border-primary/30 px-1.5 rounded-md text-primary">Gemini 3.0 Pro Thinking</span>
                            </h3>
                            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center">
                                <i className="fa-solid fa-times text-xs"></i>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-sm text-light-subtle-text dark:text-dark-subtle-text h-full flex flex-col items-center justify-center">
                                    <i className="fa-solid fa-code text-3xl mb-3"></i>
                                    <p className="font-semibold">向我询问有关您的代码的问题！</p>
                                    <p>例如，“总结 App.tsx 的功能”</p>
                                </div>
                            )}
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-1"><i className="fa-solid fa-robot text-sm"></i></div>}
                                    <div className={`p-3 rounded-lg max-w-xl ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-light-bg dark:bg-dark-bg'}`}>
                                        {renderMessageContent(msg.content)}
                                        {isLoading && index === messages.length - 1 && <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        <div className="p-3 border-t border-light-border dark:border-dark-border shrink-0">
                            <div className="relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="输入您的问题..."
                                    className="w-full pl-3 pr-12 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    rows={1}
                                    disabled={isLoading}
                                    style={{maxHeight: '100px'}}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center disabled:bg-primary-disabled"
                                >
                                    <i className="fa-solid fa-arrow-up"></i>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AIChat;