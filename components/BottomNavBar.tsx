
import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SettingsIcon } from './icons/SettingsIcon';

const BottomNavBar: React.FC = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-gray-200/80 backdrop-blur-sm border-t border-gray-300">
            <nav className="flex justify-around items-center h-full max-w-lg mx-auto pb-4">
                <a href="#" className="flex flex-col items-center text-blue-600">
                    <HomeIcon className="w-7 h-7" />
                    <span className="text-xs font-semibold">Today</span>
                </a>
                <a href="#" className="flex flex-col items-center text-gray-500">
                    <SearchIcon className="w-7 h-7" />
                    <span className="text-xs">Search</span>
                </a>
                <a href="#" className="flex flex-col items-center text-gray-500">
                    <SettingsIcon className="w-7 h-7" />
                    <span className="text-xs">Settings</span>
                </a>
            </nav>
        </div>
    );
};

export default BottomNavBar;
