
import React from 'react';

export const RainIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 17a5 5 0 0 0-5-5h-1.26A8 8 0 1 0 6 15" />
        <path d="m8 17-2 4" />
        <path d="m12 17-2 4" />
        <path d="m16 17-2 4" />
    </svg>
);
