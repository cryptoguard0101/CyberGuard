import { Framework, Task, TaskStatus } from './types';

export const INITIAL_TASKS: Task[] = [
  // --- BASIC SECURITY ---
  {
    id: 'b-1',
    title: 'Automatische Updates aktivieren',
    description: 'Stellen Sie sicher, dass Betriebssysteme und Anwendungen automatisch aktualisiert werden.',
    status: TaskStatus.TODO,
    category: 'Systemhärtung',
    framework: Framework.BASIC,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'b-2',
    title: 'Virenschutz installieren',
    description: 'Ein aktueller Virenscanner muss auf allen Endgeräten installiert und aktiv sein.',
    status: TaskStatus.TODO,
    category: 'Endgeräteschutz',
    framework: Framework.BASIC,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'b-3',
    title: 'Passwort-Richtlinie',
    description: 'Einführung einer Richtlinie für starke Passwörter (min. 12 Zeichen, Sonderzeichen).',
    status: TaskStatus.TODO,
    category: 'Zugriffskontrolle',
    framework: Framework.BASIC,
    impact: 'MEDIUM',
    source: 'DEFAULT'
  },
  {
    id: 'b-4',
    title: 'Offline-Backups',
    description: 'Regelmäßige Datensicherungen, die nicht dauerhaft mit dem Netzwerk verbunden sind.',
    status: TaskStatus.TODO,
    category: 'Datensicherung',
    framework: Framework.BASIC,
    impact: 'HIGH',
    source: 'DEFAULT'
  }
];

export const COLORS = {
  primary: '#2563eb', // blue-600
  success: '#16a34a', // green-600
  warning: '#ca8a04', // yellow-600
  danger: '#dc2626', // red-600
  neutral: '#64748b' // slate-500
};