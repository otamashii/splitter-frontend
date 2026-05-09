import React, { useState, useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import { View, Text } from 'tamagui';

interface UserAvatarProps {
  uri?: string | null;
  label: string;
  size?: number;
  textSize?: number;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

// Helper to ensure absolute URL if relative path is provided
const getFullUrl = (uri: string | null | undefined) => {
  if (!uri) return null;
  if (uri.startsWith('http') || uri.startsWith('data:') || uri.startsWith('file:')) {
    return uri;
  }
  // Fallback to a default API URL if it's a relative path
  // Note: In production this should come from config
  const API_URL = 'http://192.168.100.17:3001'; // Common dev IP in this project
  return `${API_URL}${uri.startsWith('/') ? '' : '/'}${uri}`;
};

export function UserAvatar({
  uri,
  label,
  size = 48,
  textSize,
  backgroundColor,
  borderWidth,
  borderColor,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const radius = size / 2;

  // Reset error state if uri changes
  useEffect(() => {
    setImageError(false);
  }, [uri]);

  const displayLabel = label?.charAt(0).toUpperCase() || '?';
  const fullUri = getFullUrl(uri);

  return (
    <View
      w={size}
      h={size}
      br={radius}
      overflow="hidden"
      ai="center"
      jc="center"
      backgroundColor={backgroundColor ?? '$gray5'}
      borderWidth={borderWidth}
      borderColor={borderColor}
    >
      {fullUri && !imageError ? (
        <Image 
          source={{ uri: fullUri }} 
          style={styles.image} 
          resizeMode="cover" 
          onError={() => setImageError(true)} 
        />
      ) : (
        <Text 
          fontSize={textSize ?? Math.round(size / 2.2)} 
          fontWeight="800" 
          col="$gray12"
        >
          {displayLabel}
        </Text>
      )}
    </View>
  );
}

export default UserAvatar;
