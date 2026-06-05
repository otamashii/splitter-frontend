import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Spinner, Separator, Input, Button } from 'tamagui';
import { 
  ChevronLeft, Search, Plus, Users, MessageSquare, 
  ChevronRight, MoreVertical, LayoutGrid, LayoutList
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useGroupsStore } from '@/features/groups/model/groups.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useAppStore } from '@/shared/lib/stores/app-store';

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { groups, loading, fetchGroups } = useGroupsStore();
  const [q, setQ] = useState('');

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const filtered = useMemo(() => {
    if (!q) return groups;
    const qq = q.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(qq));
  }, [groups, q]);

  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  return (
    <YStack f={1} bg={isDark ? '#000000' : 'white'}>
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
          <Text col="white" fos={24} fow="900">{t('groups.title', 'Groups')}</Text>
          <Link href="/tabs/groups/create" asChild>
            <Pressable>
              <YStack p="$2.5" br={14} bg="rgba(255,255,255,0.2)">
                <Plus size={22} color="white" />
              </YStack>
            </Pressable>
          </Link>
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

      <ScrollView f={1} p="$5" showsVerticalScrollIndicator={false}>
        <YStack gap="$4">
          {loading && !groups.length ? (
            <YStack ai="center" py="$10">
              <Spinner size="large" color="#007AFF" />
            </YStack>
          ) : filtered.length === 0 ? (
            <YStack ai="center" py="$20" gap="$4">
              <Circle size={100} bg="$gray2" ai="center" jc="center">
                <Users size={48} color="$gray8" strokeWidth={1} />
              </Circle>
              <YStack ai="center" gap="$1">
                <Text col="$gray11" fos={18} fow="800">{t('groups.none', 'No groups yet')}</Text>
                <Text col="$gray9" ta="center" px="$8">
                  {t('groups.create_hint', 'Create a group to split bills with multiple friends')}
                </Text>
              </YStack>
              <Link href="/tabs/groups/create" asChild>
                <Button bg="#007AFF" br={16} mt="$2">
                  <Text col="white" fow="800">{t('groups.create', 'Create Group')}</Text>
                </Button>
              </Link>
            </YStack>
          ) : (
            filtered.map((g: any) => (
              <Link key={g.id} href={`/tabs/chat/${g.id}?type=group`} asChild>
                <Pressable>
                  <XStack 
                    bg={isDark ? '#1C1C1E' : 'white'} 
                    br={28} 
                    p="$4" 
                    ai="center" 
                    jc="space-between"
                    shadowColor="#000"
                    shadowOpacity={isDark ? 0.3 : 0.04}
                    shadowRadius={15}
                    elevation={3}
                    borderWidth={1}
                    borderColor={isDark ? '#2C2C2E' : '$gray3'}
                    mb="$1"
                  >
                    <XStack ai="center" gap="$4">
                      <YStack>
                        <UserAvatar 
                          label={g.name.charAt(0).toUpperCase()} 
                          size={56} 
                          backgroundColor={isDark ? '#2C2C2E' : '$gray3'}
                        />
                        <Circle 
                          pos="absolute" 
                          bottom={0} 
                          right={0} 
                          size={20} 
                          bg="#34C759" 
                          bw={3} 
                          boc={isDark ? '#1C1C1E' : 'white'} 
                        />
                      </YStack>
                      <YStack gap="$1">
                        <Text fos={18} fow="900" col={isDark ? 'white' : '#1E293B'}>{g.name}</Text>
                        <XStack ai="center" gap="$1.5">
                          <Users size={12} color="$gray9" />
                          <Text fos={12} col="$gray9" fow="700">
                             {t('groups.members_count', { count: g.membersCount || 0 })}
                          </Text>
                          <View w={3} h={3} br={2} bg="$gray7" />
                          <Text fos={11} fow="800" col="#34C759" textTransform="uppercase">
                            {t('groups.active', 'Active')}
                          </Text>
                        </XStack>
                      </YStack>
                    </XStack>
                    <ChevronRight size={20} color="$gray8" />
                  </XStack>
                </Pressable>
              </Link>
            ))
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
