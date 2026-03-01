import { Task, Framework } from '../types';

export const NIS2_TASKS: Partial<Task>[] = [
  {
    title: 'Risikomanagement-Maßnahmen (Art. 21)',
    description: 'Umsetzung technischer und organisatorischer Maßnahmen zur Beherrschung von Risiken für die Sicherheit von Netz- und Informationssystemen.',
    category: 'Compliance',
    framework: Framework.NIS2,
    impact: 'HIGH'
  },
  {
    title: 'Bewältigung von Sicherheitsvorfällen (Art. 23)',
    description: 'Etablierung von Prozessen zur Erkennung, Analyse und Meldung von Sicherheitsvorfällen.',
    category: 'Incident Management',
    framework: Framework.NIS2,
    impact: 'HIGH'
  },
  {
    title: 'Aufrechterhaltung des Betriebs (BCM)',
    description: 'Erstellung von Notfallplänen und Backup-Management zur Sicherstellung der Geschäftskontinuität.',
    category: 'Kontinuität',
    framework: Framework.NIS2,
    impact: 'HIGH'
  },
  {
    title: 'Sicherheit der Lieferkette',
    description: 'Bewertung der Sicherheitspraktiken von Zulieferern und Dienstleistern.',
    category: 'Lieferkette',
    framework: Framework.NIS2,
    impact: 'MEDIUM'
  },
  {
    title: 'Sicherheit bei Erwerb und Entwicklung',
    description: 'Berücksichtigung von Sicherheitsaspekten bei der Beschaffung und Entwicklung von IT-Systemen.',
    category: 'Entwicklung',
    framework: Framework.NIS2,
    impact: 'MEDIUM'
  },
  {
    title: 'Bewertung der Wirksamkeit',
    description: 'Regelmäßige Überprüfung und Auditierung der getroffenen Sicherheitsmaßnahmen.',
    category: 'Audit',
    framework: Framework.NIS2,
    impact: 'MEDIUM'
  },
  {
    title: 'Cyberhygiene-Praktiken',
    description: 'Grundlegende Maßnahmen wie Software-Updates, starke Passwörter und sichere Konfigurationen.',
    category: 'Betrieb',
    framework: Framework.NIS2,
    impact: 'HIGH'
  },
  {
    title: 'Cybersicherheits-Schulungen',
    description: 'Regelmäßige Sensibilisierung der Mitarbeiter und Schulung der Geschäftsführung.',
    category: 'Schulung',
    framework: Framework.NIS2,
    impact: 'HIGH'
  },
  {
    title: 'Kryptografie und Verschlüsselung',
    description: 'Einsatz von Verschlüsselungsverfahren zum Schutz sensibler Daten.',
    category: 'Technik',
    framework: Framework.NIS2,
    impact: 'MEDIUM'
  },
  {
    title: 'Personal- und Zugriffssicherheit',
    description: 'Konzepte für die Zugriffskontrolle und Sicherheit des Personals.',
    category: 'Personal',
    framework: Framework.NIS2,
    impact: 'MEDIUM'
  },
  {
    title: 'Multi-Faktor-Authentifizierung (MFA)',
    description: 'Einführung von MFA für den Zugriff auf kritische Systeme und Daten.',
    category: 'Zugriffskontrolle',
    framework: Framework.NIS2,
    impact: 'HIGH'
  },
  {
    title: 'Sicherung der Kommunikation',
    description: 'Schutz von Video-, Audio- und Textkommunikation durch Verschlüsselung.',
    category: 'Kommunikation',
    framework: Framework.NIS2,
    impact: 'LOW'
  },
  {
    title: 'Notfallkommunikationssysteme',
    description: 'Bereitstellung gesicherter Kommunikationswege für Krisensituationen.',
    category: 'Notfall',
    framework: Framework.NIS2,
    impact: 'MEDIUM'
  },
  {
    title: 'Asset Management',
    description: 'Vollständige Inventarisierung aller IT-Assets und Verantwortlichkeiten.',
    category: 'Inventar',
    framework: Framework.NIS2,
    impact: 'MEDIUM'
  },
  {
    title: 'Schwachstellenmanagement',
    description: 'Systematische Identifikation und Behebung von Sicherheitslücken.',
    category: 'Technik',
    framework: Framework.NIS2,
    impact: 'HIGH'
  }
];

export const ISO27001_TASKS: Partial<Task>[] = [
  {
    title: 'A.5.1 Informationssicherheits-Richtlinien',
    description: 'Festlegung und Genehmigung von Richtlinien zur Steuerung der Informationssicherheit.',
    category: 'Governance',
    framework: Framework.ISO27001,
    impact: 'HIGH'
  },
  {
    title: 'A.5.7 Threat Intelligence',
    description: 'Sammeln und Analysieren von Informationen über aktuelle Bedrohungen.',
    category: 'Detektion',
    framework: Framework.ISO27001,
    impact: 'LOW'
  },
  {
    title: 'A.5.15 Zugriffskontrolle',
    description: 'Beschränkung des Zugriffs auf Informationen gemäß den geschäftlichen Anforderungen.',
    category: 'Zugriffskontrolle',
    framework: Framework.ISO27001,
    impact: 'HIGH'
  },
  {
    title: 'A.5.30 IKT-Bereitschaft für BCM',
    description: 'Sicherstellung der Verfügbarkeit von IT-Systemen in Krisenfällen.',
    category: 'Kontinuität',
    framework: Framework.ISO27001,
    impact: 'HIGH'
  },
  {
    title: 'A.6.6 Vertraulichkeitsvereinbarungen',
    description: 'Abschluss von NDAs mit Mitarbeitern und externen Partnern.',
    category: 'Recht',
    framework: Framework.ISO27001,
    impact: 'MEDIUM'
  },
  {
    title: 'A.7.2 Bewusstsein und Schulung',
    description: 'Durchführung von Awareness-Programmen für alle Mitarbeiter.',
    category: 'Schulung',
    framework: Framework.ISO27001,
    impact: 'MEDIUM'
  },
  {
    title: 'A.8.1 Endgeräte der Benutzer',
    description: 'Sicherheitsvorgaben für Laptops, Smartphones und andere Endgeräte.',
    category: 'Endgeräte',
    framework: Framework.ISO27001,
    impact: 'HIGH'
  },
  {
    title: 'A.8.10 Speichermedien',
    description: 'Sicherer Umgang mit und Entsorgung von Wechseldatenträgern.',
    category: 'Physisch',
    framework: Framework.ISO27001,
    impact: 'LOW'
  },
  {
    title: 'A.8.11 Schutz vor Datenverlust (DLP)',
    description: 'Maßnahmen zur Verhinderung des unbefugten Abflusses sensibler Daten.',
    category: 'Technik',
    framework: Framework.ISO27001,
    impact: 'MEDIUM'
  },
  {
    title: 'A.8.12 Datensicherung',
    description: 'Regelmäßige Erstellung und Testung von Backups.',
    category: 'Betrieb',
    framework: Framework.ISO27001,
    impact: 'HIGH'
  },
  {
    title: 'A.8.16 Überwachung von Aktivitäten',
    description: 'Protokollierung und Überprüfung von Systemzugriffen und Ereignissen.',
    category: 'Monitoring',
    framework: Framework.ISO27001,
    impact: 'MEDIUM'
  },
  {
    title: 'A.8.20 Netzwerksicherheit',
    description: 'Schutz von Netzwerken und Netzwerkdiensten vor Angriffen.',
    category: 'Netzwerk',
    framework: Framework.ISO27001,
    impact: 'HIGH'
  },
  {
    title: 'A.8.24 Kryptografie',
    description: 'Regelungen für den Einsatz kryptografischer Verfahren.',
    category: 'Technik',
    framework: Framework.ISO27001,
    impact: 'MEDIUM'
  },
  {
    title: 'A.8.28 Sichere Programmierung',
    description: 'Anwendung von Sicherheitsprinzipien bei der Softwareentwicklung.',
    category: 'Entwicklung',
    framework: Framework.ISO27001,
    impact: 'MEDIUM'
  },
  {
    title: 'A.8.32 Änderungsmanagement',
    description: 'Kontrollierte Durchführung von Änderungen an IT-Systemen.',
    category: 'Betrieb',
    framework: Framework.ISO27001,
    impact: 'MEDIUM'
  }
];

export const BSI_TASKS: Partial<Task>[] = [
  {
    title: 'ISMS.1 Sicherheitsmanagement',
    description: 'Aufbau einer Sicherheitsorganisation und Festlegung des Sicherheitsprozesses.',
    category: 'Management',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'ORP.1 Organisation und Personal',
    description: 'Zuweisung von Sicherheitsaufgaben und Prüfung der Vertrauenswürdigkeit.',
    category: 'Organisation',
    framework: Framework.BSI,
    impact: 'MEDIUM'
  },
  {
    title: 'CON.2 Datenschutz',
    description: 'Einhaltung datenschutzrechtlicher Anforderungen (DSGVO).',
    category: 'Recht',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'CON.3 Datensicherungskonzept',
    description: 'Festlegung von Sicherungsstrategien und Aufbewahrungsfristen.',
    category: 'Betrieb',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'OPS.1.1.2 Ordnungsgemäße Entsorgung',
    description: 'Sichere Vernichtung von Dokumenten und Datenträgern.',
    category: 'Physisch',
    framework: Framework.BSI,
    impact: 'LOW'
  },
  {
    title: 'OPS.1.1.4 Patch- und Änderungsmanagement',
    description: 'Zeitnahes Einspielen von Sicherheitsupdates.',
    category: 'Betrieb',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'APP.1.1 Office-Produkte',
    description: 'Sichere Konfiguration von Textverarbeitung und Tabellenkalkulation.',
    category: 'Anwendungen',
    framework: Framework.BSI,
    impact: 'MEDIUM'
  },
  {
    title: 'SYS.1.1 Allgemeiner Server',
    description: 'Grundlegende Absicherung von Server-Betriebssystemen.',
    category: 'Infrastruktur',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'IND.2 Cloud-Nutzung',
    description: 'Sicherheitsprüfung von Cloud-Anbietern und -Diensten.',
    category: 'Infrastruktur',
    framework: Framework.BSI,
    impact: 'MEDIUM'
  },
  {
    title: 'DER.1 Detektion von Sicherheitsvorfällen',
    description: 'Einrichtung von Logging und Monitoring.',
    category: 'Detektion',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'DER.2 Incident Management',
    description: 'Verfahren zur Reaktion auf erkannte Sicherheitsvorfälle.',
    category: 'Reaktion',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'INF.1 Allgemeines Gebäude',
    description: 'Zutrittskontrolle und physischer Schutz der IT-Infrastruktur.',
    category: 'Physisch',
    framework: Framework.BSI,
    impact: 'MEDIUM'
  },
  {
    title: 'NET.1.1 Netz-Architektur und -Design',
    description: 'Sichere Segmentierung des Unternehmensnetzwerks.',
    category: 'Netzwerk',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'NET.3.2 Firewall',
    description: 'Einsatz und korrekte Konfiguration von Firewalls.',
    category: 'Netzwerk',
    framework: Framework.BSI,
    impact: 'HIGH'
  },
  {
    title: 'ORP.3 Sensibilisierung und Schulung',
    description: 'Regelmäßige Unterweisung der Mitarbeiter in IT-Sicherheit.',
    category: 'Schulung',
    framework: Framework.BSI,
    impact: 'MEDIUM'
  }
];
