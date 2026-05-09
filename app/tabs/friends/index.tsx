import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Separator, Input } from 'tamagui';
import { 
  ChevronLeft, Search, UserPlus, Users, MessageSquare, 
  ChevronRight, Filter, UserCheck, Clock 
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useFriendsStore } from '@/features/friends/model/friends.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { apiClient } from '@/features/auth/api';

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { friends, loading, error, fetchAll } = useFriendsStore();
  const [q, setQ] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    if (!q) return friends;
    const qq = q.toLowerCase();
    const cleanQ = qq.replace(/^@/, '');
    return friends.filter(f => {
      const name = (f?.user?.displayName || f?.user?.username || '').toLowerCase();
      const uid = (f?.user?.uniqueId || f?.uniqueId || '').toLowerCase();
      return name.includes(qq) || uid.includes(cleanQ);
    });
  }, [friends, q]);

  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  return (
    <YStack f={1} bg={isDark ? '#000000' : 'white'}>
      {/* Ultra-Premium Header */}
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
        <XStack ai="center" jc="space-between" mb="$5">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">Do'stlar</Text>
          <Pressable onPress={() => router.push('/tabs/friends/requests')}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
               <UserPlus size={24} color="white" />
            </YStack>
          </Pressable>
        </XStack>

        <XStack ai="center" bg="rgba(255,255,255,0.1)" br={16} h={52} px="$4" gap="$3">
          <Search size={20} color="rgba(255,255,255,0.5)" />
          <Input
            f={1}
            placeholder="Do'stlarni izlash..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={q}
            onChangeText={setQ}
            bg="transparent"
            borderWidth={0}
            col="white"
            fos={16}
            fow="600"
          />
        </XStack>
      </LinearGradient>

      <ScrollView f={1} showsVerticalScrollIndicator={false}>
        <YStack p="$5" pt="$6" gap="$4" pb="$20">
          <XStack ai="center" jc="space-between" mb="$2" px="$1">
            <Text col="$gray11" fos={14} fow="900" letterSpacing={0.5} textTransform="uppercase">Mening do'stlarim</Text>
            <View bg="$gray3" px="$2.5" py="$1" br={12}>
              <Text col="$gray10" fos={12} fow="800">{filtered.length}</Text>
            </View>
          </XStack>

          {loading && !friends.length ? (
            <YStack ai="center" py="$10"><Spinner color="#007AFF" /></YStack>
          ) : filtered.map((f, i) => {
            const user = f.user;
            const title = user?.displayName || user?.username || f.displayName || f.username || 'User';
            const uniqueId = user?.uniqueId || f.uniqueId;
            const avatarUrl = user?.avatarUrl || f.avatarUrl;
            const avatarLabel = title.charAt(0).toUpperCase();
            
            const key = f.id ? `friend-${f.id}` : `friend-idx-${i}`;
            return (
              <Pressable key={key} style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              })}>
                <XStack 
                  bg={isDark ? '#1C1C1E' : 'white'} 
                  br={24} 
                  p="$4" 
                  ai="center" 
                  jc="space-between"
                  shadowColor="#000"
                  shadowOpacity={isDark ? 0.3 : 0.03}
                  shadowRadius={15}
                  elevation={3}
                  borderWidth={1}
                  borderColor={isDark ? '#2C2C2E' : '$gray3'}
                >
                  <XStack ai="center" gap="$3">
                    <UserAvatar 
                      uri={avatarUrl} 
                      label={avatarLabel} 
                      size={52} 
                      backgroundColor={isDark ? '#2C2C2E' : '$gray3'}
                    />
                    <YStack>
                      <Text fontSize={17} fontWeight="800" col={isDark ? 'white' : '#1E293B'}>{title}</Text>
                      <Text fontSize={12} col="$gray9" fontWeight="600">@{uniqueId}</Text>
                    </YStack>
                  </XStack>
                  <Pressable 
                    onPress={async () => {
                      try {
                        const targetUid = user?.uniqueId || f.uniqueId || f.user?.uniqueId;
                        const targetTitle = user?.displayName || user?.username || f.displayName || f.username;
                        if (!targetUid) return;
                        
                        const res = await apiClient.post('/chats', { uniqueId: targetUid });
                        router.push({
                          pathname: `/tabs/chat/${res.data.id}`,
                          params: { title: targetTitle }
                        });
                      } catch (err) {
                        console.error('Failed to start chat:', err);
                      }
                    }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Circle size={36} bg="rgba(0,122,255,0.08)" ai="center" jc="center">
                      <MessageSquare size={18} color="#007AFF" />
                    </Circle>
                  </Pressable>
                </XStack>
              </Pressable>
            );
          })}
          {!loading && !filtered.length && (
            <YStack ai="center" py="$20" gap="$3">
              <Circle size={80} bg="$gray2" ai="center" jc="center">
                <Users size={40} color="$gray8" />
              </Circle>
              <Text col="$gray9" fow="700">Do'stlar topilmadi</Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
