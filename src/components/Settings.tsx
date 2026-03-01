import React from 'react';

interface SettingsProps {
  isLocalMode: boolean;
  onToggleLocalMode: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isLocalMode, onToggleLocalMode }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Einstellungen</h2>
      <div className="flex items-center justify-between">
        <p className="text-gray-600">Lokalen Modus verwenden</p>
        <button
          onClick={onToggleLocalMode}
          className={`px-4 py-2 rounded-full text-white ${isLocalMode ? 'bg-blue-600' : 'bg-gray-400'}`}>
          {isLocalMode ? 'Aktiviert' : 'Deaktiviert'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
