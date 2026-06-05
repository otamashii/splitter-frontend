import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Input } from 'tamagui';
import { 
  Search, UserPlus, Users, MessageSquare, 
  ChevronRight, QrCode
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
  const { friends, loading, fetchAll } = useFriendsStore();
  const [q, setQ] = useState('');

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
      {/* Header with Blue Gradient */}
      <LinearGradient
        colors={['#007AFF', '#0055FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 25,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <XStack ai="center" jc="space-between">
          <Text col="white" fos={24} fow="900">{t('friends.title', 'Friends')}</Text>
          <XStack gap="$3">
            <Link href="/tabs/friends/requests" asChild>
              <Pressable>
                <YStack p="$2.5" br={14} bg="rgba(255,255,255,0.2)">
                  <UserPlus size={22} color="white" />
                </YStack>
              </Pressable>
            </Link>
            <Link href="/tabs/scan-invite?from=friends-requests" asChild>
              <Pressable>
                <YStack p="$2.5" br={14} bg="rgba(255,255,255,0.2)">
                  <QrCode size={22} color="white" />
                </YStack>
              </Pressable>
            </Link>
          </XStack>
        </XStack>

        <YStack mt="$5">
          <XStack ai="center" bg="rgba(255,255,255,0.15)" br={16} h={52} px="$4" gap="$3">
            <Search size={20} color="rgba(255,255,255,0.6)" />
            <Input
              f={1}
              placeholder={t('friends.search_placeholder', 'Search friends...')}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={q}
              onChangeText={setQ}
              bg="transparent"
              borderWidth={0}
              col="white"
              fos={16}
              fow="600"
            />
          </XStack>
        </YStack>
      </LinearGradient>

      <ScrollView f={1} p="$5" showsVerticalScrollIndicator={false}>
        <YStack gap="$4">
          <XStack ai="center" jc="space-between" mb="$2">
            <Text fos={14} fow="800" col="$gray9" textTransform="uppercase" ls={1}>
              {t('friends.my_friends', 'My Friends')}
            </Text>
            <View bg="$gray2" px="$2.5" py="$1" br={8}>
              <Text fos={12} fow="800" col="$gray10">{filtered.length}</Text>
            </View>
          </XStack>

          {loading && !friends.length ? (
            <YStack ai="center" py="$10"><Spinner color="#007AFF" /></YStack>
          ) : filtered.length === 0 ? (
            <YStack ai="center" py="$20" gap="$3">
              <Circle size={80} bg="$gray2" ai="center" jc="center">
                <Users size={40} color="$gray8" />
              </Circle>
              <Text col="$gray9" fow="700">
                {q ? t('friends.not_found', 'No friends found') : t('friends.empty', 'No friends yet')}
              </Text>
            </YStack>
          ) : (
            filtered.map((f: any, i: number) => {
              const u = f.user;
              if (!u) return null;
              const title = u.displayName || u.username || 'User';
              const uniqueId = u.uniqueId;
              const avatarUrl = u.avatarUrl;
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
                          const res = await apiClient.post('/chats', { uniqueId });
                          router.push({
                            pathname: `/tabs/chat/${res.data.id}`,
                            params: { title }
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
            })
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
