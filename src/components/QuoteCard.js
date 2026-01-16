import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const QuoteCard = ({ quote, isFavorite, onToggleFavorite }) => {
  if (!quote) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${quote.content}" - ${quote.author}`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleCopy = () => {
    // Implémentation de la copie dans le presse-papier
    // Note: Pour React Native, vous aurez besoin d'une librairie comme expo-clipboard
    // Pour cette démo, nous utilisons Share comme alternative
    handleShare();
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Ionicons 
          name="quote" 
          size={30} 
          color="#4A90E2" 
          style={styles.quoteIcon}
        />
        <Text style={styles.quoteText}>"{quote.content}"</Text>
        
        <View style={styles.authorContainer}>
          <View style={styles.authorLine} />
          <Text style={styles.authorText}>— {quote.author}</Text>
        </View>
      </View>

      {quote.tags && quote.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {quote.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onToggleFavorite}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF6B6B' : '#666'}
          />
          <Text style={[
            styles.actionText,
            isFavorite && styles.favoriteText
          ]}>
            {isFavorite ? 'Favori' : 'Ajouter'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={24} color="#666" />
          <Text style={styles.actionText}>Partager</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCopy}
        >
          <Ionicons name="copy-outline" size={24} color="#666" />
          <Text style={styles.actionText}>Copier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: -10,
    left: -10,
    opacity: 0.3,
  },
  quoteText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
  },
  authorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  favoriteText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
});

export default QuoteCard;