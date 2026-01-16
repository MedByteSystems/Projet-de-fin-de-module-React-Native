import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../services/storage';
import QuoteCard from '../components/QuoteCard';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const { favorites: favoritesService } = useStorage();

  const loadFavorites = useCallback(async () => {
    console.log('loadFavorites appelé');
    
    // Éviter les appels simultanés
    if (loading) return;
    
    setLoading(true);
    
    try {
      console.log('Appel à getAllFavorites...');
      const result = await favoritesService.getAllFavorites();
      console.log('Résultat getAllFavorites:', result.success ? `${result.data.length} favoris` : result.error);

      if (result.success) {
        setFavorites(result.data);
        setFilteredFavorites(result.data);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur chargement favoris');
        // En cas d'erreur, mettre des tableaux vides
        setFavorites([]);
        setFilteredFavorites([]);
      }
    } catch (error) {
      console.error('Erreur loadFavorites:', error);
      Alert.alert('Erreur', 'Impossible de charger les favoris');
      setFavorites([]);
      setFilteredFavorites([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [favoritesService, loading]);

  // Chargement initial UNE SEULE FOIS
  useEffect(() => {
    console.log('useEffect initial - initialLoad:', initialLoad);
    if (initialLoad) {
      loadFavorites();
    }
  }, [initialLoad, loadFavorites]);

  // Filtrage local lorsque searchQuery change
  useEffect(() => {
    console.log('Filtrage pour query:', searchQuery);
    
    if (!searchQuery.trim()) {
      setFilteredFavorites(favorites);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = favorites.filter(item => {
      const contentMatch = item.content?.toLowerCase().includes(query) || false;
      const authorMatch = item.author?.toLowerCase().includes(query) || false;
      return contentMatch || authorMatch;
    });

    console.log('Résultats filtrés:', filtered.length);
    setFilteredFavorites(filtered);
  }, [searchQuery, favorites]);

  const onRefresh = useCallback(async () => {
    console.log('onRefresh appelé');
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await loadFavorites();
    } finally {
      setRefreshing(false);
    }
  }, [loadFavorites, refreshing]);

  const handleRemoveFavorite = async (quoteId) => {
    console.log('Retrait favori:', quoteId);
    
    Alert.alert(
      'Retirer des favoris',
      'Voulez-vous vraiment retirer cette citation de vos favoris ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await favoritesService.removeFavorite(quoteId);
              if (result.success) {
                console.log('Favori retiré avec succès');
                // Mettre à jour localement au lieu de recharger
                setFavorites(prev => prev.filter(item => item.quoteId !== quoteId));
                Alert.alert('Succès', 'Citation retirée des favoris');
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de retirer le favori');
              }
            } catch (error) {
              console.error('Erreur suppression favori:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    if (!item.content || !item.author) {
      console.warn('Item invalide:', item);
      return null;
    }
    
    return (
      <QuoteCard
        quote={{
          _id: item.quoteId || item.id,
          content: item.content,
          author: item.author,
          tags: Array.isArray(item.tags) ? item.tags : [],
        }}
        isFavorite={true}
        onToggleFavorite={() => handleRemoveFavorite(item.quoteId || item.id)}
      />
    );
  };

  const renderEmptyState = () => {
    if (loading && initialLoad) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.emptyText}>Chargement des favoris...</Text>
        </View>
      );
    }

    if (searchQuery.trim() && filteredFavorites.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            Aucun favori trouvé pour "{searchQuery}"
          </Text>
        </View>
      );
    }

    if (favorites.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={60} color="#4A90E2" />
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyText}>
            Ajoutez des citations à vos favoris pour les retrouver ici
          </Text>
        </View>
      );
    }

    return null;
  };

  // Éviter de rendre le FlatList si aucun favori et en chargement initial
  if (initialLoad) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes Favoris</Text>
          <Text style={styles.subtitle}>Chargement...</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.emptyText}>Chargement des favoris...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Favoris</Text>
        <Text style={styles.subtitle}>
          {filteredFavorites.length} citation(s) sauvegardée(s)
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher dans mes favoris..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          editable={!loading}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredFavorites}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          // Utiliser l'ID ou un index comme fallback
          if (item.id) return item.id.toString();
          if (item.quoteId) return item.quoteId.toString();
          return `fav-${index}`;
        }}
        contentContainerStyle={[
          styles.listContent,
          filteredFavorites.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={false} // Désactiver pour le débogage
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#F0F8FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 15,
    marginTop: 0,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  separator: {
    height: 15,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
});