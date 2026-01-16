import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');
const POSTER_WIDTH = width - 40;

const QuotePoster = ({ quote, style, onShare, onSave }) => {
  if (!quote) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${quote.content}"\n\n- ${quote.author}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSaveAsImage = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Georgia', serif;
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .poster {
                max-width: 600px;
                text-align: center;
              }
              .quote {
                font-size: 28px;
                font-style: italic;
                line-height: 1.6;
                margin-bottom: 30px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              }
              .author {
                font-size: 20px;
                font-weight: bold;
                border-top: 2px solid white;
                padding-top: 20px;
                display: inline-block;
              }
              .tags {
                margin-top: 20px;
                opacity: 0.8;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="poster">
              <div class="quote">"${quote.content}"</div>
              <div class="author">— ${quote.author}</div>
              ${quote.tags && quote.tags.length > 0 ? 
                `<div class="tags">${quote.tags.join(' • ')}</div>` : ''}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error saving as image:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le poster');
    }
  };

  // Styles en fonction de la langue
  const isRTL = quote.language === 'ar';
  const textAlign = isRTL ? 'right' : 'left';
  const fontFamily = isRTL ? 'System' : 'Georgia';

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.poster}
      >
        <View style={styles.quoteContainer}>
          <Text style={[
            styles.quoteText,
            { 
              textAlign: textAlign,
              fontFamily: fontFamily,
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }
          ]}>
            "{quote.content}"
          </Text>
          
          <View style={styles.authorContainer}>
            <View style={styles.authorLine} />
            <Text style={[
              styles.authorText,
              { 
                textAlign: textAlign,
                fontFamily: fontFamily,
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }
            ]}>
              — {quote.author}
            </Text>
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
        </View>

        <View style={styles.posterActions}>
          <TouchableOpacity style={styles.posterAction} onPress={handleShare}>
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.posterActionText}>Partager</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.posterAction} onPress={handleSaveAsImage}>
            <Ionicons name="download" size={24} color="white" />
            <Text style={styles.posterActionText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: POSTER_WIDTH,
    alignSelf: 'center',
  },
  poster: {
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    minHeight: 300,
    justifyContent: 'space-between',
  },
  quoteContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: 24,
    color: 'white',
    lineHeight: 36,
    fontStyle: 'italic',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 15,
  },
  authorText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  posterActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  posterAction: {
    alignItems: 'center',
  },
  posterActionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
});

export default QuotePoster;