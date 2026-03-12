import { Task, User, UserRole, Framework } from '../types';
import { INITIAL_TASKS } from '../constants';
import { db, auth } from '../firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { generateKeyFromPassword } from './cryptoService';

// --- USER API ---

export const getUsers = async (): Promise<User[]> => {
    try {
        const usersCol = collection(db, 'users');
        const userSnapshot = await getDocs(usersCol);
        return userSnapshot.docs.map(doc => doc.data() as User);
    } catch (e) {
        console.error("Error fetching users:", e);
        return [];
    }
};

export const login = async (username: string, key: string): Promise<User | null> => {
    // Legacy support for local login. In a real Firebase app, use Firebase Auth.
    // We'll simulate finding the user by email/username in Firestore for now.
    try {
        const users = await getUsers();
        const user = users.find(u => u.username?.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
        
        if (!user) {
            if (users.length === 0) {
                const newUser: User = {
                    id: '1',
                    username,
                    email: `${username.split(' ')[0].toLowerCase()}@firma.de`,
                    role: 'ADMIN',
                    encryptionKey: key,
                    lastLogin: new Date(),
                };
                await setDoc(doc(db, 'users', newUser.id), newUser);
                return newUser;
            }
            return null;
        }
        
        await updateDoc(doc(db, 'users', user.id), { lastLogin: new Date().toISOString(), failedLoginAttempts: 0 });
        return { ...user, lastLogin: new Date() };
    } catch (e) {
        console.error("Login error:", e);
        return null;
    }
};

export const recordFailedLogin = async (username: string) => {
    try {
        const users = await getUsers();
        const user = users.find(u => u.username?.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
        if (user) {
            const now = new Date();
            let currentAttempts = user.failedLoginAttempts || 0;
            if (user.lastFailedLogin) {
                const lastFail = new Date(user.lastFailedLogin);
                const hoursDiff = (now.getTime() - lastFail.getTime()) / (1000 * 60 * 60);
                if (hoursDiff > 24) currentAttempts = 0;
            }
            const newAttempts = currentAttempts + 1;
            await updateDoc(doc(db, 'users', user.id), {
                failedLoginAttempts: newAttempts,
                lastFailedLogin: now.toISOString(),
                isLocked: newAttempts >= 3 ? true : user.isLocked
            });
        }
    } catch (e) {
        console.error("Failed login record error:", e);
    }
};

export const addUser = async (userData: { username: string, email: string, role: UserRole, validUntil: Date | null }) => {
    try {
        const DEMO_SALT = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        const dummyKey = await generateKeyFromPassword('password', DEMO_SALT);
        
        const newUser: User = {
            id: Date.now().toString(),
            username: userData.username,
            email: userData.email,
            role: userData.role,
            encryptionKey: dummyKey,
            validUntil: userData.validUntil,
        };
        await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (e) {
        console.error("Add user error:", e);
    }
};

export const updateUser = async (id: string, updates: Partial<User>) => {
    try {
        await updateDoc(doc(db, 'users', id), updates);
    } catch (e) {
        console.error("Update user error:", e);
    }
};

export const deleteUser = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'users', id));
    } catch (e) {
        console.error("Delete user error:", e);
    }
};

export const registerUser = async (user: User) => {
    try {
        await setDoc(doc(db, 'users', user.id), user);
    } catch (e) {
        console.error("Register user error:", e);
    }
};

// --- TASK API ---

export const getTasks = async (): Promise<Task[]> => {
    try {
        const tasksCol = collection(db, 'tasks');
        const taskSnapshot = await getDocs(tasksCol);
        let tasks = taskSnapshot.docs.map(doc => doc.data() as Task);
        
        const hasBasicTasks = tasks.some(t => t.framework === Framework.BASIC);
        if (!hasBasicTasks) {
            tasks = [...INITIAL_TASKS, ...tasks];
            await saveTasks(tasks);
        }
        return tasks;
    } catch (e) {
        console.error("Error fetching tasks:", e);
        return INITIAL_TASKS;
    }
};

export const saveTasks = async (tasks: Task[]) => {
    try {
        const batch = tasks.map(task => setDoc(doc(db, 'tasks', task.id), task));
        await Promise.all(batch);
    } catch (e) {
        console.error("Error saving tasks:", e);
    }
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
        await updateDoc(doc(db, 'tasks', taskId), updates);
    } catch (e) {
        console.error("Error updating task:", e);
    }
};

export const saveTask = async (task: Task) => {
    try {
        await setDoc(doc(db, 'tasks', task.id), task);
    } catch (e) {
        console.error("Error saving task:", e);
    }
};

export const deleteTasksByFramework = async (framework: Framework) => {
    try {
        const tasks = await getTasks();
        const filteredTasks = tasks.filter(t => t.framework !== framework);
        // We need to delete the ones that match
        const tasksToDelete = tasks.filter(t => t.framework === framework);
        const batch = tasksToDelete.map(task => deleteDoc(doc(db, 'tasks', task.id)));
        await Promise.all(batch);
    } catch (e) {
        console.error("Error deleting tasks by framework:", e);
    }
};

export const addTasks = async (newTasks: Task[]) => {
    try {
        const batch = newTasks.map(task => setDoc(doc(db, 'tasks', task.id), task));
        await Promise.all(batch);
    } catch (e) {
        console.error("Error adding tasks:", e);
    }
};
