import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Alert, Modal, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Input, Separator, Button } from 'tamagui';
import { 
  Search, UserPlus, Users, MessageSquare, 
  ChevronRight, QrCode, Trash2, X, User, Mail
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';

import { useFriendsStore } from '@/features/friends/model/friends.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { apiClient } from '@/features/auth/api';

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { friends, loading, fetchAll, remove } = useFriendsStore();
  const [q, setQ] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);

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
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
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

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 120 }}
      >
        <YStack gap="$5">
          {/* Add friends network banner */}
          <LinearGradient
            colors={isDark ? ['#1e1b4b', '#1c1c1e'] : ['#E0F2FE', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ 
              borderRadius: 24, 
              padding: 16, 
              borderWidth: 1, 
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,122,255,0.1)' 
            }}
          >
            <XStack ai="center" jc="space-between" gap="$3">
              <YStack gap="$1" f={1}>
                <Text col={isDark ? 'white' : '#0369A1'} fontSize={15} fontWeight="900">
                  {t('friends.invite_banner_title', "Yangi do'stlar qo'shing")}
                </Text>
                <Text col={isDark ? '#94A3B8' : '#0284C7'} fontSize={11} fontWeight="600" opacity={0.9}>
                  {t('friends.invite_banner_desc', "Nickname yoki QR-kod yordamida do'stlaringizni toping")}
                </Text>
              </YStack>
              <Button
                bg="#007AFF"
                br={12}
                h={36}
                px="$3"
                onPress={() => router.push('/tabs/friends/search')}
                pressStyle={{ scale: 0.95, opacity: 0.9 }}
              >
                <Text col="white" fow="800" fos={12}>{t('friends.status.add', "Qo'shish")}</Text>
              </Button>
            </XStack>
          </LinearGradient>

          <XStack ai="center" jc="space-between">
            <Text fos={14} fow="800" col="$gray9" textTransform="uppercase" ls={1}>
              {t('friends.my_friends', 'My Friends')}
            </Text>
            <View bg={isDark ? '#2C2C2E' : '$gray2'} px="$2.5" py="$1" br={8}>
              <Text fos={12} fow="800" col={isDark ? 'white' : '$gray10'}>{filtered.length}</Text>
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
                <Pressable 
                  key={key} 
                  onPress={() => setSelectedFriend(f)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  })}
                >
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
                      <View>
                        <UserAvatar 
                          uri={avatarUrl} 
                          label={avatarLabel} 
                          size={52} 
                          backgroundColor={isDark ? '#2C2C2E' : '$gray3'}
                        />
                        <Circle 
                          pos="absolute" 
                          bottom={-1} 
                          right={-1} 
                          size={14} 
                          bg="#34C759" 
                          bw={2} 
                          boc={isDark ? '#1C1C1E' : 'white'} 
                        />
                      </View>
                      <YStack>
                        <Text fontSize={17} fontWeight="800" col={isDark ? 'white' : '#1E293B'}>{title}</Text>
                        <Text fontSize={12} col="$gray9" fontWeight="600">@{uniqueId}</Text>
                      </YStack>
                    </XStack>
                    
                    <XStack ai="center" gap="$2.5">
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
                        style={({ pressed }) => ({ 
                          opacity: pressed ? 0.6 : 1,
                          transform: [{ scale: pressed ? 0.9 : 1 }]
                        })}
                      >
                        <Circle size={38} bg="rgba(0,122,255,0.08)" ai="center" jc="center">
                          <MessageSquare size={18} color="#007AFF" />
                        </Circle>
                      </Pressable>
                      <ChevronRight size={18} color={isDark ? '#475569' : '$gray8'} />
                    </XStack>
                  </XStack>
                </Pressable>
              );
            })
          )}
        </YStack>
      </ScrollView>

      {/* Friend Detail Modal */}
      <Modal
        visible={!!selectedFriend}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFriend(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedFriend(null)}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>

          <YStack
            width="90%"
            maxWidth={350}
            bg={isDark ? '#1E293B' : 'white'}
            br={32}
            p="$5"
            gap="$4"
            shadowColor="#000"
            shadowOpacity={0.25}
            shadowRadius={20}
            elevation={10}
            borderWidth={1}
            borderColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
          >
            {/* Modal Header */}
            <XStack jc="space-between" ai="center">
              <Text fontSize={14} fontWeight="800" col="$gray9" textTransform="uppercase" ls={0.5}>
                {t('friends.friend_profile', "Do'st profili")}
              </Text>
              <Pressable onPress={() => setSelectedFriend(null)}>
                <Circle size={32} bg={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} ai="center" jc="center">
                  <X size={16} color={isDark ? 'white' : '#1E293B'} />
                </Circle>
              </Pressable>
            </XStack>

            {/* Profile Detail Content */}
            {selectedFriend && (() => {
              const u = selectedFriend.user || {};
              const title = u.displayName || u.username || 'User';
              const uniqueId = u.uniqueId || selectedFriend.uniqueId;
              const avatarUrl = u.avatarUrl || selectedFriend.avatarUrl;
              const avatarLabel = title.charAt(0).toUpperCase();

              return (
                <YStack ai="center" gap="$3" py="$2">
                  <View>
                    <UserAvatar uri={avatarUrl} label={avatarLabel} size={80} />
                    <Circle
                      pos="absolute"
                      bottom={2}
                      right={2}
                      size={18}
                      bg="#34C759"
                      bw={3}
                      boc={isDark ? '#1E293B' : 'white'}
                    />
                  </View>
                  <YStack ai="center" gap="$1">
                    <Text fontSize={20} fontWeight="900" col={isDark ? 'white' : '#1E293B'} ta="center">{title}</Text>
                    <Text fontSize={14} col="#007AFF" fontWeight="700" ta="center">@{uniqueId}</Text>
                  </YStack>

                  <Separator w="100%" my="$2" borderColor={isDark ? 'rgba(255,255,255,0.1)' : '$gray3'} />

                  {/* Extra info */}
                  <YStack w="100%" gap="$2.5" px="$2">
                    <XStack ai="center" gap="$2.5">
                      <Circle size={28} bg={isDark ? 'rgba(255,255,255,0.05)' : '$gray2'} ai="center" jc="center">
                        <User size={14} color={isDark ? '$gray9' : '$gray10'} />
                      </Circle>
                      <YStack>
                        <Text fontSize={10} col="$gray9" fontWeight="700" textTransform="uppercase">Status</Text>
                        <Text fontSize={13} col={isDark ? 'white' : '#1E293B'} fontWeight="600">{t('friends.status.friend', "Do'stlar ro'yxatida")}</Text>
                      </YStack>
                    </XStack>

                    {u.email && (
                      <XStack ai="center" gap="$2.5">
                        <Circle size={28} bg={isDark ? 'rgba(255,255,255,0.05)' : '$gray2'} ai="center" jc="center">
                          <Mail size={14} color={isDark ? '$gray9' : '$gray10'} />
                        </Circle>
                        <YStack>
                          <Text fontSize={10} col="$gray9" fontWeight="700" textTransform="uppercase">Email</Text>
                          <Text fontSize={13} col={isDark ? 'white' : '#1E293B'} fontWeight="600" numberOfLines={1}>{u.email}</Text>
                        </YStack>
                      </XStack>
                    )}
                  </YStack>

                  <Separator w="100%" my="$2" borderColor={isDark ? 'rgba(255,255,255,0.1)' : '$gray3'} />

                  {/* Action Buttons */}
                  <YStack w="100%" gap="$2.5" mt="$1">
                    <Button
                      bg="#007AFF"
                      h={48}
                      br={14}
                      pressStyle={{ scale: 0.97, opacity: 0.9 }}
                      icon={<MessageSquare size={18} color="white" />}
                      onPress={async () => {
                        setSelectedFriend(null);
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
                    >
                      <Text col="white" fow="800" fos={14}>{t('chat.actions.reply', 'Xabar yozish')}</Text>
                    </Button>

                    <Button
                      bg="rgba(255, 59, 48, 0.08)"
                      borderColor="rgba(255, 59, 48, 0.15)"
                      borderWidth={1}
                      h={48}
                      br={14}
                      pressStyle={{ scale: 0.97, bg: 'rgba(255, 59, 48, 0.15)' }}
                      icon={<Trash2 size={18} color="#FF3B30" />}
                      onPress={() => {
                        Alert.alert(
                          t('common.delete', "Do'stlikdan o'chirish"),
                          t('friends.delete_confirm', `${title}ni do'stlaringiz ro'yxatidan o'chirmoqchimisiz?`),
                          [
                            { text: t('common.cancel', 'Bekor qilish'), style: 'cancel' },
                            {
                              text: t('common.delete', "O'chirish"),
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await remove(uniqueId);
                                  setSelectedFriend(null);
                                } catch (err) {
                                  console.error('Failed to remove friend:', err);
                                  Alert.alert(t('common.error', 'Xato'), t('profile.alerts.avatarResetFailed', "Do'stni o'chirib bo'lmadi."));
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text col="#FF3B30" fow="800" fos={14}>{t('friends.details.delete', "Do'stlikdan o'chirish")}</Text>
                    </Button>
                  </YStack>
                </YStack>
              );
            })()}
          </YStack>
        </View>
      </Modal>
    </YStack>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
