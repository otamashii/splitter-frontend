import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter, useRootNavigation } from 'expo-router';
import { useNavigation, CommonActions } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { YStack, XStack, Text, Button, Separator, Spinner, Circle, View } from 'tamagui';
import { 
  Copy, LogOut, Upload, RotateCcw, CheckCircle, User as UserIcon, 
  Mail, Lock, Edit3, X, Check, Languages, ChevronRight, Bell, Shield, HelpCircle, Settings, Coins
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { changePassword, resetAvatar, updateEmail, updateUsername, uploadAvatar } from '@/features/auth/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ProfileMenuItem({ icon: Icon, label, color = '#007AFF', onPress, rightContent }: { icon: any, label: string, color?: string, onPress?: () => void, rightContent?: React.ReactNode }) {
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      opacity: pressed ? 0.7 : 1,
      backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,122,255,0.05)') : 'transparent',
      borderRadius: 20,
      transform: [{ scale: pressed ? 0.98 : 1 }]
    })}>
      <XStack ai="center" jc="space-between" p="$4">
        <XStack ai="center" gap="$3">
          <Circle size={40} bg={`${color}15`} ai="center" jc="center">
            <Icon size={20} color={color} />
          </Circle>
          <Text fontSize={16} fontWeight="700" col={isDark ? 'white' : '#1E293B'}>{label}</Text>
        </XStack>
        {rightContent ? rightContent : <ChevronRight size={20} color={isDark ? '#475569' : '$gray8'} />}
      </XStack>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const rootNavigation = useRootNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const theme = useAppStore(s => s.theme);
  const currency = useAppStore(s => s.currency);
  const isDark = theme === 'dark';

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout_confirm', 'Chiqish'),
      t('profile.logout_message', 'Haqiqatan ham chiqmoqchimisiz?'),
      [
        { text: t('common.cancel', 'Bekor qilish'), style: 'cancel' },
        {
          text: t('profile.logout', 'Chiqish'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (e) {
              console.error('Logout error:', e);
            } finally {
              rootNavigation?.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'login' }],
                })
              );
            }
          },
        },
      ]
    );
  };

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Premium Profile Header */}
        <LinearGradient
          colors={isDark ? ['#0F172A', '#1E293B'] : ['#007AFF', '#00C6FF']}
          style={{
            paddingTop: insets.top + 20,
            paddingBottom: 40,
            paddingHorizontal: 24,
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
            alignItems: 'center'
          }}
        >
          <YStack ai="center" gap="$3">
            <View>
              <UserAvatar uri={user?.avatarUrl} label={user?.username?.slice(0, 1).toUpperCase()} size={100} />
              <Pressable style={{ position: 'absolute', bottom: 0, right: 0 }}>
                <Circle size={32} bg="#007AFF" ai="center" jc="center" borderWidth={3} borderColor="#1E293B">
                   <Edit3 size={16} color="white" />
                </Circle>
              </Pressable>
            </View>
            <YStack ai="center">
              <Text col="white" fontSize={24} fontWeight="900">{user?.username || 'User'}</Text>
              <Text col="white" fontSize={16} fontWeight="800" opacity={0.9}>@{user?.uniqueId || 'nickname'}</Text>
              <Text col="white" opacity={0.8} fontSize={12} fontWeight="600">{user?.email}</Text>
            </YStack>
            <XStack bg="rgba(255,255,255,0.1)" br={20} px="$4" py="$1.5" ai="center" gap="$2">
               <Shield size={14} color="white" />
               <Text col="white" fontSize={12} fontWeight="800" textTransform="uppercase">Verified Account</Text>
            </XStack>
          </YStack>
        </LinearGradient>

        <YStack p="$5" gap="$6">
          {/* Settings Group */}
          <YStack bg={isDark ? '#1C1C1E' : 'white'} br={32} p="$2" shadowColor="#000" shadowOpacity={isDark ? 0.3 : 0.03} shadowRadius={20} elevation={5}>
              <ProfileMenuItem 
                icon={UserIcon} 
                label="Shaxsiy ma'lumotlar" 
                onPress={() => router.push('/tabs/settings/personal')}
              />
             <Separator ml={60} borderColor={isDark ? '#2C2C2E' : '$gray3'} />
                           <ProfileMenuItem 
                icon={Mail} 
                label="Email sozlamalari" 
                onPress={() => router.push('/tabs/settings/email')}
              />
             <Separator ml={60} borderColor={isDark ? '#2C2C2E' : '$gray3'} />
                           <ProfileMenuItem 
                icon={Lock} 
                label="Xavfsizlik" 
                onPress={() => router.push('/tabs/settings/security')}
              />
             <Separator ml={60} borderColor={isDark ? '#2C2C2E' : '$gray3'} />
              <ProfileMenuItem 
                icon={Languages} 
                label="Til (Language)" 
                rightContent={<Text fontWeight="700" col="$gray9">O'zbekcha</Text>} 
                onPress={() => router.push('/tabs/settings/language')}
              />
              <Separator ml={60} borderColor={isDark ? '#2C2C2E' : '$gray3'} />
              <ProfileMenuItem 
                icon={Coins} 
                label="Asosiy valyuta" 
                rightContent={<Text fontWeight="700" col="$gray9">{currency}</Text>} 
                onPress={() => router.push('/tabs/settings/currency')}
              />
          </YStack>

          {/* App Group */}
          <YStack bg={isDark ? '#1C1C1E' : 'white'} br={32} p="$2" shadowColor="#000" shadowOpacity={isDark ? 0.3 : 0.03} shadowRadius={20} elevation={5}>
             <ProfileMenuItem 
               icon={Settings} 
               label="Sozlamalar" 
               color="#8B5CF6" 
               onPress={() => router.push('/tabs/settings')}
             />
             <Separator ml={60} borderColor={isDark ? '#2C2C2E' : '$gray3'} />
                           <ProfileMenuItem 
                icon={Bell} 
                label="Bildirishnomalar" 
                color="#F59E0B" 
                onPress={() => router.push('/tabs/settings/notifications')}
              />
             <Separator ml={60} borderColor={isDark ? '#2C2C2E' : '$gray3'} />
             <ProfileMenuItem icon={HelpCircle} label="Yordam va qo'llab-quvvatlash" color="#10B981" />
          </YStack>

          {/* Logout */}
          <Button
            onPress={handleLogout}
            bg="rgba(255, 59, 48, 0.05)"
            borderColor="rgba(255, 59, 48, 0.1)"
            borderWidth={1}
            h={60}
            br={20}
            icon={<LogOut size={20} color="#FF3B30" />}
          >
            <Text col="#FF3B30" fontWeight="800" fontSize={16}>Chiqish</Text>
          </Button>

          <YStack ai="center" mt="$4" mb="$10">
             <Text col="$gray9" fontSize={12} fontWeight="600">Splitter v2.4.0</Text>
             <Text col="$gray9" fontSize={12} fontWeight="600">Google Deepmind © 2026</Text>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
