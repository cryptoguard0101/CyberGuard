import React, { useState, useEffect } from 'react';
import { X, Cpu, Zap, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { getAiConfig, saveAiConfig, checkGeminiConnection, checkOllamaConnection } from '../services/aiConfigService';
import { AiConfig, AiProvider } from '../types';

interface AiConfigWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiConfigWizard: React.FC<AiConfigWizardProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AiConfig>(getAiConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setConfig(getAiConfig());
        setTestResult(null);
        setTestMessage('');
    }
  }, [isOpen]);

  const handleSave = () => {
    saveAiConfig(config);
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
        let success = false;
        if (config.provider === 'CLOUD') {
            if (!config.geminiApiKey) {
                setTestResult('error');
                setTestMessage('Bitte geben Sie einen API-Key ein.');
                setIsTesting(false);
                return;
            }
            success = await checkGeminiConnection(config.geminiApiKey);
        } else {
            success = await checkOllamaConnection(config.ollamaUrl);
        }

        if (success) {
            setTestResult('success');
            setTestMessage('Verbindung erfolgreich hergestellt!');
        } else {
            setTestResult('error');
            setTestMessage('Verbindung fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.');
        }
    } catch {
        setTestResult('error');
        setTestMessage('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
        setIsTesting(false);
    }
  };

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
              <select 
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value as AiProvider })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="CLOUD">Google Gemini (Cloud)</option>
                <option value="OLLAMA">Ollama (Lokal)</option>
              </select>
            </div>
            
            {config.provider === 'CLOUD' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API-Key (Google AI Studio)</label>
                  <div className="relative">
                      <input 
                        type="password" 
                        value={config.geminiApiKey || ''}
                        onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                        placeholder="AIzaSy..."
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 outline-none ${testResult === 'error' ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
                      />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Einen Key erhalten Sie kostenlos im <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                  </p>
                </div>
            ) : (
                <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ollama URL</label>
                      <input 
                        type="text" 
                        value={config.ollamaUrl}
                        onChange={(e) => setConfig({ ...config, ollamaUrl: e.target.value })}
                        placeholder="http://127.0.0.1:11434"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Modell Name</label>
                      <input 
                        type="text" 
                        value={config.ollamaModel}
                        onChange={(e) => setConfig({ ...config, ollamaModel: e.target.value })}
                        placeholder="llama3"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                </>
            )}

            {/* Test Result Feedback */}
            {testResult && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${testResult === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {testResult === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {testMessage}
                </div>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={handleTestConnection}
            disabled={isTesting}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2"
          >
            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Verbindung testen
          </button>

          <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                Abbrechen
              </button>
              <button 
                onClick={handleSave} 
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Speichern
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiConfigWizard;
