import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quoteApi } from '../services/quoteApi';
import { useStorage } from '../services/storage';
import QuoteCard from '../components/QuoteCard';
import QuotePoster from '../components/QuotePoster';
import { AuthContext } from '../services/authService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('fr'); // Français par défaut
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [viewMode, setViewMode] = useState('poster'); // 'poster' ou 'card'
  const [translating, setTranslating] = useState(false);
  
  const { favorites } = useStorage();
  const { user } = useContext(AuthContext);
  
  const availableLanguages = quoteApi.getAvailableLanguages();

  const loadRandomQuote = async (lang = language) => {
    console.log(`=== Chargement citation en ${lang} ===`);
    
    setLoading(true);
    setTranslating(lang !== 'en');
    setError(null);
    
    try {
      const result = await quoteApi.getRandomQuote(lang);
      console.log('Résultat API:', result);
      
      if (result.success && result.data) {
        setQuote(result.data);
        
        // Vérifier si la citation est dans les favoris
        if (result.data._id && user) {
          const isFav = await favorites.isFavorite(result.data._id);
          console.log('Est favori?', isFav);
          setIsFavorite(isFav);
        }
        
        console.log('Citation chargée:', {
          content: result.data.content.substring(0, 50) + '...',
          language: result.data.language,
          isTranslated: result.data.isTranslated,
          service: result.data.translationService
        });
      } else {
        setError(result.error || 'Impossible de charger une citation');
        Alert.alert('Erreur', result.error || 'Impossible de charger une citation');
      }
    } catch (error) {
      console.error('Erreur dans loadRandomQuote:', error);
      setError(error.message);
      Alert.alert('Erreur', 'Une erreur est survenue lors du chargement');
    } finally {
      setLoading(false);
      setTranslating(false);
      console.log('=== Chargement terminé ===');
    }
  };

  useEffect(() => {
    console.log('HomeScreen monté, utilisateur:', user ? 'Connecté' : 'Non connecté');
    
    if (user) {
      console.log('Utilisateur connecté, chargement citation...');
      loadRandomQuote();
    } else {
      console.log('Utilisateur non connecté');
      setLoading(false);
    }
  }, [user]);

  const onRefresh = async () => {
    console.log('Pull to refresh déclenché');
    setRefreshing(true);
    await loadRandomQuote();
    setRefreshing(false);
  };

  const handleToggleFavorite = async () => {
    if (!quote || !user) {
      Alert.alert('Information', 'Veuillez vous connecter pour utiliser les favoris');
      return;
    }
    
    console.log('Toggle favori pour citation:', quote._id);
    
    try {
      if (isFavorite) {
        const result = await favorites.removeFavorite(quote._id);
        if (result.success) {
          setIsFavorite(false);
          Alert.alert('Succès', 'Citation retirée des favoris');
        }
      } else {
        const result = await favorites.addFavorite(quote);
        if (result.success) {
          setIsFavorite(true);
          Alert.alert('Succès', 'Citation ajoutée aux favoris');
        }
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error);
      Alert.alert('Erreur', 'Impossible de modifier les favoris');
    }
  };

  const handleNewQuote = async () => {
    console.log('Bouton Nouvelle citation cliqué');
    await loadRandomQuote();
  };

  const handleChangeLanguage = async (langCode) => {
    console.log('Changement de langue:', langCode);
    setLanguage(langCode);
    setShowLanguageModal(false);
    await loadRandomQuote(langCode);
  };

  const renderLanguageItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        language === item.code && styles.languageItemActive
      ]}
      onPress={() => handleChangeLanguage(item.code)}
    >
      <Text style={styles.languageFlag}>{item.flag}</Text>
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>{item.name}</Text>
        <Text style={styles.languageCode}>{item.code.toUpperCase()}</Text>
      </View>
      {language === item.code && (
        <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />
      )}
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="log-in" size={80} color="#4A90E2" />
        <Text style={styles.noUserText}>Veuillez vous connecter</Text>
        <Text style={styles.noUserSubtext}>
          Utilisez les identifiants suivants :
        </Text>
        <View style={styles.credentials}>
          <Text style={styles.credential}>Email: user@example.com</Text>
          <Text style={styles.credential}>Mot de passe: password123</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {/* En-tête avec titre et bouton langue */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeTitle}>
            {language === 'fr' ? 'Citation du jour' : 
             language === 'en' ? 'Daily Quote' : 
             'اقتباس اليوم'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {language === 'fr' ? 'Découvrez une nouvelle inspiration' :
             language === 'en' ? 'Discover new inspiration' :
             'اكتشف إلهامًا جديدًا'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={styles.languageText}>
            {availableLanguages.find(l => l.code === language)?.flag || '🌐'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Indicateur de traduction */}
      {translating && (
        <View style={styles.translatingContainer}>
          <ActivityIndicator size="small" color="#4A90E2" />
          <Text style={styles.translatingText}>
            {language === 'fr' ? 'Traduction en cours...' :
             language === 'en' ? 'Translating...' :
             'جار الترجمة...'}
          </Text>
        </View>
      )}

      {/* Sélecteur de mode d'affichage */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'poster' && styles.viewModeActive]}
          onPress={() => setViewMode('poster')}
        >
          <Ionicons name="image" size={20} color={viewMode === 'poster' ? '#fff' : '#4A90E2'} />
          <Text style={[styles.viewModeText, viewMode === 'poster' && styles.viewModeTextActive]}>
            {language === 'fr' ? 'Poster' : 
             language === 'en' ? 'Poster' : 
             'ملصق'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'card' && styles.viewModeActive]}
          onPress={() => setViewMode('card')}
        >
          <Ionicons name="card" size={20} color={viewMode === 'card' ? '#fff' : '#4A90E2'} />
          <Text style={[styles.viewModeText, viewMode === 'card' && styles.viewModeTextActive]}>
            {language === 'fr' ? 'Carte' : 
             language === 'en' ? 'Card' : 
             'بطاقة'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Affichage de la citation */}
      {loading ? (
        <View style={styles.centeredSection}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>
            {language === 'fr' ? 'Chargement de la citation...' :
             language === 'en' ? 'Loading quote...' :
             'جار تحميل الاقتباس...'}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centeredSection}>
          <Ionicons name="warning" size={60} color="#FF6B6B" />
          <Text style={styles.errorText}>
            {language === 'fr' ? 'Erreur de chargement' :
             language === 'en' ? 'Loading error' :
             'خطأ في التحميل'}
          </Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadRandomQuote()}>
            <Text style={styles.retryButtonText}>
              {language === 'fr' ? 'Réessayer' :
               language === 'en' ? 'Retry' :
               'إعادة المحاولة'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : quote ? (
        <>
          {viewMode === 'poster' ? (
            <QuotePoster
              quote={quote}
              onShare={() => {}}
              onSave={() => {}}
            />
          ) : (
            <QuoteCard
              quote={quote}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          
          {/* Informations sur la traduction */}
          {quote.isTranslated && (
            <View style={styles.translationInfo}>
              <Ionicons name="language" size={16} color="#4A90E2" />
              <Text style={styles.translationText}>
                {language === 'fr' ? `Traduit en ${availableLanguages.find(l => l.code === language)?.name}` :
                 language === 'en' ? `Translated to ${availableLanguages.find(l => l.code === language)?.name}` :
                 `تمت الترجمة إلى ${availableLanguages.find(l => l.code === language)?.name}`}
                {quote.translationService && ` (${quote.translationService})`}
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.centeredSection}>
          <Ionicons name="help-circle" size={60} color="#4A90E2" />
          <Text style={styles.noQuoteText}>
            {language === 'fr' ? 'Aucune citation disponible' :
             language === 'en' ? 'No quote available' :
             'لا يوجد اقتباس متاح'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadRandomQuote()}>
            <Text style={styles.retryButtonText}>
              {language === 'fr' ? 'Charger une citation' :
               language === 'en' ? 'Load a quote' :
               'تحميل اقتباس'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Actions principales */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.newQuoteButton}
          onPress={handleNewQuote}
          disabled={loading || translating}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.newQuoteButtonText}>
            {loading || translating ? 
              (language === 'fr' ? 'Chargement...' :
               language === 'en' ? 'Loading...' :
               'جار التحميل...') : 
              (language === 'fr' ? 'Nouvelle citation' :
               language === 'en' ? 'New quote' :
               'اقتباس جديد')}
          </Text>
        </TouchableOpacity>

        {quote && (
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive
            ]}
            onPress={handleToggleFavorite}
            disabled={!user}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#fff' : '#4A90E2'}
            />
            <Text style={[
              styles.favoriteButtonText,
              isFavorite && styles.favoriteButtonTextActive
            ]}>
              {isFavorite ? 
                (language === 'fr' ? 'Retirer des favoris' :
                 language === 'en' ? 'Remove from favorites' :
                 'إزالة من المفضلة') : 
                (language === 'fr' ? 'Ajouter aux favoris' :
                 language === 'en' ? 'Add to favorites' :
                 'إضافة إلى المفضلة')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Informations détaillées */}
      {quote && (
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="language" size={16} color="#666" />
            <Text style={styles.infoText}>
              {language === 'fr' ? 'Langue: ' : 
               language === 'en' ? 'Language: ' : 
               'اللغة: '}
              {availableLanguages.find(l => l.code === quote.language)?.name || quote.language}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.infoText}>
              {language === 'fr' ? 'Auteur: ' : 
               language === 'en' ? 'Author: ' : 
               'المؤلف: '}
              {quote.author}
            </Text>
          </View>
          
          {quote.tags && quote.tags.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="pricetags" size={16} color="#666" />
              <Text style={styles.infoText}>
                {language === 'fr' ? 'Tags: ' : 
                 language === 'en' ? 'Tags: ' : 
                 'العلامات: '}
                {quote.tags.join(', ')}
              </Text>
            </View>
          )}
          
          {quote.fromCache && (
            <View style={styles.infoRow}>
              <Ionicons name="wifi" size={16} color="#FF6B6B" />
              <Text style={styles.cacheText}>
                {language === 'fr' ? '⚠️ Mode hors ligne' :
                 language === 'en' ? '⚠️ Offline mode' :
                 '⚠️ وضع عدم الاتصال'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bouton test de traduction (pour débogage) */}
      {__DEV__ && (
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={async () => {
            console.log('=== TEST TRADUCTION ===');
            const testQuote = {
              content: "The only way to do great work is to love what you do.",
              author: "Steve Jobs",
              language: 'en'
            };
            
            try {
              const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(testQuote.content)}&langpair=en|fr`
              );
              const data = await response.json();
              Alert.alert(
                'Test MyMemory API',
                `Status: ${data.responseStatus}\n\nTraduction: ${data.responseData?.translatedText || 'Échec'}`
              );
            } catch (error) {
              Alert.alert('Erreur test', error.message);
            }
          }}
        >
          <Text style={styles.debugButtonText}>Test API Traduction</Text>
        </TouchableOpacity>
      )}

      {/* Modal de sélection de langue */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'fr' ? 'Choisir la langue' :
                 language === 'en' ? 'Choose language' :
                 'اختر اللغة'}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              {language === 'fr' ? 'Les citations seront automatiquement traduites' :
               language === 'en' ? 'Quotes will be automatically translated' :
               'سيتم ترجمة الاقتباسات تلقائيًا'}
            </Text>
            
            <FlatList
              data={availableLanguages}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  centeredSection: {
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 300,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 50,
    justifyContent: 'center',
  },
  languageText: {
    fontSize: 20,
    marginRight: 5,
  },
  translatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  translatingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewModeActive: {
    backgroundColor: '#4A90E2',
  },
  viewModeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  actionsContainer: {
    marginTop: 25,
  },
  newQuoteButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newQuoteButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  favoriteButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  favoriteButtonText: {
    color: '#4A90E2',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  favoriteButtonTextActive: {
    color: '#fff',
  },
  noUserText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  noUserSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  credentials: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    width: '90%',
  },
  credential: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 20,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  },
  noQuoteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  translationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
  },
  translationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  infoContainer: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  cacheText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  debugButton: {
    backgroundColor: '#666',
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageItemActive: {
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
  },
  languageFlag: {
    fontSize: 30,
    width: 40,
  },
  languageInfo: {
    flex: 1,
    marginLeft: 15,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  languageCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});