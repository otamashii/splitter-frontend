import React, { useState } from 'react';
import { Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Input, Button, Spinner } from 'tamagui';
import { ChevronLeft, Lock, Eye, EyeOff, ShieldCheck } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/shared/lib/stores/app-store';
import { changePassword } from '@/features/auth/api';

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Xato', 'Barcha maydonlarni to\'ldiring');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Xato', 'Yangi parollar mos kelmadi');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Xato', 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      Alert.alert('Muvaffaqiyatli', 'Parol muvaffaqiyatli o\'zgartirildi');
      router.back();
    } catch (err: any) {
      Alert.alert('Xato', err.message || 'Parolni o\'zgartirishda xatolik yuz berdi');
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
          <Text col="white" fos={20} fow="900">Xavfsizlik</Text>
        </XStack>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ p: 20 }}>
          <YStack gap="$6">
            <YStack ai="center" py="$4">
               <Circle size={80} bg="rgba(0,122,255,0.1)" ai="center" jc="center">
                  <ShieldCheck size={40} color="#007AFF" />
               </Circle>
               <Text mt="$3" fos={14} col="$gray9" ta="center">Parolingizni muntazam ravishda yangilab turish xavfsizligingizni oshiradi</Text>
            </YStack>

            <YStack gap="$4">
               <YStack gap="$1.5">
                  <Text col={isDark ? '$gray11' : '$gray10'} fos={13} fow="800" ml="$1">JORIY PAROL</Text>
                  <XStack ai="center" bg={isDark ? '#1C1C1E' : 'white'} br={16} px="$4" h={56} gap="$3" borderWidth={1} borderColor={isDark ? '#2C2C2E' : '$gray3'}>
                    <Lock size={20} color="#007AFF" />
                    <Input 
                      f={1}
                      secureTextEntry={!showPass}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="••••••••"
                      bg="transparent"
                      borderWidth={0}
                      col={isDark ? 'white' : '#1E293B'}
                    />
                    <Pressable onPress={() => setShowPass(!showPass)}>
                       {showPass ? <EyeOff size={20} color="$gray9" /> : <Eye size={20} color="$gray9" />}
                    </Pressable>
                  </XStack>
               </YStack>

               <YStack gap="$1.5">
                  <Text col={isDark ? '$gray11' : '$gray10'} fos={13} fow="800" ml="$1">YANGI PAROL</Text>
                  <XStack ai="center" bg={isDark ? '#1C1C1E' : 'white'} br={16} px="$4" h={56} gap="$3" borderWidth={1} borderColor={isDark ? '#2C2C2E' : '$gray3'}>
                    <Lock size={20} color="#8B5CF6" />
                    <Input 
                      f={1}
                      secureTextEntry={!showPass}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="••••••••"
                      bg="transparent"
                      borderWidth={0}
                      col={isDark ? 'white' : '#1E293B'}
                    />
                  </XStack>
               </YStack>

               <YStack gap="$1.5">
                  <Text col={isDark ? '$gray11' : '$gray10'} fos={13} fow="800" ml="$1">YANGI PAROLNI TASDIQLASH</Text>
                  <XStack ai="center" bg={isDark ? '#1C1C1E' : 'white'} br={16} px="$4" h={56} gap="$3" borderWidth={1} borderColor={isDark ? '#2C2C2E' : '$gray3'}>
                    <Lock size={20} color="#10B981" />
                    <Input 
                      f={1}
                      secureTextEntry={!showPass}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      bg="transparent"
                      borderWidth={0}
                      col={isDark ? 'white' : '#1E293B'}
                    />
                  </XStack>
               </YStack>
            </YStack>

            <Button
              bg="#007AFF"
              h={60}
              br={20}
              onPress={handleSave}
              disabled={loading}
              pressStyle={{ scale: 0.98, opacity: 0.9 }}
              shadowColor="#007AFF"
              shadowOpacity={0.3}
              shadowRadius={15}
              elevation={10}
              mt="$4"
            >
              {loading ? <Spinner color="white" /> : <Text col="white" fow="900" fos={16}>Parolni yangilash</Text>}
            </Button>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
  );
}
