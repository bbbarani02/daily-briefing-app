import React, { useState } from 'react';
import BottomNavBar, { Tab } from './components/BottomNavBar';
import TodayView from './components/TodayView';
import ChatView from './components/ChatView';
import ImageEditView from './components/ImageEditView';
import TranscribeView from './components/TranscribeView';
import ThemeToggle from './components/ThemeToggle';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('today');

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