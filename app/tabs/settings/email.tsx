import React, { useState } from 'react';
import { Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Input, Button, Spinner } from 'tamagui';
import { ChevronLeft, Mail, Shield, CheckCircle } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/shared/lib/stores/app-store';
import { updateEmail } from '@/features/auth/api';

export default function EmailSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, setUser, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const hasChanges = email !== user?.email;

  const handleSave = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Xato', 'To\'g\'ri email manzilini kiriting');
      return;
    }
    setLoading(true);
    try {
      const updated = await updateEmail({ email: email.trim() });
      setUser(updated);
      Alert.alert('Muvaffaqiyatli', 'Email manzili yangilandi');
      router.back();
    } catch (err: any) {
      Alert.alert('Xato', err.message || 'Emailni yangilashda xatolik yuz berdi');
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
          <Text col="white" fos={20} fow="900">Email sozlamalari</Text>
        </XStack>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ p: 20 }}>
          <YStack gap="$6">
            <YStack ai="center" py="$4" gap="$2">
               <Circle size={80} bg="rgba(0,122,255,0.1)" ai="center" jc="center">
                  <Mail size={40} color="#007AFF" />
               </Circle>
               <Text fos={14} col="$gray9" ta="center">Email manzilingiz xabarnomalar va parolni tiklash uchun ishlatiladi</Text>
            </YStack>

            <YStack gap="$4">
               <YStack gap="$1.5">
                  <Text col={isDark ? '$gray11' : '$gray10'} fos={13} fow="800" ml="$1">EMAIL MANZILI</Text>
                  <XStack ai="center" bg={isDark ? '#1C1C1E' : 'white'} br={16} px="$4" h={56} gap="$3" borderWidth={1} borderColor={isDark ? '#2C2C2E' : '$gray3'}>
                    <Mail size={20} color="#007AFF" />
                    <Input 
                      f={1}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="example@mail.com"
                      bg="transparent"
                      borderWidth={0}
                      col={isDark ? 'white' : '#1E293B'}
                      fow="600"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <CheckCircle size={20} color="#10B981" />
                  </XStack>
               </YStack>

               <XStack bg={isDark ? '#1C1C1E' : 'white'} p="$4" br={16} ai="center" gap="$3" borderWidth={1} borderColor={isDark ? '#2C2C2E' : '$gray3'}>
                  <Shield size={20} color="#8B5CF6" />
                  <YStack f={1}>
                     <Text fos={14} fow="700" col={isDark ? 'white' : '#1E293B'}>Tasdiqlangan email</Text>
                     <Text fos={12} col="$gray9" fow="600">Sizning emailingiz xavfsiz holatda</Text>
                  </YStack>
               </XStack>
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
              {loading ? <Spinner color="white" /> : <Text col="white" fow="900" fos={16}>Yangilash</Text>}
            </Button>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
  );
}
