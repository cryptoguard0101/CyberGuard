import React, { useState, useEffect, useMemo } from 'react';
import { CheckSquare, Filter, ChevronRight, Info, ShieldCheck, FileText, Upload, RefreshCcw, Sparkles, CheckCircle2, XCircle, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Task, User, TaskStatus, Roadmap, Framework } from '../types';
import { explainTask, verifyDocumentWithAI, generateSecurityRoadmap } from '../services/geminiService';
import Markdown from 'react-markdown';

interface AuditChecklistProps {
  tasks: Task[];
  user: User;
  onUpdateTask: (task: Task) => void;
}

const AuditChecklist: React.FC<AuditChecklistProps> = ({ tasks, onUpdateTask }) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; reason: string } | null>(null);
  
  // Roadmap State
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [filterFramework, setFilterFramework] = useState<Framework | 'ALL'>('ALL');
  const [filterImpact, setFilterImpact] = useState<'HIGH' | 'MEDIUM' | 'LOW' | 'ALL'>('ALL');

  // Load roadmap from localStorage if it exists
  useEffect(() => {
    const savedRoadmap = localStorage.getItem('cyberguard-roadmap');
    if (savedRoadmap) {
        try {
            const parsed = JSON.parse(savedRoadmap);
            setRoadmap({
                ...parsed,
                generatedAt: new Date(parsed.generatedAt)
            });
        } catch (e) {
            console.error("Failed to parse saved roadmap", e);
        }
    }
  }, []);

  // Save roadmap to localStorage
  useEffect(() => {
    if (roadmap) {
        localStorage.setItem('cyberguard-roadmap', JSON.stringify(roadmap));
    }
  }, [roadmap]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
        const matchStatus = filterStatus === 'ALL' || task.status === filterStatus;
        const matchFramework = filterFramework === 'ALL' || task.framework === filterFramework;
        const matchImpact = filterImpact === 'ALL' || task.impact === filterImpact;
        return matchStatus && matchFramework && matchImpact;
    });
  }, [tasks, filterStatus, filterFramework, filterImpact]);

  const isRoadmapOutdated = useMemo(() => {
    if (!roadmap || tasks.length === 0) return false;
    // Simple check: if any task was added or changed after roadmap generation
    // In a real app we might track task modification dates. 
    // For now, if the number of tasks changed or if the roadmap is older than 5 minutes and tasks exist.
    // Let's just check if the task IDs in the roadmap still match the open tasks.
    const openTaskIds = tasks.filter(t => t.status === TaskStatus.TODO).map(t => t.id).sort().join(',');
    const roadmapTaskIds = roadmap.phases.flatMap(p => p.taskIds).sort().join(',');
    return openTaskIds !== roadmapTaskIds;
  }, [roadmap, tasks]);

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    try {
        const newRoadmap = await generateSecurityRoadmap(tasks);
        setRoadmap(newRoadmap);
        setShowRoadmap(true);
    } catch (error) {
        console.error("Roadmap Error:", error);
    } finally {
        setIsGeneratingRoadmap(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
      setExplanation(null);
      setVerificationResult(null);
      return;
    }

    setExpandedTaskId(task.id);
    setVerificationResult(null);
    
    if (task.explanation) {
        setExplanation(task.explanation);
        setIsExplaining(false);
    } else {
        await fetchExplanation(task);
    }
  };

  const fetchExplanation = async (task: Task) => {
    setExplanation(null);
    setIsExplaining(true);
    try {
      const text = await explainTask(task);
      setExplanation(text);
      onUpdateTask({ ...task, explanation: text });
    } catch (error) {
      console.error("Explain Error:", error);
      setExplanation(error instanceof Error ? error.message : "Fehler beim Laden der Erklärung.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, task: Task) => {
    if (!e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    setIsVerifying(true);
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const result = await verifyDocumentWithAI(task, base64, file.type);
        setVerificationResult(result);
        
        if (result.verified) {
          onUpdateTask({ ...task, status: TaskStatus.DONE });
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 relative">
      <div className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200 -mx-4 px-4 md:-mx-8 md:px-8 mb-6">
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sicherheits-Checkliste</h1>
            <p className="text-slate-500">Ihre individuellen Maßnahmen zur Compliance.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowRoadmap(!showRoadmap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                  showRoadmap ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'
              }`}
            >
              <Calendar size={18} />
              Roadmap
              {isRoadmapOutdated && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Roadmap veraltet"></span>}
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition-all shadow-sm ${
                  showFilters ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
                <Filter size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                        {(['ALL', TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE] as const).map(s => (
                            <button 
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    filterStatus === s ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                                }`}
                            >
                                {s === 'ALL' ? 'Alle' : s}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Framework</label>
                    <div className="flex flex-wrap gap-2">
                        {(['ALL', Framework.BASIC, Framework.BSI, Framework.NIS2, Framework.ISO27001] as const).map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilterFramework(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    filterFramework === f ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                                }`}
                            >
                                {f === 'ALL' ? 'Alle' : f}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priorität</label>
                    <div className="flex flex-wrap gap-2">
                        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(i => (
                            <button 
                                key={i}
                                onClick={() => setFilterImpact(i)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    filterImpact === i ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                                }`}
                            >
                                {i === 'ALL' ? 'Alle' : i}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button 
                    onClick={() => { setFilterStatus('ALL'); setFilterFramework('ALL'); setFilterImpact('ALL'); }}
                    className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                >
                    Filter zurücksetzen
                </button>
            </div>
        </div>
      )}

      {/* Roadmap Section */}
      {showRoadmap && (
        <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-800 rounded-xl">
                            <Calendar size={24} className="text-indigo-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">KI-Sicherheits-Roadmap</h2>
                            <p className="text-indigo-300 text-sm">Empfohlene Strategie zur Umsetzung Ihrer Maßnahmen.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleGenerateRoadmap}
                        disabled={isGeneratingRoadmap}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all backdrop-blur-sm border border-white/10"
                    >
                        {isGeneratingRoadmap ? <RefreshCcw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {roadmap ? 'Neu evaluieren' : 'Roadmap erstellen'}
                    </button>
                </div>

                {isGeneratingRoadmap ? (
                    <div className="space-y-6 py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-indigo-200 font-medium">KI analysiert Ihre Aufgaben und erstellt einen Zeitplan...</p>
                        </div>
                    </div>
                ) : roadmap ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {roadmap.phases.map((phase, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-800/50 px-2 py-1 rounded">
                                        Phase {idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-indigo-300">
                                        <Clock size={14} />
                                        {phase.timeframe}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-200 transition-colors">{phase.title}</h3>
                                <p className="text-sm text-indigo-100/70 mb-6 leading-relaxed">{phase.description}</p>
                                
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Zugeordnete Aufgaben</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {phase.taskIds.map(tid => {
                                            const task = tasks.find(t => t.id === tid);
                                            if (!task) return null;
                                            return (
                                                <div 
                                                    key={tid} 
                                                    onClick={() => {
                                                        setExpandedTaskId(tid);
                                                        const el = document.getElementById(`task-${tid}`);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                    className="px-2 py-1 bg-white/10 rounded text-[10px] font-medium hover:bg-white/20 cursor-pointer transition-colors"
                                                >
                                                    {task.title}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Sparkles size={48} className="text-indigo-400 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">Keine Roadmap vorhanden</h3>
                        <p className="text-indigo-300 mt-2 max-w-sm mx-auto">Lassen Sie die KI Ihre Aufgaben analysieren, um eine optimale Reihenfolge und Zeitplanung zu erhalten.</p>
                        <button 
                            onClick={handleGenerateRoadmap}
                            className="mt-6 px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-all"
                        >
                            Jetzt generieren
                        </button>
                    </div>
                )}
                
                {roadmap && isRoadmapOutdated && (
                    <div className="mt-8 p-4 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-200 text-sm">
                        <AlertTriangle size={20} />
                        <p>Ihre Aufgabenliste hat sich geändert. Die Roadmap sollte neu evaluiert werden, um aktuell zu bleiben.</p>
                        <button 
                            onClick={handleGenerateRoadmap}
                            className="ml-auto px-4 py-1.5 bg-amber-500 text-white rounded-lg font-bold text-xs hover:bg-amber-600 transition-all"
                        >
                            Aktualisieren
                        </button>
                    </div>
                )}
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-800 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-700 rounded-full opacity-10 blur-2xl"></div>
        </div>
      )}

      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <div 
                key={task.id} 
                id={`task-${task.id}`}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isExpanded ? 'border-blue-500 ring-4 ring-blue-50 shadow-xl' : 'border-slate-200 hover:border-blue-300 shadow-sm'
                }`}
              >
                {/* Task Header */}
                <div 
                  onClick={() => handleToggleTask(task)}
                  className="p-5 cursor-pointer flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      task.status === TaskStatus.DONE ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {task.status === TaskStatus.DONE ? <ShieldCheck size={28} /> : <CheckSquare size={28} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(task.status)}`}>
                            {task.status}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getImpactColor(task.impact)}`}>
                            {task.impact}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {task.framework}
                        </span>
                    </div>
                    <h3 className={`text-lg font-bold transition-colors ${isExpanded ? 'text-blue-600' : 'text-slate-900'}`}>
                        {task.title}
                    </h3>
                  </div>

                  <div className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronRight size={20} />
                  </div>
                </div>

                {/* Task Content (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-6 space-y-8">
                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Beschreibung</h4>
                        <p className="text-slate-700 text-lg leading-relaxed">{task.description}</p>
                      </div>

                      {/* AI Explanation */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles size={18} className="text-blue-500" /> KI-Anleitung & Umsetzung
                            </h4>
                            {explanation && !isExplaining && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); fetchExplanation(task); }}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <RefreshCcw size={12} /> Neu generieren
                                </button>
                            )}
                        </div>
                        
                        {isExplaining ? (
                          <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                          </div>
                        ) : (
                          <div className="prose prose-slate prose-sm max-w-none">
                            <Markdown>{explanation || 'Lade Anleitung...'}</Markdown>
                          </div>
                        )}
                      </div>

                      {/* Verification Section */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" /> Nachweis erbringen
                        </h4>
                        <p className="text-sm text-slate-500">
                            Laden Sie einen Screenshot oder ein Dokument hoch. Unsere KI prüft automatisch, ob die Maßnahme korrekt umgesetzt wurde.
                        </p>
                        
                        {verificationResult && (
                          <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in zoom-in-95 ${
                              verificationResult.verified ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                          }`}>
                            {verificationResult.verified ? <CheckCircle2 size={20} className="mt-0.5" /> : <XCircle size={20} className="mt-0.5" />}
                            <div>
                                <p className="font-bold text-sm">{verificationResult.verified ? 'Verifiziert' : 'Nicht ausreichend'}</p>
                                <p className="text-xs mt-0.5 leading-relaxed">{verificationResult.reason}</p>
                            </div>
                          </div>
                        )}

                        <div className="relative">
                          <input 
                            type="file" 
                            onChange={(e) => handleFileUpload(e, task)}
                            disabled={isVerifying}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                              isVerifying ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}>
                            {isVerifying ? (
                                <RefreshCcw size={40} className="text-blue-600 animate-spin" />
                            ) : (
                                <Upload size={40} className="text-slate-300" />
                            )}
                            <div className="text-center">
                                <span className="block text-sm font-bold text-slate-600">
                                    {isVerifying ? 'KI prüft Dokument...' : 'Datei auswählen oder hierher ziehen'}
                                </span>
                                <span className="text-xs text-slate-400">PDF, PNG, JPG (max. 5MB)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Info size={16} />
                            Status: <span className="font-bold text-slate-700">{task.status}</span>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateTask({ ...task, status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE });
                                }}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    task.status === TaskStatus.DONE 
                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                }`}
                            >
                                {task.status === TaskStatus.DONE ? (
                                    <> <RefreshCcw size={16} /> Als offen markieren </>
                                ) : (
                                    <> <CheckCircle2 size={16} /> Manuell abschließen </>
                                )}
                            </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckSquare size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Keine Aufgaben vorhanden</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Starten Sie das Onboarding, um Ihre individuelle Sicherheits-Checkliste zu generieren.</p>
            <button 
              onClick={() => window.location.hash = '#/onboarding'}
              className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Onboarding starten
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditChecklist;
