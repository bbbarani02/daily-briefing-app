import React, { useState } from 'react';
import BottomNavBar, { Tab } from './components/BottomNavBar';
import TodayView from './components/TodayView';
import ChatView from './components/ChatView';
import ImageEditView from './components/ImageEditView';
import TranscribeView from './components/TranscribeView';
import ThemeToggle from './components/ThemeToggle';

const ConfigurationError: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-slate-900 p-4 font-sans antialiased">
        <div className="text-center max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Configuration Error</h1>
            <p className="text-gray-600 dark:text-gray-300">
                The Gemini API key has not been set. Please add the <code className="bg-gray-200 dark:bg-slate-700 p-1 rounded text-sm font-mono">API_KEY</code> to your environment secrets to continue.
            </p>
        </div>
    </div>
);


const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('today');
    const isApiKeySet = !!process.env.API_KEY;

    const renderContent = () => {
        switch (activeTab) {
            case 'today':
                return <TodayView />;
            case 'chat':
                return <ChatView />;
            case 'image':
                return <ImageEditView />;
            case 'transcribe':
                return <TranscribeView />;
            default:
                return <TodayView />;
        }
    };

    const getTitleForTab = (tab: Tab): string => {
        switch (tab) {
            case 'today':
                return getGreeting();
            case 'chat':
                return 'Gemini Chat';
            case 'image':
                return 'Image Editor';
            case 'transcribe':
                return 'Live Transcription';
        }
    }
    
    if (!isApiKeySet) {
        return <ConfigurationError />;
    }

    return (
        <div className="max-w-lg mx-auto font-sans antialiased min-h-screen pb-28">
            <header className="pt-12 pb-6 px-4 sticky top-0 bg-gray-100/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 border-b border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{getTitleForTab(activeTab)}</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>
            <main>
                {renderContent()}
            </main>
            <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
};

export default App;