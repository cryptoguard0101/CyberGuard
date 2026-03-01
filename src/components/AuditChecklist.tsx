import React, { useState } from 'react';
import { CheckSquare, Filter, ChevronRight, Info, ShieldCheck, AlertCircle, FileText, Upload, RefreshCcw, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Task, User, TaskStatus } from '../types';
import { explainTask, verifyDocumentWithAI } from '../services/geminiService';
import Markdown from 'react-markdown';

interface AuditChecklistProps {
  tasks: Task[];
  user: User;
  onUpdateTask: (task: Task) => void;
}

const AuditChecklist: React.FC<AuditChecklistProps> = ({ tasks, onUpdateTask }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; reason: string } | null>(null);

  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    setExplanation(null);
    setVerificationResult(null);
    
    setIsExplaining(true);
    try {
      const text = await explainTask(task);
      setExplanation(text);
    } catch (error) {
      console.error("Explain Error:", error);
      setExplanation("Fehler beim Laden der Erklärung.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    setIsVerifying(true);
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const result = await verifyDocumentWithAI(selectedTask, base64, file.type);
        setVerificationResult(result);
        
        if (result.verified) {
          onUpdateTask({ ...selectedTask, status: TaskStatus.DONE });
        }
      } catch (error) {
        console.error("Verification Error:", error);
      } finally {
        setIsVerifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return 'bg-green-100 text-green-700 border-green-200';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
      {/* Task List */}
      <div className="w-full md:w-1/2 flex flex-col gap-6 overflow-y-auto pr-2">
        <div className="flex items-center justify-between sticky top-0 bg-slate-50 py-2 z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sicherheits-Checkliste</h1>
            <p className="text-sm text-slate-500">Ihre individuellen Maßnahmen zur Compliance.</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => handleTaskClick(task)}
                className={`bg-white p-4 rounded-xl border transition-all cursor-pointer group ${
                    selectedTask?.id === task.id ? 'border-blue-500 ring-2 ring-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      task.status === TaskStatus.DONE ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {task.status === TaskStatus.DONE ? <ShieldCheck size={24} /> : <CheckSquare size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                            {task.status}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getImpactColor(task.impact)}`}>
                            {task.impact}
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-900 truncate">{task.title}</h3>
                    <p className="text-xs text-slate-500 truncate">{task.description}</p>
                  </div>
                  <ChevronRight size={20} className={`text-slate-300 transition-transform ${selectedTask?.id === task.id ? 'rotate-90 text-blue-500' : 'group-hover:translate-x-1'}`} />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold">Keine Aufgaben vorhanden.</p>
              <p className="text-sm text-slate-400 mt-1">Starten Sie das Onboarding, um Ihre Liste zu generieren.</p>
              <button 
                onClick={() => window.location.hash = '#/onboarding'}
                className="mt-6 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all"
              >
                Onboarding starten
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      <div className="hidden md:block w-1/2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {selectedTask ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{selectedTask.framework} Framework</span>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                    <AlertCircle size={20} />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedTask.title}</h2>
              <p className="text-slate-500 mt-2">{selectedTask.description}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* AI Explanation */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-500" /> KI-Anleitung
                </h4>
                {isExplaining ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                  </div>
                ) : (
                  <div className="prose prose-slate prose-sm max-w-none">
                    <Markdown>{explanation || 'Wählen Sie eine Aufgabe aus, um die KI-Anleitung zu sehen.'}</Markdown>
                  </div>
                )}
              </div>

              {/* Verification Section */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" /> Nachweis erbringen
                </h4>
                <p className="text-xs text-slate-500">
                    Laden Sie einen Screenshot oder ein Dokument hoch. Unsere KI prüft automatisch, ob die Maßnahme korrekt umgesetzt wurde.
                </p>
                
                {verificationResult ? (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in zoom-in-95 ${
                      verificationResult.verified ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {verificationResult.verified ? <CheckCircle2 size={20} className="mt-0.5" /> : <XCircle size={20} className="mt-0.5" />}
                    <div>
                        <p className="font-bold text-sm">{verificationResult.verified ? 'Verifiziert' : 'Nicht ausreichend'}</p>
                        <p className="text-xs mt-0.5 leading-relaxed">{verificationResult.reason}</p>
                    </div>
                  </div>
                ) : null}

                <div className="relative">
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    disabled={isVerifying}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                      isVerifying ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}>
                    {isVerifying ? (
                        <RefreshCcw size={32} className="text-blue-600 animate-spin" />
                    ) : (
                        <Upload size={32} className="text-slate-300" />
                    )}
                    <span className="text-sm font-bold text-slate-600">
                        {isVerifying ? 'KI prüft Dokument...' : 'Datei auswählen oder hierher ziehen'}
                    </span>
                    <span className="text-[10px] text-slate-400">PDF, PNG, JPG (max. 5MB)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Info size={14} />
                    Status: <span className="font-bold">{selectedTask.status}</span>
                </div>
                <button 
                    onClick={() => onUpdateTask({ ...selectedTask, status: selectedTask.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE })}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        selectedTask.status === TaskStatus.DONE 
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    }`}
                >
                    {selectedTask.status === TaskStatus.DONE ? 'Als offen markieren' : 'Manuell abschließen'}
                </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <CheckSquare size={48} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900">Keine Aufgabe ausgewählt</h3>
                <p className="text-slate-500 mt-2">Wählen Sie links eine Maßnahme aus, um Details, KI-Anleitungen und Verifizierungs-Optionen zu sehen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditChecklist;
