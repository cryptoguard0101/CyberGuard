import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RefreshCcw, CheckCircle2, ShieldCheck, ArrowRight, MessageSquare } from 'lucide-react';
import { continueOnboardingSession, generateTasksFromChat } from '../services/geminiService';
import { User, Task, ChatMessage } from '../types';
import Markdown from 'react-markdown';

interface OnboardingChatProps {
  user: User;
  onAddTasks: (tasks: Task[]) => void;
  tasks: Task[];
  onUpdateUser: (updates: Partial<User>) => void;
}

const OnboardingHub: React.FC<OnboardingChatProps> = ({ user, onAddTasks, tasks, onUpdateUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasOnboardingTasks = tasks.some(t => t.source === 'ONBOARDING' || t.source === 'GENERATOR');

  useEffect(() => {
    if (messages.length === 0 && !hasOnboardingTasks) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hallo ${user.username || 'Nutzer'}! Ich bin Ihr CyberGuard-Assistent. Lassen Sie uns gemeinsam herausfinden, welche Sicherheitsmaßnahmen für Ihr Unternehmen am wichtigsten sind. In welcher Branche sind Sie tätig?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [user, hasOnboardingTasks, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await continueOnboardingSession(history, userMsg.text);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Onboarding Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    setIsGenerating(true);
    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const newTasks = await generateTasksFromChat(history);
      
      if (newTasks.length > 0) {
        onAddTasks(newTasks as Task[]);
        // Mark onboarding as done in user profile if needed
        onUpdateUser({
            coaching: {
                ...user.coaching!,
                isActive: true,
                lastInteraction: new Date()
            }
        });
      }
    } catch (error) {
      console.error("Task Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (hasOnboardingTasks) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Onboarding abgeschlossen!</h1>
        <p className="text-slate-600 mt-4 text-lg">
          Vielen Dank für Ihre Angaben. Wir haben basierend auf unserem Gespräch eine individuelle Checkliste für Sie erstellt.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.location.hash = '#/audit'}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            Zur Checkliste <ArrowRight size={20} />
          </button>
          <button 
            onClick={() => window.location.hash = '#/'}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">CyberGuard Onboarding</h2>
            <p className="text-xs text-slate-500">KI-gestütztes Sicherheits-Profil</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          Live Analyse
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'
              }`}>
                {msg.role === 'user' ? <MessageSquare size={16} /> : <Sparkles size={16} />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}>
                <div className="prose prose-slate prose-sm max-w-none dark:prose-invert">
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <RefreshCcw size={16} className="animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-4 border-t border-slate-100 bg-white">
        {messages.length >= 6 ? (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">Bereit für die Analyse?</p>
                <p className="text-xs text-blue-700">Ich habe genug Informationen gesammelt.</p>
              </div>
            </div>
            <button 
              onClick={handleFinalize}
              disabled={isGenerating}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCcw size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Analyse abschließen
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSendMessage} className="relative">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || isGenerating}
            placeholder="Schreiben Sie hier Ihre Antwort..." 
            className="w-full pl-4 pr-12 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isLoading || isGenerating}
            className="absolute right-2 top-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-3 uppercase tracking-widest font-bold">
          Unterstützt durch Gemini 3.1 Pro & NIST Framework
        </p>
      </div>
    </div>
  );
};

export default OnboardingHub;
