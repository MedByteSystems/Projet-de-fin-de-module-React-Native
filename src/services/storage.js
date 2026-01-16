import { useContext } from 'react';
import { AuthContext } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStorage = () => {
  const { db, user, isWeb } = useContext(AuthContext);

  const favorites = {
    // Ajouter une citation aux favoris
    addFavorite: async (quote) => {
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      try {
        if (isWeb) {
          // Version web avec AsyncStorage
          const key = `@quotevault_favorites_${user.id}`;
          const favoritesJson = await AsyncStorage.getItem(key);
          const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
          
          // Vérifier si déjà en favori
          const existing = favorites.find(fav => fav.quoteId === (quote._id || quote.id));
          if (existing) {
            return { success: true, id: existing.id };
          }
          
          const newFavorite = {
            id: Date.now(),
            quoteId: quote._id || quote.id,
            content: quote.content,
            author: quote.author,
            tags: quote.tags ? JSON.stringify(quote.tags) : null,
            createdAt: new Date().toISOString(),
          };
          
          favorites.push(newFavorite);
          await AsyncStorage.setItem(key, JSON.stringify(favorites));
          
          return { success: true, id: newFavorite.id };
        } else {
          // Version mobile avec SQLite
          if (!db) {
            return { success: false, error: 'Base de données non initialisée' };
          }

          const result = await db.runAsync(
            `INSERT OR REPLACE INTO favorites 
             (user_id, quote_id, content, author, tags) 
             VALUES (?, ?, ?, ?, ?)`,
            user.id,
            quote._id || quote.id,
            quote.content,
            quote.author,
            quote.tags ? JSON.stringify(quote.tags) : null
          );

          return { success: true, id: result.lastInsertRowId };
        }
      } catch (error) {
        console.error('Erreur ajout favori:', error);
        return { success: false, error: 'Erreur lors de l\'ajout aux favoris' };
      }
    },

    // Supprimer une citation des favoris
    removeFavorite: async (quoteId) => {
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      try {
        if (isWeb) {
          const key = `@quotevault_favorites_${user.id}`;
          const favoritesJson = await AsyncStorage.getItem(key);
          const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
          
          const filtered = favorites.filter(fav => fav.quoteId !== quoteId);
          await AsyncStorage.setItem(key, JSON.stringify(filtered));
          
          return { success: true };
        } else {
          if (!db) {
            return { success: false, error: 'Base de données non initialisée' };
          }

          await db.runAsync(
            'DELETE FROM favorites WHERE user_id = ? AND quote_id = ?',
            user.id, quoteId
          );

          return { success: true };
        }
      } catch (error) {
        console.error('Erreur suppression favori:', error);
        return { success: false, error: 'Erreur lors de la suppression' };
      }
    },

    // Vérifier si une citation est dans les favoris
    isFavorite: async (quoteId) => {
      if (!user) {
        return false;
      }

      try {
        if (isWeb) {
          const key = `@quotevault_favorites_${user.id}`;
          const favoritesJson = await AsyncStorage.getItem(key);
          const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
          
          return favorites.some(fav => fav.quoteId === quoteId);
        } else {
          if (!db) {
            return false;
          }

          const result = await db.getFirstAsync(
            'SELECT id FROM favorites WHERE user_id = ? AND quote_id = ?',
            user.id, quoteId
          );

          return !!result;
        }
      } catch (error) {
        console.error('Erreur vérification favori:', error);
        return false;
      }
    },

    // Récupérer tous les favoris
    getAllFavorites: async () => {
      if (!user) {
        return { success: false, error: 'Non authentifié', data: [] };
      }

      try {
        if (isWeb) {
          const key = `@quotevault_favorites_${user.id}`;
          const favoritesJson = await AsyncStorage.getItem(key);
          const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
          
          // Convertir les tags de JSON string à array
          const formattedFavorites = favorites.map(fav => ({
            id: fav.id,
            quoteId: fav.quoteId,
            content: fav.content,
            author: fav.author,
            tags: fav.tags ? JSON.parse(fav.tags) : [],
            createdAt: fav.createdAt,
          }));

          return { success: true, data: formattedFavorites };
        } else {
          if (!db) {
            return { success: false, error: 'Base de données non initialisée', data: [] };
          }

          const result = await db.getAllAsync(
            `SELECT 
              id, 
              quote_id as quoteId,
              content,
              author,
              tags,
              created_at as createdAt
             FROM favorites 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            user.id
          );

          // Convertir les tags de JSON string à array
          const favorites = result.map(fav => ({
            ...fav,
            tags: fav.tags ? JSON.parse(fav.tags) : [],
          }));

          return { success: true, data: favorites };
        }
      } catch (error) {
        console.error('Erreur récupération favoris:', error);
        return { success: false, error: 'Erreur récupération favoris', data: [] };
      }
    },

    // Rechercher dans les favoris
    searchFavorites: async (query) => {
      if (!user) {
        return { success: false, error: 'Non authentifié', data: [] };
      }

      try {
        if (isWeb) {
          const key = `@quotevault_favorites_${user.id}`;
          const favoritesJson = await AsyncStorage.getItem(key);
          const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
          
          const filtered = favorites.filter(fav => 
            fav.content.toLowerCase().includes(query.toLowerCase()) ||
            fav.author.toLowerCase().includes(query.toLowerCase())
          );
          
          // Convertir les tags de JSON string à array
          const formattedFavorites = filtered.map(fav => ({
            id: fav.id,
            quoteId: fav.quoteId,
            content: fav.content,
            author: fav.author,
            tags: fav.tags ? JSON.parse(fav.tags) : [],
            createdAt: fav.createdAt,
          }));

          return { success: true, data: formattedFavorites };
        } else {
          if (!db) {
            return { success: false, error: 'Base de données non initialisée', data: [] };
          }

          const result = await db.getAllAsync(
            `SELECT 
              id, 
              quote_id as quoteId,
              content,
              author,
              tags,
              created_at as createdAt
             FROM favorites 
             WHERE user_id = ? 
             AND (content LIKE ? OR author LIKE ?)
             ORDER BY created_at DESC`,
            user.id,
            `%${query}%`,
            `%${query}%`
          );

          const favorites = result.map(fav => ({
            ...fav,
            tags: fav.tags ? JSON.parse(fav.tags) : [],
          }));

          return { success: true, data: favorites };
        }
      } catch (error) {
        console.error('Erreur recherche favoris:', error);
        return { success: false, error: 'Erreur recherche favoris', data: [] };
      }
    },
  };

  return { favorites };
};