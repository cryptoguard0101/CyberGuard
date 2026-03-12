import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuditChecklist from './components/AuditChecklist';
import FrameworkCatalog from './components/FrameworkCatalog';
import AiAssistant from './components/AiAssistant';
import OnboardingHub from './components/OnboardingChat';
import HelpSection from './components/HelpSection';
import { AuthScreens } from './components/AuthScreens';
import DbConfigWizard from './components/DbConfigWizard';
import AdminPage from './components/AdminPage';
import Impressum from './components/Impressum';
import Datenschutz from './components/Datenschutz';
import EmergencyHub from './components/EmergencyHub';
import ReportingHub from './components/ReportingHub';
import DomainScanner from './components/DomainScanner';
import { Task, User, UserRole, Framework } from './types';
import * as api from './services/apiService';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDbWizardOpen, setIsDbWizardOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in, fetch their profile
        const userProfile = await api.getUsers().then(users => users.find(u => u.id === firebaseUser.uid));
        if (userProfile) {
          setUser(userProfile);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Data Listeners
  useEffect(() => {
    if (!isAuthReady || !user) {
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);

    // Listen to users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const updatedUsers = snapshot.docs.map(doc => doc.data() as User);
      setUsers(updatedUsers);
      
      // Update current user if it changed
      const updatedCurrentUser = updatedUsers.find(u => u.id === user.id);
      if (updatedCurrentUser) {
        setUser(updatedCurrentUser);
      }
    }, (error) => {
      console.error("Error listening to users:", error);
    });

    // Listen to tasks
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), async (snapshot) => {
      let updatedTasks = snapshot.docs.map(doc => doc.data() as Task);
      
      // Ensure basic tasks exist
      if (updatedTasks.length === 0) {
        updatedTasks = await api.getTasks(); // This will seed if empty
      }
      
      setTasks(updatedTasks);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Error listening to tasks:", error);
      setIsLoadingData(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
    };
  }, [isAuthReady, user?.id]); // Depend on user.id to avoid re-triggering on every user update

  const handleLogin = async (username: string, key: string, userObject?: User) => {
    if (userObject) {
      setUser(userObject);
    }
  };

  const handleLoginFail = async (username: string) => {
    // Handled by Firebase Auth
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    await api.updateTask(updatedTask.id, updatedTask);
  };

  const addTasks = async (newTasks: Task[]) => {
    await api.addTasks(newTasks);
  };
  
  const handleRemoveModule = async (moduleId: string) => {
    const frameworkMap: Record<string, Framework> = {
      'nis2': Framework.NIS2,
      'iso27001': Framework.ISO27001,
      'bsi': Framework.BSI,
      'gdpr': Framework.GDPR,
      'cis': Framework.CIS
    };
    
    const frameworkToRemove = frameworkMap[moduleId];
    if (!frameworkToRemove) return;

    await api.deleteTasksByFramework(frameworkToRemove);
  };

  const handleUpdateAnyUser = async (userId: string, updates: Partial<User>) => {
    await api.updateUser(userId, updates);
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!user) return;
    await handleUpdateAnyUser(user.id, updates);
  };

  const handleToggleUserLock = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      const isLocking = !userToUpdate.isLocked;
      
      if (isLocking && userToUpdate.role === 'ADMIN') {
        const activeAdmins = users.filter(u => u.role === 'ADMIN' && !u.isLocked && u.id !== userId);
        if (activeAdmins.length === 0) {
          alert("Der letzte aktive Administrator kann nicht gesperrt werden.");
          return;
        }
      }

      await api.updateUser(userId, { isLocked: isLocking });
    }
  };

  const handleCreateUser = async (userData: Partial<User>): Promise<{success: boolean, error?: string, user?: User}> => {
    // In Firebase Auth, creating a user requires email/password or admin SDK.
    // For this demo, we'll just add the user document. They would need to login with Google using that email.
    const emailExists = users.some(u => u.email.toLowerCase() === userData.email?.toLowerCase());
    if (emailExists) {
      return { success: false, error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.' };
    }

    try {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: userData.email!,
        username: userData.username!,
        role: userData.role!,
        encryptionKey: userData.encryptionKey || 'firebase-auth',
        ...userData,
        lastLogin: new Date(),
        isLocked: false,
      } as User;

      await api.registerUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      return { success: false, error: 'Server-Fehler beim Erstellen des Benutzers.' };
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: UserRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      if (userToUpdate.role === 'ADMIN' && newRole !== 'ADMIN') {
        const activeAdmins = users.filter(u => u.role === 'ADMIN' && !u.isLocked && u.id !== userId);
        if (activeAdmins.length === 0) {
          alert("Die Rolle des letzten verbleibenden Admins kann nicht verändert werden.");
          return;
        }
      }
      
      await api.updateUser(userId, { role: newRole });
    }
  };

  const handleResetMfa = async (userId: string) => {
    // Not applicable with Google Login, but kept for compatibility
  };

  if (!isAuthReady || (isLoadingData && user)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Lade Anwendung...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
        <AuthScreens 
            onLogin={handleLogin} 
            onLoginFail={handleLoginFail}
            onRegister={handleCreateUser}
            users={users} 
        />
    );
  }

  return (
    <HashRouter>
      <DbConfigWizard isOpen={isDbWizardOpen} onClose={() => setIsDbWizardOpen(false)} />
      <Layout user={user} tasks={tasks} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
        <Routes>
          <Route path="/" element={<Dashboard tasks={tasks} user={user} />} />
          <Route 
            path="/onboarding"
            element={<OnboardingHub user={user} onAddTasks={addTasks} tasks={tasks} onUpdateUser={handleUpdateUser} />}
          />
          <Route 
            path="/audit" 
            element={<AuditChecklist tasks={tasks} user={user} users={users} onUpdateTask={updateTask} />} 
          />
          <Route 
            path="/catalog" 
            element={<FrameworkCatalog onAddTasks={addTasks} tasks={tasks} onRemoveModule={handleRemoveModule} />} 
          />
          <Route path="/assistant" element={<AiAssistant />} />
          <Route path="/scanner" element={<DomainScanner onAddTasks={addTasks} />} />
          <Route path="/emergency" element={<EmergencyHub />} />
          <Route path="/reporting" element={<ReportingHub tasks={tasks} />} />
          <Route path="/help" element={<HelpSection />} />
          <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminPage users={users} onToggleUserLock={handleToggleUserLock} onChangeUserRole={handleChangeUserRole} onCreateUser={handleCreateUser} onResetMfa={handleResetMfa} onUpdateUser={handleUpdateAnyUser} /> : <Navigate to="/" replace />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
