import React from 'react';
import { X, Cpu, Zap } from 'lucide-react';

interface AiConfigWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiConfigWizard: React.FC<AiConfigWizardProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Cpu size={20} />
            </div>
            <h2 className="font-bold text-slate-900">KI-Konfiguration</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
            <Zap size={20} className="text-blue-600 mt-1" />
            <p className="text-sm text-blue-800 leading-relaxed">
              Konfigurieren Sie hier Ihren KI-Anbieter für intelligente Sicherheitsanalysen und den Chat-Assistenten.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">KI-Anbieter</label>
              <select className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="gemini">Google Gemini (Empfohlen)</option>
                <option value="ollama">Ollama (Lokal)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">API-Key</label>
              <input 
                type="password" 
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
            Abbrechen
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiConfigWizard;
