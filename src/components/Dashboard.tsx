import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus, Framework, User } from '../types';
import { COLORS } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { CheckCircle2, AlertTriangle, Shield, TrendingUp, Handshake, ArrowRight, Zap, Target } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  user?: User | null; 
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, user }) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, todo, percentage };
  }, [tasks]);

  const hasOnboardingTasks = useMemo(() => {
    return tasks.some(t => t.source === 'ONBOARDING' || t.source === 'GENERATOR');
  }, [tasks]);

  const nextMission = useMemo(() => {
      // Logic: Find HIGH impact, TODO task. If none, find MEDIUM impact.
      const highImpact = tasks.find(t => t.status === TaskStatus.TODO && t.impact === 'HIGH');
      if (highImpact) return highImpact;
      return tasks.find(t => t.status === TaskStatus.TODO);
  }, [tasks]);

  const frameworkData = useMemo(() => {
    const frameworks = [Framework.BASIC, Framework.BSI, Framework.NIS2, Framework.ISO27001];
    return frameworks.map(fw => {
      const fwTasks = tasks.filter(t => t.framework === fw);
      const done = fwTasks.filter(t => t.status === TaskStatus.DONE).length;
      return {
        name: fw,
        Gesamt: fwTasks.length,
        Erledigt: done,
      };
    }).filter(f => f.Gesamt > 0);
  }, [tasks]);

  const activeFrameworksCount = useMemo(() => {
    const frameworks = [Framework.BSI, Framework.NIS2, Framework.ISO27001, Framework.GDPR, Framework.CIS];
    return frameworks.filter(fw => tasks.some(t => t.framework === fw)).length;
  }, [tasks]);

  const totalAvailableFrameworks = 5; // BSI, NIS2, ISO27001, GDPR, CIS

  const statusData = [
    { name: 'Erledigt', value: stats.completed, color: COLORS.success },
    { name: 'In Arbeit', value: stats.inProgress, color: COLORS.warning },
    { name: 'Offen', value: stats.todo, color: COLORS.neutral },
  ].filter(d => d.value > 0);

  const priorityData = useMemo(() => {
    const high = tasks.filter(t => t.impact === 'HIGH').length;
    const medium = tasks.filter(t => t.impact === 'MEDIUM').length;
    const low = tasks.filter(t => t.impact === 'LOW').length;
    
    return [
      { name: 'Hoch', value: high, color: '#ef4444' },
      { name: 'Mittel', value: medium, color: '#f59e0b' },
      { name: 'Niedrig', value: low, color: '#3b82f6' },
    ].filter(d => d.value > 0);
  }, [tasks]);

  const nis2Score = useMemo(() => {
    const nis2Tasks = tasks.filter(t => t.framework === Framework.NIS2);
    if (nis2Tasks.length === 0) return 0;
    const done = nis2Tasks.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((done / nis2Tasks.length) * 100);
  }, [tasks]);

  // Data for the gauge chart
  const gaugeData = [
    { name: 'Score', value: nis2Score, color: nis2Score >= 80 ? COLORS.success : nis2Score >= 50 ? COLORS.warning : COLORS.danger },
    { name: 'Remaining', value: 100 - nis2Score, color: '#e2e8f0' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title - Always visible */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sicherheits-Dashboard</h1>
        <p className="text-slate-500">Überblick über Ihren aktuellen Sicherheitsstatus und Compliance.</p>
      </div>

      {/* COACHING WIDGET (Visible only if active) */}
      {user?.coaching?.isActive && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden animate-in slide-in-from-top duration-500">
              {/* Background Decoration */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                      <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                          <Zap size={32} className="text-yellow-200 fill-yellow-200" />
                      </div>
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-xl font-bold">{!hasOnboardingTasks ? "Willkommen beim CyberCoach!" : "CyberCoach Modus: Aktiv"}</h2>
                              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold border border-white/20">
                                  Tag {user.coaching.streakDays}
                              </span>
                          </div>
                          <p className="text-orange-50 opacity-90 max-w-xl">
                              {!hasOnboardingTasks 
                                ? "Ihr erster Schritt zur digitalen Sicherheit beginnt hier. Schließen Sie das Kennenlernen ab, um loszulegen."
                                : `Großartig! Sie bauen einen echten Sicherheits-Schutzwall auf. ${stats.percentage < 100 ? "Bleiben Sie dran, um Ihr Unternehmen sicher zu machen." : "Fantastisch, alles erledigt!"}`
                              }
                          </p>
                      </div>
                  </div>

                  {/* Mission Block - Onboarding or Next Task */}
                  {!hasOnboardingTasks ? (
                      <div className="bg-white text-slate-800 p-4 rounded-xl shadow-lg max-w-sm w-full transform transition-transform hover:scale-105 cursor-pointer border-l-4 border-orange-600" onClick={() => navigate('/onboarding')}>
                          <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
                                  <Target size={14} />
                                  IHRE ERSTE MISSION
                              </div>
                              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                  Onboarding
                              </span>
                          </div>
                          <h3 className="font-bold text-sm mb-1 line-clamp-1">Unternehmen kennenlernen</h3>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                             <span>Klicke zum Starten</span>
                             <ArrowRight size={12} />
                          </div>
                      </div>
                  ) : nextMission ? (
                      <div className="bg-white text-slate-800 p-4 rounded-xl shadow-lg max-w-sm w-full transform transition-transform hover:scale-105 cursor-pointer border-l-4 border-orange-600" onClick={() => navigate('/audit')}>
                          <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
                                  <Target size={14} />
                                  Tagesmission
                              </div>
                              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                  {nextMission.category}
                              </span>
                          </div>
                          <h3 className="font-bold text-sm mb-1 line-clamp-1">{nextMission.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                             <span>Klicke zum Erledigen</span>
                             <ArrowRight size={12} />
                          </div>
                      </div>
                  ) : (
                     <div className="bg-white text-slate-800 p-4 rounded-xl shadow-lg max-w-sm w-full border-l-4 border-green-500">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                  <CheckCircle2 size={20} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-sm">Alles erledigt!</h3>
                                  <p className="text-xs text-slate-500">Sie haben alle Aufgaben abgeschlossen. Gut gemacht!</p>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Onboarding Reminder Banner (only if coach is OFF and onboarding not done) */}
      {!user?.coaching?.isActive && !hasOnboardingTasks && (
        <div 
            onClick={() => navigate('/onboarding')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg cursor-pointer transform transition-all hover:scale-[1.01] flex items-center justify-between"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                    <Handshake size={32} className="text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Kennenlernen abschließen</h3>
                    <p className="text-indigo-100 opacity-90 max-w-xl">
                        Wir haben noch kein vollständiges Unternehmensprofil von Ihnen. Schließen Sie das Interview ab, um maßgeschneiderte Sicherheits-Tipps zu erhalten.
                    </p>
                </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors font-medium">
                <span>Jetzt starten</span>
                <ArrowRight size={16} />
            </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
            onClick={() => navigate('/audit')}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Gesamtfortschritt</p>
            <p className="text-2xl font-bold text-slate-900">{stats.percentage}%</p>
          </div>
        </div>
        
        <div 
            onClick={() => navigate('/audit')}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
        >
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Erledigte Maßnahmen</p>
            <p className="text-2xl font-bold text-slate-900">{stats.completed}/{stats.total}</p>
          </div>
        </div>

        <div 
            onClick={() => navigate('/audit')}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all"
        >
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Kritische Offene</p>
            <p className="text-2xl font-bold text-slate-900">
              {tasks.filter(t => t.impact === 'HIGH' && t.status !== TaskStatus.DONE).length}
            </p>
          </div>
        </div>

        <div 
            onClick={() => navigate('/catalog')}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Frameworks</p>
            <p className="text-2xl font-bold text-slate-900">{activeFrameworksCount} von {totalAvailableFrameworks} Aktiv</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NIS2 Readiness Gauge */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative">
          <h3 className="text-lg font-semibold text-slate-800 mb-2 w-full text-left">NIS2 Readiness Score</h3>
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-2">
              <span className="text-4xl font-black text-slate-900">{nis2Score}%</span>
              <span className="text-sm text-slate-500 font-medium">Umsetzungsgrad</span>
            </div>
          </div>
        </div>

        {/* Priority Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Aufgaben nach Priorität</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Aufgabenverteilung</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Framework Progress Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Fortschritt nach Framework</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={frameworkData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend />
                <Bar dataKey="Gesamt" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="Erledigt" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;