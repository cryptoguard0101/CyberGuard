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
  },

  // --- BSI IT-GRUNDSCHUTZ ---
  {
    id: 'bsi-1',
    title: 'ISMS.1 Sicherheitsmanagement',
    description: 'Etablierung eines Informationssicherheits-Managementsystems (ISMS) nach BSI-Standard 200-1.',
    status: TaskStatus.TODO,
    category: 'Management',
    framework: Framework.BSI,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'bsi-2',
    title: 'ORP.1 Organisation und Personal',
    description: 'Festlegung von Rollen und Verantwortlichkeiten für die Informationssicherheit.',
    status: TaskStatus.TODO,
    category: 'Organisation',
    framework: Framework.BSI,
    impact: 'MEDIUM',
    source: 'DEFAULT'
  },
  {
    id: 'bsi-3',
    title: 'CON.3 Datensicherungskonzept',
    description: 'Erstellung und regelmäßige Prüfung eines Konzepts zur Datensicherung und Wiederherstellung.',
    status: TaskStatus.TODO,
    category: 'Betrieb',
    framework: Framework.BSI,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'bsi-4',
    title: 'OPS.1.1.4 Patch- und Änderungsmanagement',
    description: 'Systematisches Einspielen von Sicherheitsupdates für alle IT-Systeme.',
    status: TaskStatus.TODO,
    category: 'Betrieb',
    framework: Framework.BSI,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'bsi-5',
    title: 'IND.2 Cloud-Nutzung',
    description: 'Sicherheitsanforderungen für die Nutzung von Cloud-Diensten definieren und prüfen.',
    status: TaskStatus.TODO,
    category: 'Infrastruktur',
    framework: Framework.BSI,
    impact: 'MEDIUM',
    source: 'DEFAULT'
  },

  // --- ISO 27001 ---
  {
    id: 'iso-1',
    title: 'A.5 Informationssicherheits-Richtlinien',
    description: 'Erstellung und Genehmigung eines Satzes von Richtlinien für die Informationssicherheit.',
    status: TaskStatus.TODO,
    category: 'Governance',
    framework: Framework.ISO27001,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'iso-2',
    title: 'A.8 Inventarisierung der Werte',
    description: 'Erfassung aller Informationswerte und Zuweisung von Verantwortlichkeiten (Asset Owner).',
    status: TaskStatus.TODO,
    category: 'Asset Management',
    framework: Framework.ISO27001,
    impact: 'MEDIUM',
    source: 'DEFAULT'
  },
  {
    id: 'iso-3',
    title: 'A.9 Zugriffskontrolle',
    description: 'Einrichtung formaler Verfahren für die Benutzerregistrierung und -abmeldung.',
    status: TaskStatus.TODO,
    category: 'Zugriffskontrolle',
    framework: Framework.ISO27001,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'iso-4',
    title: 'A.12 Betriebssicherheit',
    description: 'Schutz vor Schadsoftware und Durchführung regelmäßiger Schwachstellen-Scans.',
    status: TaskStatus.TODO,
    category: 'Betrieb',
    framework: Framework.ISO27001,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'iso-5',
    title: 'A.17 Informationssicherheitsaspekte des BCM',
    description: 'Planung und Umsetzung der Informationssicherheit in Notfallsituationen.',
    status: TaskStatus.TODO,
    category: 'Kontinuität',
    framework: Framework.ISO27001,
    impact: 'MEDIUM',
    source: 'DEFAULT'
  },

  // --- NIS2 ---
  {
    id: 'nis2-1',
    title: 'NIS2 Art. 21: Risikomanagement',
    description: 'Umsetzung technischer und organisatorischer Maßnahmen zur Beherrschung von Risiken für die Sicherheit von Netz- und Informationssystemen.',
    status: TaskStatus.TODO,
    category: 'Compliance',
    framework: Framework.NIS2,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'nis2-2',
    title: 'NIS2 Art. 23: Berichtspflichten',
    description: 'Etablierung von Prozessen zur Meldung erheblicher Sicherheitsvorfälle an die zuständigen Behörden innerhalb von 24 Stunden.',
    status: TaskStatus.TODO,
    category: 'Meldewesen',
    framework: Framework.NIS2,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'nis2-3',
    title: 'Sicherheit der Lieferkette',
    description: 'Bewertung der Sicherheitspraktiken von Zulieferern und Dienstleistern (Supply Chain Security).',
    status: TaskStatus.TODO,
    category: 'Lieferkette',
    framework: Framework.NIS2,
    impact: 'MEDIUM',
    source: 'DEFAULT'
  },
  {
    id: 'nis2-4',
    title: 'Schulung der Geschäftsführung',
    description: 'Verpflichtende Cybersicherheits-Schulungen für die oberste Leitungsebene gemäß NIS2-Vorgaben.',
    status: TaskStatus.TODO,
    category: 'Schulung',
    framework: Framework.NIS2,
    impact: 'HIGH',
    source: 'DEFAULT'
  },
  {
    id: 'nis2-5',
    title: 'Kryptografie und Verschlüsselung',
    description: 'Einsatz von Verschlüsselungsverfahren zum Schutz sensibler Daten in Ruhe und bei der Übertragung.',
    status: TaskStatus.TODO,
    category: 'Technik',
    framework: Framework.NIS2,
    impact: 'MEDIUM',
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