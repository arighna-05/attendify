import { Home, BookOpen, Award, BarChart3 } from 'lucide-react';

interface NavigationProps {
  activeTab: 'home' | 'subjects' | 'eca' | 'stats';
  onTabChange: (tab: 'home' | 'subjects' | 'eca' | 'stats') => void;
  userType: 'school' | 'college';
}

export function Navigation({ activeTab, onTabChange, userType }: NavigationProps) {
  // School: [Home] [Stats]
  // College: [Home] [Subjects] [ECA] [Stats]
  const tabs = userType === 'school' 
    ? [
        { id: 'home' as const, label: 'Home', icon: Home },
        { id: 'stats' as const, label: 'Stats', icon: BarChart3 },
      ]
    : [
        { id: 'home' as const, label: 'Home', icon: Home },
        { id: 'subjects' as const, label: 'Subjects', icon: BookOpen },
        { id: 'eca' as const, label: 'ECA', icon: Award },
        { id: 'stats' as const, label: 'Stats', icon: BarChart3 },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === tab.id
                ? 'text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
