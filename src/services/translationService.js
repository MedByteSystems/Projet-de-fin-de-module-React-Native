// Service de traduction automatique avec API MyMemory (gratuit, limite 1000 req/jour)

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

export const translationService = {
  // Traduire une citation avec MyMemory API
  translateQuote: async (quote, targetLanguage) => {
    if (!quote || !quote.content) return quote;
    
    const sourceLanguage = quote.language || 'en';
    
    // Si la citation est déjà dans la langue cible
    if (sourceLanguage === targetLanguage) {
      return {
        ...quote,
        language: targetLanguage,
        isTranslated: false
      };
    }
    
    try {
      console.log(`Traduction ${sourceLanguage} -> ${targetLanguage}: ${quote.content.substring(0, 50)}...`);
      
      // Codes de langue pour l'API
      const langCodes = {
        'en': 'en',
        'fr': 'fr',
        'ar': 'ar'
      };
      
      const sourceCode = langCodes[sourceLanguage] || 'en';
      const targetCode = langCodes[targetLanguage] || 'fr';
      
      // Appel à l'API MyMemory
      const response = await fetch(
        `${MYMEMORY_API}?q=${encodeURIComponent(quote.content)}&langpair=${sourceCode}|${targetCode}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText;
        
        // Traduire aussi l'auteur si c'est un nom commun
        let translatedAuthor = quote.author;
        const commonAuthors = {
          'Steve Jobs': { fr: 'Steve Jobs', ar: 'ستيف جوبز' },
          'Albert Einstein': { fr: 'Albert Einstein', ar: 'ألبرت أينشتاين' },
          'William Shakespeare': { fr: 'William Shakespeare', ar: 'ويليام شكسبير' },
          'Martin Luther King': { fr: 'Martin Luther King', ar: 'مارتن لوثر كينغ' },
          'Nelson Mandela': { fr: 'Nelson Mandela', ar: 'نيلسون مانديلا' },
          'Mahatma Gandhi': { fr: 'Mahatma Gandhi', ar: 'المهاتما غاندي' },
          'Mother Teresa': { fr: 'Mère Teresa', ar: 'الأم تيريزا' },
          'Confucius': { fr: 'Confucius', ar: 'كونفوشيوس' },
          'Plato': { fr: 'Platon', ar: 'أفلاطون' },
          'Aristotle': { fr: 'Aristote', ar: 'أرسطو' }
        };
        
        if (commonAuthors[quote.author] && commonAuthors[quote.author][targetLanguage]) {
          translatedAuthor = commonAuthors[quote.author][targetLanguage];
        }
        
        return {
          ...quote,
          content: translatedText,
          author: translatedAuthor,
          language: targetLanguage,
          originalContent: quote.content,
          originalLanguage: sourceLanguage,
          isTranslated: true,
          translationService: 'MyMemory'
        };
      } else {
        throw new Error('No translation available');
      }
    } catch (error) {
      console.error('Erreur traduction:', error);
      
      // Fallback: utiliser un dictionnaire de traductions pré-enregistrées
      return await translationService.translateWithDictionary(quote, targetLanguage);
    }
  },
  
  // Dictionnaire de traductions de secours
  translateWithDictionary: async (quote, targetLanguage) => {
    const TRANSLATIONS = {
      en_fr: {
        "The only way to do great work is to love what you do.": 
          "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
        "Innovation distinguishes between a leader and a follower.": 
          "L'innovation distingue un leader d'un suiveur.",
        "Your time is limited, so don't waste it living someone else's life.": 
          "Votre temps est limité, ne le gâchez pas à vivre la vie de quelqu'un d'autre.",
        "Stay hungry, stay foolish.": 
          "Restez affamés, restez fous.",
        "The future belongs to those who believe in the beauty of their dreams.": 
          "L'avenir appartient à ceux qui croient à la beauté de leurs rêves.",
        "Be the change that you wish to see in the world.": 
          "Soyez le changement que vous voulez voir dans le monde.",
        "In the middle of difficulty lies opportunity.": 
          "Au milieu de la difficulté se trouve l'opportunité.",
        "Life is what happens to you while you're busy making other plans.": 
          "La vie, c'est ce qui vous arrive pendant que vous êtes occupé à faire d'autres projets.",
      },
      en_ar: {
        "The only way to do great work is to love what you do.": 
          "الطريقة الوحيدة للقيام بعمل رائع هي أن تحب ما تفعله.",
        "Innovation distinguishes between a leader and a follower.": 
          "الابتكار يميز بين القائد والتابع.",
        "Your time is limited, so don't waste it living someone else's life.": 
          "وقتك محدود، لذا لا تضيعه في عيش حياة شخص آخر.",
        "Stay hungry, stay foolish.": 
          "ابق جائعاً، ابق أحمقاً.",
        "The future belongs to those who believe in the beauty of their dreams.": 
          "المستقبل ينتمي إلى أولئك الذين يؤمنون بجمال أحلامهم.",
        "Be the change that you wish to see in the world.": 
          "كن التغيير الذي ترغب في رؤيته في العالم.",
        "In the middle of difficulty lies opportunity.": 
          "في منتصف الصعوبة تكمن الفرصة.",
        "Life is what happens to you while you're busy making other plans.": 
          "الحياة هي ما يحدث لك بينما تكون مشغولاً بوضع خطط أخرى.",
      }
    };
    
    const translationKey = `${quote.language || 'en'}_${targetLanguage}`;
    
    if (TRANSLATIONS[translationKey] && TRANSLATIONS[translationKey][quote.content]) {
      return {
        ...quote,
        content: TRANSLATIONS[translationKey][quote.content],
        language: targetLanguage,
        originalContent: quote.content,
        originalLanguage: quote.language || 'en',
        isTranslated: true,
        translationService: 'Dictionary'
      };
    }
    
    // Si aucune traduction n'est disponible, retourner l'original
    return {
      ...quote,
      language: targetLanguage,
      isTranslated: false
    };
  },
  
  // Obtenir la liste des langues disponibles
  getAvailableLanguages: () => {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸', direction: 'ltr' },
      { code: 'fr', name: 'Français', flag: '🇫🇷', direction: 'ltr' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦', direction: 'rtl' },
    ];
  }
};