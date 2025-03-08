import React, { useState } from 'react';
import { LayoutDashboard, BarChart2, Brain, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { NavSection } from '../types';

interface Props {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

export const Navigation: React.FC<Props> = ({ activeSection, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'predictions', label: 'Predictions', icon: Brain },
  ] as const;

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 z-50 flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex-1 py-8">
        <div className="flex items-center justify-between px-4 mb-8">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Predictive Business Analysis for Growth
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 dark:text-white" />
            ) : (
              <ChevronLeft className="w-5 h-5 dark:text-white" />
            )}
          </button>
        </div>
        <div className="space-y-2 px-3">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id as NavSection)}
              className={`flex items-center w-full px-3 py-3 rounded-lg transition-colors duration-200
                ${activeSection === id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">{label}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 border-t dark:border-gray-800">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white"
        >
          {isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </nav>
  );
};