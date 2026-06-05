import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Input } from 'tamagui';
import { 
  Search, MessageSquare, Users
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { apiClient as api } from '@/features/auth/api';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme, user: currentUser } = useAppStore();
  const isDark = theme === 'dark';

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chats');
      setChats(res.data);
    } catch (e) {
      console.error('Fetch chats failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    if (!q) return chats;
    const qq = q.toLowerCase();
    return chats.filter(c => {
      const isGroup = c.type === 'group' || c.type === 'GROUP';
      const other = isGroup ? null : c.members?.find((m: any) => m.userId !== currentUser?.id)?.user;
      const title = isGroup ? (c.group?.name || '') : (other?.displayName || other?.username || '');
      return title.toLowerCase().includes(qq);
    });
  }, [chats, q, currentUser]);

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
      {/* Premium Header */}
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
          <Text col="white" fos={24} fow="900">{t('chat.title', 'Chats')}</Text>
          <XStack gap="$3">
            <Link href="/tabs/friends" asChild>
              <Pressable>
                <YStack p="$2.5" br={14} bg="rgba(255,255,255,0.2)">
                  <MessageSquare size={22} color="white" />
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
              placeholder={t('friends.requests.search', 'Search')}
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

      <ScrollView 
        f={1} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor="#007AFF" />
        }
      >
        <YStack p="$4" gap="$3" pb="$20">
          {loading && !chats.length ? (
            <YStack ai="center" py="$10">
              <Spinner size="large" color="#007AFF" />
            </YStack>
          ) : filtered.length === 0 ? (
            <YStack ai="center" py="$20" gap="$4">
              <Circle size={100} bg={isDark ? '#1C1C1E' : 'white'} ai="center" jc="center" shadowColor="#000" shadowOpacity={0.05} shadowRadius={20}>
                <MessageSquare size={48} color="$gray8" strokeWidth={1} />
              </Circle>
              <YStack ai="center" gap="$1">
                <Text col={isDark ? 'white' : '$gray12'} fos={18} fow="800">{t('chat.none', 'No chats yet')}</Text>
                <Text col="$gray9" ta="center" px="$8">
                  {t('chat.none_hint', 'Start messaging your friends')}
                </Text>
              </YStack>
            </YStack>
          ) : (
            filtered.map((chat: any) => {
              const isGroup = chat.type === 'group' || chat.type === 'GROUP';
              const other = isGroup ? null : chat.members?.find((m: any) => m.userId !== currentUser?.id)?.user;
              const title = isGroup ? chat.group?.name : (other?.displayName || other?.username || 'User');
              const uniqueId = isGroup ? null : other?.uniqueId;
              const subTitle = chat.lastMessage?.content || t('chat.no_messages', 'No messages');
              const avatarLabel = (title || 'U').charAt(0).toUpperCase();
              const time = chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              const unread = chat.unreadCount || 0;

              return (
                <Link key={chat.id} href={`/tabs/chat/${chat.id}`} asChild>
                  <Pressable style={({ pressed }) => ({
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
                      elevation={2}
                      borderWidth={1}
                      borderColor={isDark ? '#2C2C2E' : '$gray3'}
                    >
                      <XStack ai="center" gap="$4" f={1}>
                        <YStack>
                          <UserAvatar 
                            uri={isGroup ? undefined : other?.avatarUrl}
                            label={avatarLabel} 
                            size={52} 
                            backgroundColor={isDark ? '#2C2C2E' : '$gray3'}
                          />
                          {isGroup && (
                            <Circle 
                              pos="absolute" 
                              bottom={-2} 
                              right={-2} 
                              size={20} 
                              bg="#007AFF" 
                              bw={2} 
                              boc={isDark ? '#1C1C1E' : 'white'} 
                              ai="center" 
                              jc="center"
                            >
                               <Users size={10} color="white" />
                            </Circle>
                          )}
                        </YStack>
                        <YStack gap="$0.5" f={1}>
                          <XStack ai="center" jc="space-between">
                            <XStack ai="center" gap="$2" f={1}>
                              <Text fos={17} fow="800" col={isDark ? 'white' : '#1E293B'} numberOfLines={1}>
                                {title}
                              </Text>
                              {isGroup && (
                                <View bg="rgba(0,122,255,0.08)" px="$2" py="$0.5" br={6}>
                                   <Text col="#007AFF" fos={9} fow="900" textTransform="uppercase">
                                     {t('chat.group_tag', 'Group')}
                                   </Text>
                                </View>
                              )}
                            </XStack>
                            <Text fos={12} col="$gray9" fow="600">{time}</Text>
                          </XStack>
                          
                          <XStack ai="center" jc="space-between">
                            <YStack f={1}>
                              {uniqueId && (
                                <Text fos={12} col="$gray9" fow="600" mb="$0.5">@{uniqueId}</Text>
                              )}
                              <Text fos={14} col="$gray10" fow="500" numberOfLines={1} mr="$2">
                                {subTitle}
                              </Text>
                            </YStack>
                            {unread > 0 && (
                              <Circle size={20} bg="#007AFF" ai="center" jc="center">
                                <Text col="white" fos={10} fow="900">{unread}</Text>
                              </Circle>
                            )}
                          </XStack>
                        </YStack>
                      </XStack>
                    </XStack>
                  </Pressable>
                </Link>
              );
            })
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
