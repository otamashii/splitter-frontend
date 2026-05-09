import React, { useState } from 'react';
import { Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Input, Button, Spinner } from 'tamagui';
import { ChevronLeft, User, UserCircle, Hash } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/shared/lib/stores/app-store';
import { updateUsername } from '@/features/auth/api';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, setUser, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);

  const hasChanges = username !== user?.username || displayName !== user?.displayName;

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Xato', 'Foydalanuvchi nomi bo\'sh bo\'lishi mumkin emas');
      return;
    }
    setLoading(true);
    try {
      // In a real app we might have updateDisplayName too
      const updated = await updateUsername({ username: username.trim() });
      setUser(updated);
      Alert.alert('Muvaffaqiyatli', 'Ma\'lumotlar saqlandi');
      router.back();
    } catch (err: any) {
      Alert.alert('Xato', err.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#007AFF', '#00C6FF']}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 25,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <XStack ai="center" gap="$4">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">Shaxsiy ma'lumotlar</Text>
        </XStack>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ p: 20 }}>
          <YStack gap="$6">
            <YStack gap="$4">
               <YStack gap="$1.5">
                  <Text col={isDark ? '$gray11' : '$gray10'} fos={13} fow="800" ml="$1">FOYDALANUVCHI NOMI</Text>
                  <XStack ai="center" bg={isDark ? '#1C1C1E' : 'white'} br={16} px="$4" h={56} gap="$3" borderWidth={1} borderColor={isDark ? '#2C2C2E' : '$gray3'}>
                    <User size={20} color="#007AFF" />
                    <Input 
                      f={1}
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Username"
                      bg="transparent"
                      borderWidth={0}
                      col={isDark ? 'white' : '#1E293B'}
                      fow="600"
                    />
                  </XStack>
               </YStack>

               <YStack gap="$1.5">
                  <Text col={isDark ? '$gray11' : '$gray10'} fos={13} fow="800" ml="$1">TO'LIQ ISM (DISPLAY NAME)</Text>
                  <XStack ai="center" bg={isDark ? '#1C1C1E' : 'white'} br={16} px="$4" h={56} gap="$3" borderWidth={1} borderColor={isDark ? '#2C2C2E' : '$gray3'}>
                    <UserCircle size={20} color="#8B5CF6" />
                    <Input 
                      f={1}
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Display Name"
                      bg="transparent"
                      borderWidth={0}
                      col={isDark ? 'white' : '#1E293B'}
                      fow="600"
                    />
                  </XStack>
               </YStack>

               <YStack gap="$1.5">
                  <Text col={isDark ? '$gray11' : '$gray10'} fos={13} fow="800" ml="$1">ID (NICKNAME)</Text>
                  <XStack ai="center" bg={isDark ? '#1C1C1E' : 'white'} br={16} px="$4" h={56} gap="$3" borderWidth={1} borderColor={isDark ? '#2C2C2E' : '$gray3'} opacity={0.6}>
                    <Hash size={20} color="$gray10" />
                    <Text f={1} col={isDark ? 'white' : '#1E293B'} fow="600">@{user?.uniqueId}</Text>
                  </XStack>
                  <Text fos={11} col="$gray9" ml="$1">Unique ID o'zgartirib bo'lmaydi</Text>
               </YStack>
            </YStack>

            <Button
              bg="#007AFF"
              h={60}
              br={20}
              onPress={handleSave}
              disabled={!hasChanges || loading}
              pressStyle={{ scale: 0.98, opacity: 0.9 }}
              shadowColor="#007AFF"
              shadowOpacity={0.3}
              shadowRadius={15}
              elevation={10}
            >
              {loading ? <Spinner color="white" /> : <Text col="white" fow="900" fos={16}>Saqlash</Text>}
            </Button>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
  );
}
