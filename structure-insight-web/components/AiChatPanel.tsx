
import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from '../types';

declare const marked: any;
declare const DOMPurify: any;

interface AiChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    onClose: () => void;
    isApiKeyMissing: boolean;
    isMobile?: boolean;
}

const TypingIndicator: React.FC = () => (
    <motion.div 
        className="flex items-center space-x-1.5 p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <motion.div className="w-2 h-2 bg-primary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="w-2 h-2 bg-primary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: 0.1, repeat: Infinity, ease: "easeInOut" }}/>
        <motion.div className="w-2 h-2 bg-primary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}/>
    </motion.div>
);

const Message: React.FC<{ message: ChatMessage }> = React.memo(({ message }) => {
    const isUser = message.role === 'user';
    const alignClass = isUser ? 'justify-end' : 'justify-start';
    const bubbleClass = isUser 
        ? 'bg-primary text-white' 
        : 'bg-light-bg dark:bg-dark-bg';

    const renderContent = () => {
        if (message.role === 'loading') {
            return <TypingIndicator />;
        }
        const rawHtml = marked.parse(message.content);
        const sanitizedHtml = DOMPurify.sanitize(rawHtml);
        return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
    };

    return (
        <div className={`flex ${alignClass} mb-4`}>
            <div className={`max-w-xl lg:max-w-2xl px-4 py-2 rounded-lg shadow-sm ${bubbleClass}`}>
                {renderContent()}
            </div>
        </div>
    );
});


const AiChatPanel: React.FC<AiChatPanelProps> = ({ messages, onSendMessage, isLoading, onClose, isApiKeyMissing, isMobile = false }) => {
    const [input, setInput] = React.useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-light-panel dark:bg-dark-panel">
            <div className="flex items-center justify-between p-3 border-b border-light-border dark:border-dark-border shrink-0">
                <h3 className="font-semibold text-sm flex items-center space-x-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-primary"></i>
                    <span>AI Chat</span>
                </h3>
                {!isMobile && (
                    <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center">
                        <i className="fa-solid fa-times text-xs"></i>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 && !isApiKeyMissing && (
                    <div className="text-center text-sm text-light-subtle-text dark:text-dark-subtle-text h-full flex flex-col justify-center items-center">
                        <i className="fa-solid fa-robot text-3xl mb-3"></i>
                        <p className="font-semibold">Ready to Assist</p>
                        <p>Ask me anything about the code!</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <Message key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-3 border-t border-light-border dark:border-dark-border shrink-0">
                {isApiKeyMissing ? (
                     <div className="text-center text-xs text-red-500 bg-red-500/10 p-2 rounded-md">
                        <strong>API Key Not Found</strong>
                        <p>The AI chat feature is disabled. Please set the <code>API_KEY</code> environment variable.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-center space-x-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                placeholder="Ask about the code..."
                                className="flex-1 px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                rows={1}
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                disabled={isLoading || !input.trim()}
                                className="w-10 h-10 rounded-md bg-primary text-white disabled:bg-primary-disabled flex items-center justify-center shrink-0"
                                aria-label="Send message"
                            >
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AiChatPanel;
