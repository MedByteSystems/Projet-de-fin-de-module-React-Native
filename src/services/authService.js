import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Import conditionnel de SQLite
let SQLite;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWeb] = useState(Platform.OS === 'web');
  const [db, setDb] = useState(null);

  useEffect(() => {
    initializeDatabase();
    loadUser();
  }, []);

  const initializeDatabase = async () => {
    if (isWeb) {
      // Sur le web, on utilise seulement AsyncStorage
      console.log('Mode web: utilisation d\'AsyncStorage uniquement');
      
      // Initialiser AsyncStorage pour le web
      const users = await AsyncStorage.getItem('@quotevault_users');
      if (!users) {
        await AsyncStorage.setItem('@quotevault_users', JSON.stringify([]));
      }
      return;
    }

    try {
      const database = await SQLite.openDatabaseAsync('quotevault.db');
      setDb(database);
      
      // Créer la table des utilisateurs
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          quote_id TEXT NOT NULL,
          content TEXT NOT NULL,
          author TEXT NOT NULL,
          tags TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, quote_id)
        );
      `);
    } catch (error) {
      console.error('Erreur initialisation DB:', error);
    }
  };

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@quotevault_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      if (isWeb) {
        // Version web simplifiée (sans SQLite)
        const usersJson = await AsyncStorage.getItem('@quotevault_users');
        const users = usersJson ? JSON.parse(usersJson) : [];
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
          };
          
          setUser(userData);
          await AsyncStorage.setItem('@quotevault_user', JSON.stringify(userData));
          return { success: true, user: userData };
        } else {
          return { success: false, error: 'Email ou mot de passe incorrect' };
        }
      } else {
        // Version mobile avec SQLite
        if (!db) {
          throw new Error('Base de données non initialisée');
        }

        const result = await db.getFirstAsync(
          'SELECT id, username, email FROM users WHERE email = ? AND password = ?',
          email, password
        );

        if (result) {
          const userData = {
            id: result.id,
            username: result.username,
            email: result.email,
          };
          
          setUser(userData);
          await AsyncStorage.setItem('@quotevault_user', JSON.stringify(userData));
          return { success: true, user: userData };
        } else {
          return { success: false, error: 'Email ou mot de passe incorrect' };
        }
      }
    } catch (error) {
      console.error('Erreur login:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const register = async (username, email, password) => {
    try {
      if (isWeb) {
        // Version web simplifiée
        const usersJson = await AsyncStorage.getItem('@quotevault_users');
        const users = usersJson ? JSON.parse(usersJson) : [];
        
        // Vérifier si l'email existe déjà
        const existingUser = users.find(u => u.email === email || u.username === username);
        
        if (existingUser) {
          return { success: false, error: 'Email ou nom d\'utilisateur déjà utilisé' };
        }
        
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = {
          id: newId,
          username,
          email,
          password,
          createdAt: new Date().toISOString(),
        };
        
        users.push(newUser);
        await AsyncStorage.setItem('@quotevault_users', JSON.stringify(users));
        
        const userData = {
          id: newId,
          username,
          email,
        };
        
        setUser(userData);
        await AsyncStorage.setItem('@quotevault_user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        // Version mobile avec SQLite
        if (!db) {
          throw new Error('Base de données non initialisée');
        }

        // Vérifier si l'email existe déjà
        const existingUser = await db.getFirstAsync(
          'SELECT id FROM users WHERE email = ? OR username = ?',
          email, username
        );

        if (existingUser) {
          return { success: false, error: 'Email ou nom d\'utilisateur déjà utilisé' };
        }

        const result = await db.runAsync(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          username, email, password
        );

        if (result.lastInsertRowId) {
          const userData = {
            id: result.lastInsertRowId,
            username,
            email,
          };
          
          setUser(userData);
          await AsyncStorage.setItem('@quotevault_user', JSON.stringify(userData));
          return { success: true, user: userData };
        }
      }
    } catch (error) {
      console.error('Erreur register:', error);
      return { success: false, error: 'Erreur d\'inscription' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@quotevault_user');
      setUser(null);
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    db,
    isWeb,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };