import React, { useState, useEffect } from 'react';
import BottomNavBar, { Tab } from './components/BottomNavBar';
import TodayView from './components/TodayView';
import ChatView from './components/ChatView';
import ImageEditView from './components/ImageEditView';
import TranscribeView from './components/TranscribeView';
import ThemeToggle from './components/ThemeToggle';
import LoadingSpinner from './components/LoadingSpinner';

// Add type declaration for the aistudio helper
// FIX: Define AIStudio interface to match existing global type and fix error.
interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

declare global {
    interface Window {
        aistudio?: AIStudio;
    }
}

// Inlined ApiKeyPrompt component to avoid creating a new file
const ApiKeyPrompt: React.FC<{ onKeySelect: () => void; }> = ({ onKeySelect }) => {
    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success and let the parent component handle the state change
            onKeySelect();
        } else {
            alert("This application requires access to the Gemini API, but the key selection utility is not available in your current environment.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-slate-900 p-4 font-sans antialiased">
            <div className="text-center max-w-md">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Welcome to iOS Daily Briefing</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    To get started, please select a Gemini API key. This app uses the Gemini API to generate your personalized daily briefings and power its features.
                </p>
                <button
                    onClick={handleSelectKey}
                    className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                >
                    Select API Key
                </button>
            </div>
        </div>
    );
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const App: React.FC = () => {
    const [isApiKeyReady, setIsApiKeyReady] = useState(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('today');

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                try {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setIsApiKeyReady(hasKey);
                } catch (e) {
                    console.error("Error checking for API key:", e);
                    setIsApiKeyReady(false);
                }
            } else {
                console.warn('aistudio API key utility not found.');
                // For this environment, we require the utility.
                setIsApiKeyReady(false);
            }
            setIsCheckingApiKey(false);
        };
        checkApiKey();
    }, []);

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
    
    if (isCheckingApiKey) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner />
            </div>
        );
    }
    
    if (!isApiKeyReady) {
        return <ApiKeyPrompt onKeySelect={() => setIsApiKeyReady(true) } />;
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