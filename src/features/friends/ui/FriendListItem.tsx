import { memo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { XStack, YStack, Paragraph, Button, Text } from 'tamagui';
import { Trash2, MessageCircle } from '@tamagui/lucide-icons';
import { useFriendsStore } from '../model/friends.store';
import { useRouter } from 'expo-router';
import { apiClient as api } from '@/features/auth/api';
import UserAvatar from '@/shared/ui/UserAvatar';

function pickTitle(f: any) {
  return (
    f?.user?.displayName ||
    f?.displayName ||
    f?.user?.username ||
    f?.username ||
    `User #${f?.user?.id ?? f?.userId ?? f?.id}`
  );
}

function pickUniqueId(f: any): string | undefined {
  return (
    f?.uniqueId ||
    f?.user?.uniqueId ||
    f?.raw?.uniqueId ||
    f?.raw?.user?.uniqueId ||
    undefined
  );
}

function pickSubtitle(f: any) {
  const uniqueId = pickUniqueId(f);
  return uniqueId ? `@${uniqueId.toLowerCase().replace('user#', 'user')}` : '';
}

function pickAvatar(f: any): string | null {
  return (
    f?.avatarUrl ??
    f?.user?.avatarUrl ??
    f?.raw?.avatarUrl ??
    f?.raw?.user?.avatarUrl ??
    null
  );
}

export const FriendListItem = memo(function FriendListItem({ friend }: { friend: any }) {
  const { remove } = useFriendsStore();
  const { t } = useTranslation();
  const router = useRouter();

  const title = pickTitle(friend);
  const subtitle = pickSubtitle(friend);
  const uniqueId = pickUniqueId(friend);
  const avatarUrl = pickAvatar(friend);
  const avatarLabel = (title || 'U').slice(0, 1).toUpperCase() || 'U';

  const handleRemove = () => {
    const uid = uniqueId;
    if (!uid) return;

    Alert.alert(
      t('friends.remove', 'Remove friend'),
      `Are you sure you want to remove ${title}?`,
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('friends.remove', 'Remove'),
          style: 'destructive',
          onPress: () => remove(uid),
        },
      ]
    );
  };

  const handleChat = async () => {
    if (!uniqueId) return;
    try {
      const res = await api.post('/chats', { uniqueId });
      router.push({ pathname: '/tabs/chat/[id]', params: { id: res.data.id, title } });
    } catch (err) {
      console.error('Failed to create/open chat', err);
    }
  };

  return (
    <XStack h={60} ai="center" jc="space-between" px="$4" bg="$background">
      <XStack ai="center" gap="$3">
        <UserAvatar
          uri={avatarUrl ?? undefined}
          label={avatarLabel}
          size={36}
          textSize={14}
          backgroundColor="$gray5"
        />
        <YStack>
          <Text fontSize={17} fontWeight="600">{title}</Text>
          {!!subtitle && <Paragraph fontSize={14} color="$gray10">{subtitle}</Paragraph>}
        </YStack>
      </XStack>

      <XStack gap="$2" ai="center">
        <Button
          icon={<MessageCircle size={20} color="$blue10" />}
          chromeless
          circular
          onPress={handleChat}
          pressStyle={{ bg: '$blue3' }}
          disabled={!uniqueId}
        />
        <Button
          icon={<Trash2 size={20} color="$red10" />}
          chromeless
          circular
          onPress={handleRemove}
          pressStyle={{ bg: '$red3' }}
          disabled={!uniqueId}
        />
      </XStack>
    </XStack>
  );
});
