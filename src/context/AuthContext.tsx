import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types';
import { hashPassword, verifyPassword, generateSalt } from '../lib/authCrypto';
import { formatISTDateTime } from '../lib/dateUtils';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  limit,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

interface AuthContextType {
  currentUser: UserAccount | null;
  isLoading: boolean;
  hasOwnerAccount: boolean;
  loginError: string | null;
  createOwnerAccount: (fullName: string, userId: string, password: string) => Promise<boolean>;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: UserAccount[];
  addUser: (fullName: string, userId: string, password: string, role: UserRole) => Promise<boolean>;
  updateUser: (user: Partial<UserAccount> & { id: string }) => Promise<boolean>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
  isOwner: boolean;
  isStaff: boolean;
  isTechnician: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'nw_service_session_user';
const USERS_CACHE_KEY = 'nw_service_users_cache';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [hasOwnerAccount, setHasOwnerAccount] = useState<boolean>(true); // default true until checked
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize Firebase anonymous auth session so rules and requests are authenticated
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Anonymous sign-in note:', err);
      }
    };
    initAuth();
  }, []);

  // Fetch users from Firestore / LocalStorage
  const refreshUsers = async () => {
    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      const loadedUsers: UserAccount[] = [];
      snapshot.forEach(docSnap => {
        loadedUsers.push({ id: docSnap.id, ...(docSnap.data() as Omit<UserAccount, 'id'>) });
      });

      if (loadedUsers.length > 0) {
        setUsers(loadedUsers);
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(loadedUsers));
        const ownerExists = loadedUsers.some(u => u.role === 'Owner' && u.status === 'active');
        setHasOwnerAccount(ownerExists);
      } else {
        // Check localStorage cache
        const cached = localStorage.getItem(USERS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as UserAccount[];
          setUsers(parsed);
          setHasOwnerAccount(parsed.some(u => u.role === 'Owner' && u.status === 'active'));
        } else {
          setUsers([]);
          setHasOwnerAccount(false);
        }
      }
    } catch (err) {
      console.warn('Could not fetch users from Firestore, using offline cache:', err);
      const cached = localStorage.getItem(USERS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserAccount[];
        setUsers(parsed);
        setHasOwnerAccount(parsed.some(u => u.role === 'Owner' && u.status === 'active'));
      } else {
        setUsers([]);
        setHasOwnerAccount(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, check session and users
  useEffect(() => {
    const init = async () => {
      // Check stored session
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const parsedUser = JSON.parse(savedSession) as UserAccount;
          setCurrentUser(parsedUser);
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      await refreshUsers();
    };
    init();
  }, []);

  // First-time setup: Create Owner Account
  const createOwnerAccount = async (fullName: string, userId: string, password: string): Promise<boolean> => {
    try {
      setLoginError(null);
      const cleanUserId = userId.trim().toLowerCase();
      if (!cleanUserId || !fullName.trim() || !password) {
        setLoginError('All fields are required.');
        return false;
      }

      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      const now = formatISTDateTime();

      const newOwner: UserAccount = {
        id: cleanUserId,
        userId: cleanUserId,
        fullName: fullName.trim(),
        role: 'Owner',
        passwordHash,
        salt,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', cleanUserId), {
          userId: cleanUserId,
          fullName: newOwner.fullName,
          role: 'Owner',
          passwordHash,
          salt,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${cleanUserId}`);
      }

      // Update state & cache
      const updated = [newOwner];
      setUsers(updated);
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updated));
      setHasOwnerAccount(true);

      // Auto login owner
      setCurrentUser(newOwner);
      localStorage.setItem(SESSION_KEY, JSON.stringify(newOwner));
      return true;
    } catch (err: unknown) {
      console.error('Owner account creation error:', err);
      setLoginError('Failed to create Owner account. Please try again.');
      return false;
    }
  };

  // Login with User ID and Password
  const login = async (userId: string, password: string): Promise<boolean> => {
    setLoginError(null);
    const cleanUserId = userId.trim().toLowerCase();

    if (!cleanUserId || !password) {
      setLoginError('Please enter both User ID and Password.');
      return false;
    }

    try {
      let targetUser = users.find(u => u.userId.toLowerCase() === cleanUserId);

      // If not in memory, try fetching directly from Firestore
      if (!targetUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', cleanUserId));
          if (userDoc.exists()) {
            targetUser = { id: userDoc.id, ...(userDoc.data() as Omit<UserAccount, 'id'>) };
          }
        } catch {
          // offline fallback
        }
      }

      if (!targetUser) {
        setLoginError('Invalid User ID or Password.');
        return false;
      }

      if (targetUser.status === 'disabled') {
        setLoginError('This account is disabled. Contact the Owner.');
        return false;
      }

      const isValid = await verifyPassword(password, targetUser.passwordHash, targetUser.salt);
      if (!isValid) {
        setLoginError('Wrong Password. Please try again.');
        return false;
      }

      // Successful login
      setCurrentUser(targetUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(targetUser));
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Login failed. Please check connection and try again.');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setLoginError(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // Add User (Owner only)
  const addUser = async (
    fullName: string,
    userId: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    try {
      const cleanUserId = userId.trim().toLowerCase();
      if (!cleanUserId || !fullName.trim() || !password) {
        throw new Error('All fields are required.');
      }

      if (users.some(u => u.userId.toLowerCase() === cleanUserId)) {
        throw new Error('User ID already exists.');
      }

      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      const now = formatISTDateTime();

      const newUser: UserAccount = {
        id: cleanUserId,
        userId: cleanUserId,
        fullName: fullName.trim(),
        role,
        passwordHash,
        salt,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'users', cleanUserId), {
          userId: cleanUserId,
          fullName: newUser.fullName,
          role,
          passwordHash,
          salt,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${cleanUserId}`);
      }

      const updated = [...users, newUser];
      setUsers(updated);
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Error adding user:', err);
      throw err;
    }
  };

  // Update User
  const updateUser = async (userUpdate: Partial<UserAccount> & { id: string }): Promise<boolean> => {
    try {
      const target = users.find(u => u.id === userUpdate.id);
      if (!target) return false;

      const now = formatISTDateTime();
      const updatedUser: UserAccount = {
        ...target,
        ...userUpdate,
        updatedAt: now,
      };

      try {
        await updateDoc(doc(db, 'users', userUpdate.id), {
          ...(userUpdate.fullName && { fullName: userUpdate.fullName }),
          ...(userUpdate.role && { role: userUpdate.role }),
          ...(userUpdate.status && { status: userUpdate.status }),
          updatedAt: now,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userUpdate.id}`);
      }

      const updated = users.map(u => (u.id === userUpdate.id ? updatedUser : u));
      setUsers(updated);
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updated));

      if (currentUser?.id === userUpdate.id) {
        setCurrentUser(updatedUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      }
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  // Change Password
  const changeUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const cleanUserId = userId.trim().toLowerCase();
      const target = users.find(u => u.id === cleanUserId || u.userId === cleanUserId);
      if (!target) return false;

      const salt = generateSalt();
      const passwordHash = await hashPassword(newPassword, salt);
      const now = formatISTDateTime();

      try {
        await updateDoc(doc(db, 'users', target.id), {
          passwordHash,
          salt,
          updatedAt: now,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${target.id}`);
      }

      const updatedUser = { ...target, passwordHash, salt, updatedAt: now };
      const updated = users.map(u => (u.id === target.id ? updatedUser : u));
      setUsers(updated);
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updated));

      if (currentUser?.id === target.id) {
        setCurrentUser(updatedUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      }
      return true;
    } catch (err) {
      console.error('Error changing password:', err);
      throw err;
    }
  };

  // Toggle user status (active / disabled)
  const toggleUserStatus = async (userId: string): Promise<boolean> => {
    const target = users.find(u => u.id === userId);
    if (!target) return false;
    const nextStatus = target.status === 'active' ? 'disabled' : 'active';
    return updateUser({ id: userId, status: nextStatus });
  };

  // Delete user
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
      }

      const updated = users.filter(u => u.id !== userId);
      setUsers(updated);
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        hasOwnerAccount,
        loginError,
        createOwnerAccount,
        login,
        logout,
        users,
        addUser,
        updateUser,
        changeUserPassword,
        toggleUserStatus,
        deleteUser,
        refreshUsers,
        isOwner: currentUser?.role === 'Owner',
        isStaff: currentUser?.role === 'Staff' || currentUser?.role === 'Owner',
        isTechnician: currentUser?.role === 'Technician',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
