import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import { quoteApi } from '../services/quoteApi';
import { useStorage } from '../services/storage';
import QuoteCard from '../components/QuoteCard';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState({});
  
  const { favorites } = useStorage();

  // Charger l'état des favoris
  const loadFavoritesStatus = useCallback(async (quotes) => {
    const map = {};
    
    for (const quote of quotes) {
      if (quote._id) {
        const isFav = await favorites.isFavorite(quote._id);
        map[quote._id] = isFav;
      }
    }
    
    setFavoritesMap(map);
  }, [favorites]);

  const searchQuotes = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      const result = await quoteApi.searchQuotes(query);
      setLoading(false);

      if (result.success) {
        setSearchResults(result.data.results || []);
        loadFavoritesStatus(result.data.results || []);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la recherche');
      }
    }, 500),
    [loadFavoritesStatus]
  );

  useEffect(() => {
    searchQuotes(searchQuery);
  }, [searchQuery, searchQuotes]);

  const handleToggleFavorite = async (quote) => {
    const quoteId = quote._id;
    if (!quoteId) return;

    const newFavoritesMap = { ...favoritesMap };

    if (newFavoritesMap[quoteId]) {
      // Retirer des favoris
      const result = await favorites.removeFavorite(quoteId);
      if (result.success) {
        newFavoritesMap[quoteId] = false;
      }
    } else {
      // Ajouter aux favoris
      const result = await favorites.addFavorite(quote);
      if (result.success) {
        newFavoritesMap[quoteId] = true;
      }
    }

    setFavoritesMap(newFavoritesMap);
  };

  const renderItem = ({ item }) => (
    <QuoteCard
      quote={item}
      isFavorite={favoritesMap[item._id] || false}
      onToggleFavorite={() => handleToggleFavorite(item)}
    />
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.emptyText}>Recherche en cours...</Text>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            Aucune citation trouvée pour "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={60} color="#4A90E2" />
        <Text style={styles.emptyTitle}>Rechercher des citations</Text>
        <Text style={styles.emptyText}>
          Recherchez par mot-clé, auteur ou thème
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher des citations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />

      {searchResults.length > 0 && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {searchResults.length} citation(s) trouvée(s)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 15,
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
  separator: {
    height: 15,
  },
  emptyContainer: {
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
  resultsInfo: {
    padding: 15,
    backgroundColor: '#F0F8FF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});