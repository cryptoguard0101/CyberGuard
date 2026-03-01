import { Task, User, UserRole } from '../types';
import { INITIAL_TASKS } from '../constants';
import { generateKeyFromPassword } from './cryptoService';

// --- SIMULATION CONFIG ---
const SIMULATED_LATENCY = 300; // ms
const SHARED_DATA_KEY = 'kmu-cyberguard-SHARED-DATA';

interface SharedData {
  users: User[];
  tasks: Task[];
}

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper to get shared data from localStorage
const getSharedData = async (): Promise<SharedData> => {
    await delay(SIMULATED_LATENCY / 2); // Shorter delay for reads
    const rawData = localStorage.getItem(SHARED_DATA_KEY);
    if (rawData) {
        return JSON.parse(rawData);
    }
    // Default initial state if nothing is stored
    return { users: [], tasks: INITIAL_TASKS };
};

// Helper to save shared data to localStorage
const saveSharedData = async (data: SharedData) => {
    await delay(SIMULATED_LATENCY);
    localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(data));
};

// --- USER API ---

export const getUsers = async (): Promise<User[]> => {
    const data = await getSharedData();
    return data.users;
};

export const login = async (username: string, key: string): Promise<User | null> => {
    const data = await getSharedData();
    const user = data.users.find(u => u.username?.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());

    if (!user) {
        // Handle first-time registration
        if (data.users.length === 0) {
            const newUser: User = {
                id: '1',
                username,
                email: `${username.split(' ')[0].toLowerCase()}@firma.de`,
                role: 'ADMIN',
                encryptionKey: key, // Still store key for potential future use
                lastLogin: new Date(),
            };
            data.users.push(newUser);
            await saveSharedData(data);
            return newUser;
        }
        return null; // User not found and it's not the first registration
    }

    // In a real app, you'd verify the password/passkey against a server hash
    // Here we assume if the user is found, login is successful for the demo
    
    // Update last login time
    user.lastLogin = new Date();
    user.failedLoginAttempts = 0;
    await saveSharedData(data);

    return user;
};

export const recordFailedLogin = async (username: string) => {
    const data = await getSharedData();
    const userIndex = data.users.findIndex(u => (u.username && u.username.toLowerCase() === username.toLowerCase()) || u.email.toLowerCase() === username.toLowerCase());
    
    if (userIndex > -1) {
        const user = data.users[userIndex];
        const now = new Date();
        let currentAttempts = user.failedLoginAttempts || 0;
        
        if (user.lastFailedLogin) {
            const lastFail = new Date(user.lastFailedLogin);
            const hoursDiff = (now.getTime() - lastFail.getTime()) / (1000 * 60 * 60);
            if (hoursDiff > 24) currentAttempts = 0;
        }
        
        const newAttempts = currentAttempts + 1;
        user.failedLoginAttempts = newAttempts;
        user.lastFailedLogin = now;
        if (newAttempts >= 3) {
            user.isLocked = true;
        }
        
        data.users[userIndex] = user;
        await saveSharedData(data);
    }
};

export const addUser = async (userData: { username: string, email: string, role: UserRole, validUntil: Date | null }) => {
    const data = await getSharedData();
    const DEMO_SALT = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    
    // In a real app, the server would handle password hashing etc.
    // For simulation, we create a dummy key.
    const dummyKey = await generateKeyFromPassword('password', DEMO_SALT);
    
    const newUser: User = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        role: userData.role,
        encryptionKey: dummyKey, // Now returns string
        validUntil: userData.validUntil,
    };
    data.users.push(newUser);
    await saveSharedData(data);
};

export const updateUser = async (id: string, updates: Partial<User>) => {
    const data = await getSharedData();
    const userIndex = data.users.findIndex(u => u.id === id);
    if (userIndex > -1) {
        data.users[userIndex] = { ...data.users[userIndex], ...updates };
        await saveSharedData(data);
    }
};

export const deleteUser = async (id: string) => {
    const data = await getSharedData();
    data.users = data.users.filter(u => u.id !== id);
    await saveSharedData(data);
};

// --- TASK API ---

export const getTasks = async (): Promise<Task[]> => {
    const data = await getSharedData();
    return data.tasks;
};

export const saveTasks = async (tasks: Task[]) => {
    const data = await getSharedData();
    data.tasks = tasks;
    await saveSharedData(data);
};
