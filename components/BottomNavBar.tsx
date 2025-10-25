import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { ChatIcon } from './icons/ChatIcon';
import { ImageIcon } from './icons/ImageIcon';
import { MicIcon } from './icons/MicIcon';

export type Tab = 'today' | 'chat' | 'image' | 'transcribe';

interface BottomNavBarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}`}>
        {icon}
        <span className="text-xs font-semibold">{label}</span>
    </button>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-gray-200/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-gray-300 dark:border-gray-700">
            <nav className="flex justify-around items-center h-full max-w-lg mx-auto pb-4">
                <NavItem
                    label="Today"
                    icon={<HomeIcon className="w-7 h-7" />}
                    isActive={activeTab === 'today'}
                    onClick={() => setActiveTab('today')}
                />
                <NavItem
                    label="Chat"
                    icon={<ChatIcon className="w-7 h-7" />}
                    isActive={activeTab === 'chat'}
                    onClick={() => setActiveTab('chat')}
                />
                 <NavItem
                    label="Image"
                    icon={<ImageIcon className="w-7 h-7" />}
                    isActive={activeTab === 'image'}
                    onClick={() => setActiveTab('image')}
                />
                <NavItem
                    label="Transcribe"
                    icon={<MicIcon className="w-7 h-7" />}
                    isActive={activeTab === 'transcribe'}
                    onClick={() => setActiveTab('transcribe')}
                />
            </nav>
        </div>
    );
};

export default BottomNavBar;