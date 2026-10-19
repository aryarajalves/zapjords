import React from 'react';

const TabButton = ({ id, activeTab, onClick, label, icon: Icon }) => {
    const isActive = activeTab === id;
    
    return (
        <button
            type="button"
            onClick={() => onClick(id)}
            className={`w-auto md:w-full flex items-center justify-start gap-2 md:gap-3 px-3.5 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive 
                ? 'bg-blue-600 text-white md:bg-white md:dark:bg-gray-800 md:text-blue-600 md:dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-white/5'
            }`}
        >
            {Icon && <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />}
            <span>{label}</span>
        </button>
    );
};

export default TabButton;
