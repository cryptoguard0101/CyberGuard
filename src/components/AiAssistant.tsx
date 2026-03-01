import React from 'react';
import { MessageSquareText, Sparkles, Send } from 'lucide-react';

const AiAssistant: React.FC = () => {
  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">KI-Sicherheitsberater</h2>
            <p className="text-xs text-slate-500">Immer bereit zu helfen</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        <div className="flex gap-3 max-w-[80%]">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <MessageSquareText size={16} />
          </div>
          <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none text-sm text-slate-700">
            Hallo! Ich bin Ihr KI-Berater. Wie kann ich Ihnen heute bei Ihrer IT-Sicherheit helfen?
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Fragen Sie etwas..." 
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          <button className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
