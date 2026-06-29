import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { TirelireList } from './components/TirelireList';
import { TirelireDetail } from './components/TirelireDetail';
import { Settings } from './components/Settings';
import { Sun, Moon, Settings as SettingsIcon } from 'lucide-react';

const MainApp: React.FC = () => {
  const [selectedTirelireId, setSelectedTirelireId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleGoHome = () => {
    setSelectedTirelireId(null);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <header className="max-w-md mx-auto flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
          Ma Tirelire 🐷
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-colors ${
              showSettings 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <SettingsIcon size={24} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {showSettings ? (
          <Settings onBack={() => setShowSettings(false)} />
        ) : selectedTirelireId === null ? (
          <TirelireList onSelectTirelire={setSelectedTirelireId} />
        ) : (
          <TirelireDetail
            tirelireId={selectedTirelireId}
            onBack={() => setSelectedTirelireId(null)}
          />
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

export default App;
