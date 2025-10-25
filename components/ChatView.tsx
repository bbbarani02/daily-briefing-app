import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import type { Source } from '../types';

interface Message {
    role: 'user' | 'model';
    text: string;
    sources?: Source[];
}

const SourcesDisplay: React.FC<{ sources: Source[], role: 'user' | 'model' }> = ({ sources, role }) => {
    if (!sources || sources.length === 0 || role !== 'model') return null;

    const textColor = 'text-gray-600 dark:text-gray-400';
    const linkColor = 'text-blue-600 dark:text-blue-400 hover:underline';
    const borderColor = 'border-gray-200 dark:border-gray-600';

    return (
        <div className={`mt-2 pt-2 border-t ${borderColor}`}>
            <h4 className={`text-xs font-semibold ${textColor} mb-1`}>Sources</h4>
            <ul className="list-disc list-inside space-y-1">
                {sources.map((source, index) => (
                    <li key={index} className={`text-xs ${textColor} truncate`}>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className={linkColor}>
                            {source.title || new URL(source.uri).hostname}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const ChatView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, newUserMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError(null);
        
        const history = messages.map(msg => ({ role: msg.role, parts: [{text: msg.text}] }));

        try {
            const stream = await getChatResponse(history, currentInput, useThinkingMode);
            
            let modelResponse = '';
            let modelSources: Source[] = [];
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;

                if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    const groundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
                    const newSources: Source[] = groundingChunks
                        .map((chunk: any) => chunk.web)
                        .filter(Boolean)
                        .map((webChunk: any) => ({
                            title: webChunk.title,
                            uri: webChunk.uri,
                        }));
                    modelSources.push(...newSources);
                }
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const uniqueSources = modelSources.filter((source, index, self) =>
                        index === self.findIndex((s) => s.uri === source.uri)
                    );
                    newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse, sources: uniqueSources };
                    return newMessages;
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if(lastMessage && lastMessage.role === 'model') {
                    newMessages[newMessages.length - 1].text = `Error: ${errorMessage}`;
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-170px)] px-4 pt-4">
            <div className="flex justify-end items-center mb-4 px-1">
                <label className="flex items-center cursor-pointer">
                    <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Thinking Mode</span>
                    <div className="relative">
                        <input type="checkbox" checked={useThinkingMode} onChange={() => setUseThinkingMode(!useThinkingMode)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                </label>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 shadow-sm'}`}>
                             {msg.role === 'model' && !msg.text && isLoading && index === messages.length - 1 ? (
                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 dark:border-blue-400 mr-2"></div>
                                    <span>Thinking...</span>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                            <SourcesDisplay sources={msg.sources || []} role={msg.role} />
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {error && <p className="text-red-500 text-sm text-center my-2">{error}</p>}
            <form onSubmit={handleSend} className="mt-4 flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="flex-grow p-3 border border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button type="submit" className="ml-3 bg-blue-500 text-white p-3 rounded-full disabled:bg-gray-400 dark:disabled:bg-slate-600" disabled={isLoading || !input.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
            </form>
        </div>
    );
};

export default ChatView;