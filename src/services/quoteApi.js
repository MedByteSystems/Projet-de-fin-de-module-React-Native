import { translationService } from './translationService';
import { Platform } from 'react-native';

const API_BASE_URL = 'https://api.quotable.io';

// Fonction fetch améliorée pour mobile
// Fonction fetch améliorée pour mobile (version corrigée)
const mobileFetch = async (url, options = {}) => {
  try {
    const fetchOptions = {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (Platform.OS !== 'web') {
      const controller = new AbortController();
      const timeoutMs = 10000; // 10s
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      fetchOptions.signal = controller.signal;

      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);

        // Ne pas utiliser console.error ici (évite le RedBox en dev).
        if (error.name === 'AbortError') {
          console.log(`mobileFetch: timeout (${timeoutMs}ms) pour ${url}`);
        } else {
          console.log(`mobileFetch: échec fetch pour ${url} — ${error.message}`);
        }

        // On continue de lancer l'erreur pour que le caller fasse le fallback.
        throw error;
      }
    }

    // Web
    return await fetch(url, fetchOptions);
  } catch (error) {
    // Pour les erreurs hors mobile (ou erreurs inattendues), loggons sans "error"
    console.log('mobileFetch: erreur globale (non critique pour le fallback) ->', error?.message || error);
    throw error;
  }
};


// Fonction pour essayer différentes URLs (certaines pourraient être bloquées)
const tryMultipleEndpoints = async (endpoints) => {
  for (const endpoint of endpoints) {
    try {
      console.log(`Essai endpoint: ${endpoint}`);
      const response = await mobileFetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data, endpoint };
      }
    } catch (error) {
      console.log(`Endpoint ${endpoint} a échoué:`, error.message);
      continue;
    }
  }
  return { success: false, error: 'Tous les endpoints ont échoué' };
};

export const quoteApi = {
  // Récupérer une citation aléatoire AVEC traduction
  getRandomQuote: async (language = 'en') => {
    try {
      console.log(`=== Chargement citation en ${language} ===`);
      
      // Essayer plusieurs endpoints au cas où certains seraient bloqués
      const endpoints = [
        'https://api.quotable.io/random',
        'https://zenquotes.io/api/random', // Alternative
        'https://favqs.com/api/qotd', // Une autre alternative
      ];

      let quoteData = null;
      let apiUsed = '';

      // Essayer l'API Quotable d'abord
      try {
        console.log('Tentative avec Quotable API...');
        const response = await mobileFetch('https://api.quotable.io/random');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        quoteData = await response.json();
        apiUsed = 'Quotable';
        console.log('Succès avec Quotable API:', quoteData.content.substring(0, 50) + '...');
        
      } catch (quotableError) {
        console.log('Quotable API a échoué, essai avec ZenQuotes...');
        
        // Fallback à ZenQuotes
        try {
          const response = await mobileFetch('https://zenquotes.io/api/random');
          if (response.ok) {
            const zenData = await response.json();
            quoteData = {
              _id: `zen-${Date.now()}`,
              content: zenData[0].q,
              author: zenData[0].a,
              tags: ['inspiration'],
              length: zenData[0].q.length
            };
            apiUsed = 'ZenQuotes';
            console.log('Succès avec ZenQuotes API');
          } else {
            throw new Error('ZenQuotes a échoué');
          }
        } catch (zenError) {
          console.log('ZenQuotes a échoué, utilisation de citations locales...');
          
          // Fallback à des citations locales
          const localQuotes = [
            {
              _id: '1',
              content: "The only way to do great work is to love what you do.",
              author: "Steve Jobs",
              tags: ["work", "passion"],
              length: 57
            },
            {
              _id: '2',
              content: "Innovation distinguishes between a leader and a follower.",
              author: "Steve Jobs",
              tags: ["innovation", "leadership"],
              length: 62
            },
            {
              _id: '3',
              content: "Your time is limited, so don't waste it living someone else's life.",
              author: "Steve Jobs",
              tags: ["time", "life"],
              length: 70
            },
            {
              _id: '4',
              content: "Stay hungry, stay foolish.",
              author: "Steve Jobs",
              tags: ["motivation", "growth"],
              length: 26
            },
            {
              _id: '5',
              content: "The future belongs to those who believe in the beauty of their dreams.",
              author: "Eleanor Roosevelt",
              tags: ["future", "dreams"],
              length: 75
            }
          ];
          
          const randomIndex = Math.floor(Math.random() * localQuotes.length);
          quoteData = localQuotes[randomIndex];
          apiUsed = 'Local';
        }
      }
      
      // 2. Si l'utilisateur veut une autre langue, traduire
      if (language !== 'en') {
        console.log('Traduction nécessaire...');
        const translatedQuote = await translationService.translateQuote(
          { ...quoteData, language: 'en' },
          language
        );
        
        return {
          success: true,
          data: {
            ...translatedQuote,
            _id: translatedQuote._id || quoteData._id,
            service: apiUsed
          }
        };
      }
      
      // 3. Si l'utilisateur veut l'anglais, retourner tel quel
      return {
        success: true,
        data: {
          ...quoteData,
          language: 'en',
          isTranslated: false,
          service: apiUsed
        }
      };
      
    } catch (error) {
      console.error('Erreur récupération citation:', error);
      
      // Citations de secours améliorées
      const fallbackQuotes = {
        en: {
          _id: 'fallback-en',
          content: "The only way to do great work is to love what you do.",
          author: "Steve Jobs",
          tags: ["work", "passion"],
          language: "en",
          isTranslated: false,
          service: 'Fallback'
        },
        fr: {
          _id: 'fallback-fr',
          content: "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
          author: "Steve Jobs",
          tags: ["travail", "passion"],
          language: "fr",
          isTranslated: false,
          service: 'Fallback'
        },
        ar: {
          _id: 'fallback-ar',
          content: "الطريقة الوحيدة للقيام بعمل رائع هي أن تحب ما تفعله.",
          author: "ستيف جوبز",
          tags: ["عمل", "شغف"],
          language: "ar",
          isTranslated: false,
          service: 'Fallback'
        }
      };
      
      return {
        success: true,
        data: fallbackQuotes[language] || fallbackQuotes.en,
        fromCache: true
      };
    }
  },

  // Rechercher des citations AVEC traduction
  searchQuotes: async (query, language = 'en', page = 1, limit = 10) => {
    try {
      console.log(`Recherche "${query}", traduction en ${language}...`);
      
      // 1. Rechercher en anglais
      const response = await mobileFetch(
        `https://api.quotable.io/search/quotes?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const searchData = await response.json();
      
      // 2. Traduire chaque résultat si nécessaire
      const translatedResults = [];
      for (const quote of searchData.results || []) {
        if (language !== 'en') {
          try {
            const translated = await translationService.translateQuote(
              { ...quote, language: 'en' },
              language
            );
            translatedResults.push(translated);
          } catch (translationError) {
            console.error('Erreur traduction:', translationError);
            translatedResults.push({
              ...quote,
              language: 'en',
              isTranslated: false
            });
          }
        } else {
          translatedResults.push({
            ...quote,
            language: 'en',
            isTranslated: false
          });
        }
      }
      
      return {
        success: true,
        data: {
          ...searchData,
          results: translatedResults
        }
      };
      
    } catch (error) {
      console.error('Erreur recherche:', error);
      
      // Fallback pour recherche
      const fallbackQuotes = [
        {
          _id: 'search-1',
          content: "The only way to do great work is to love what you do.",
          author: "Steve Jobs",
          tags: ["work", "passion"],
          language: language,
          isTranslated: language !== 'en'
        },
        {
          _id: 'search-2',
          content: "Innovation distinguishes between a leader and a follower.",
          author: "Steve Jobs",
          tags: ["innovation", "leadership"],
          language: language,
          isTranslated: language !== 'en'
        }
      ];
      
      // Filtrer par query dans le fallback
      const filtered = fallbackQuotes.filter(quote =>
        quote.content.toLowerCase().includes(query.toLowerCase()) ||
        quote.author.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        success: true,
        data: {
          results: filtered,
          count: filtered.length,
          totalCount: filtered.length,
          page: 1,
          totalPages: 1
        },
        fromCache: true
      };
    }
  },
  
  // Obtenir les langues disponibles
  getAvailableLanguages: () => {
    return translationService.getAvailableLanguages();
  }
};