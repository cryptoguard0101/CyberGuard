// This service simulates the database connection state for the application.

export type DbMode = 'LOCAL_SINGLE_USER' | 'NETWORK_MULTI_USER';

export interface DbConfig {
  mode: DbMode;
  connectionString?: string; // For simulation purposes
  dbType?: 'PostgreSQL' | 'SQLite' | 'MySQL';
}

const DB_CONFIG_KEY = 'kmu-cyberguard-db-config';

const DEFAULT_CONFIG: DbConfig = {
  mode: 'LOCAL_SINGLE_USER'
};

export const getDbConfig = (): DbConfig => {
  const stored = localStorage.getItem(DB_CONFIG_KEY);
  if (!stored) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const saveDbConfig = (config: DbConfig) => {
  localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
};

/**
 * Checks if the application is configured for multi-user network mode.
 * @returns {boolean} True if in network mode, false otherwise.
 */
export const isNetworkMode = (): boolean => {
  const config = getDbConfig();
  return config.mode === 'NETWORK_MULTI_USER';
};

/**
 * Dispatches a global event to open the database configuration wizard from any component.
 */
export const triggerDbConfigWizard = () => {
  window.dispatchEvent(new CustomEvent('open-db-wizard'));
};