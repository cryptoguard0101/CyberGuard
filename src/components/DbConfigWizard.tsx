import React from 'react';
import { X, Database, Shield } from 'lucide-react';

interface DbConfigWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const DbConfigWizard: React.FC<DbConfigWizardProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <Database size={20} />
            </div>
            <h2 className="font-bold text-slate-900">Datenbank-Setup</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <Shield size={20} className="text-slate-600 mt-1" />
            <p className="text-sm text-slate-600 leading-relaxed">
              Wählen Sie aus, wie Ihre Daten gespeichert werden sollen. Standardmäßig werden alle Daten lokal in Ihrem Browser verschlüsselt.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 border-2 border-blue-600 bg-blue-50 rounded-xl cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900">Lokal (Browser)</span>
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-1">Maximale Privatsphäre, keine Server-Infrastruktur nötig.</p>
            </div>
            
            <div className="p-4 border border-slate-200 rounded-xl opacity-50 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Cloud Sync (Beta)</span>
                <div className="w-5 h-5 rounded-full border border-slate-300"></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Synchronisieren Sie Ihre Daten über mehrere Geräte.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
            Einrichtung abschließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default DbConfigWizard;
