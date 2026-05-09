import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, TextInput, Share } from 'react-native';
import { YStack, XStack, Text, Button, Circle, ScrollView, View, Separator, Spinner, Sheet } from 'tamagui';
import { Check, ChevronLeft, ChevronRight, ArrowRight, Wallet, History, Share2, MessageSquare, Send } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useReceiptSessionStore, type FinishPayload } from '@/features/receipt/model/receipt-session.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useTranslation } from 'react-i18next';
import { apiClient as api } from '@/features/auth/api';

export default function FinishScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const lastFinishPayload = useReceiptSessionStore((s) => s.lastFinishPayload);
  const closeSession = useReceiptSessionStore((s) => s.closeSession);
  const finalizing = useReceiptSessionStore((s) => s.finalizing);
  const [paidAmounts, setPaidAmounts] = useState<Record<string, string>>({});
  const [commentTarget, setCommentTarget] = useState<{ itemId: string, itemName: string, participantId: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const payload = useMemo<FinishPayload | null>(() => {
    if (data) {
      try {
        return JSON.parse(decodeURIComponent(data));
      } catch {
        try { return JSON.parse(data); } catch { return null; }
      }
    }
    return lastFinishPayload ?? null;
  }, [data, lastFinishPayload]);

  const currency = payload?.currency || 'UZS';
  const grandTotal = payload?.grandTotal || 0;
  const participantTotals = payload?.totalsByParticipant || [];
  const allocations = payload?.allocations || [];
  const sessionName = payload?.sessionName || t('sessions.finish.default_name', 'Xarajat yakuni');

  // Assuming 'allocations' contains the share info.

  const handleShare = async () => {
    try {
      let text = `📊 ${sessionName} - Xarajatlar yakuni\n\n`;
      text += `💰 Jami summa: ${grandTotal.toLocaleString()} ${currency}\n\n`;
      text += `👥 To'lovlar rejasi:\n`;
      
      participantTotals.forEach(p => {
        const paidStr = paidAmounts[p.uniqueId] || p.amountOwed.toString();
        const paidNum = parseFloat(paidStr) || 0;
        const debt = p.amountOwed - paidNum;
        
        text += `• ${p.username}: ${p.amountOwed.toLocaleString()} ${currency}`;
        if (debt > 0) {
          text += ` (Qarz: ${debt.toLocaleString()} ${currency})`;
        } else {
          text += ` (To'landi ✅)`;
        }
        text += `\n`;
      });
      
      text += `\nSplitter ilovasi orqali hisoblandi. 📱`;
      
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleSendComment = async () => {
    if (!commentTarget || !commentText.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      const { itemName, participantId } = commentTarget;
      // 1. Create/Get Chat
      const chatRes = await api.post('/chats', { uniqueId: participantId });
      const chatId = chatRes.data.id;
      // 2. Send Message
      const msg = `📌 "${itemName}" bo'yicha eslatma:\n${commentText.trim()}`;
      await api.post(`/chats/${chatId}/messages`, { content: msg });
      
      setCommentTarget(null);
      setCommentText('');
    } catch (e) {
      console.error('Send comment failed:', e);
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <YStack f={1} bg="#F8F9FA">
      {/* Header with Blue Gradient */}
      <LinearGradient
        colors={['#007AFF', '#0055FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 40,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <XStack ai="center" jc="space-between" mb="$6">
          <Pressable onPress={() => router.push('/tabs')}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={18} fow="900">{t('sessions.finish.title', 'Natija')}</Text>
          <Pressable onPress={handleShare}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <Share2 size={24} color="white" />
            </YStack>
          </Pressable>
        </XStack>

        <YStack ai="center" gap="$2">
          <Circle size={64} bg="rgba(255,255,255,0.2)" ai="center" jc="center">
            <Check size={32} color="white" strokeWidth={3} />
          </Circle>
          <Text col="white" fos={24} fow="900" mt="$2">{sessionName}</Text>
          <XStack ai="baseline" gap="$2">
            <Text col="white" fos={36} fow="900">{grandTotal.toLocaleString()}</Text>
            <Text col="white" opacity={0.8} fos={16} fow="700">{currency}</Text>
          </XStack>
        </YStack>
      </LinearGradient>

      <ScrollView f={1} p="$5" showsVerticalScrollIndicator={false}>
        <YStack gap="$6" pb="$20">
          
          {/* Settlement Plan Section */}
          <YStack gap="$3">
            <Text fos={14} fow="800" col="$gray9" textTransform="uppercase" ml="$2">
               {t('sessions.finish.settlement', 'To\'lovlar rejasi')}
            </Text>
            <YStack bg="white" br={24} p="$5" gap="$4" shadowColor="#000" shadowOpacity={0.05} shadowRadius={15} elevation={5}>
              {participantTotals.map((p, i) => {
                const owed = p.amountOwed;
                const paidStr = paidAmounts[p.uniqueId] !== undefined ? paidAmounts[p.uniqueId] : owed.toString();
                const paidNum = parseFloat(paidStr) || 0;
                const debt = owed - paidNum;

                return (
                  <React.Fragment key={p.uniqueId}>
                    <YStack gap="$2">
                      <XStack ai="center" jc="space-between">
                        <XStack ai="center" gap="$3">
                          <UserAvatar label={p.username.slice(0, 1).toUpperCase()} size={40} />
                          <YStack>
                            <Text fos={16} fow="800" col="$gray12">{p.username}</Text>
                            <Text fos={12} col="$gray10" fow="600">@{p.uniqueId}</Text>
                          </YStack>
                        </XStack>
                        <YStack ai="flex-end">
                          <Text fos={16} fow="900" col="#007AFF">{owed.toLocaleString()} {currency}</Text>
                          <View bg="rgba(0,122,255,0.1)" px="$2" py="$0.5" br={6} mt="$1">
                            <Text fos={10} fow="800" col="#007AFF" textTransform="uppercase">Jami ulush</Text>
                          </View>
                        </YStack>
                      </XStack>

                      <XStack ai="center" jc="space-between" mt="$2" gap="$4">
                        <YStack f={1}>
                          <Text fos={11} fow="800" col="$gray9" mb="$1" textTransform="uppercase">To'ladi</Text>
                          <TextInput
                            value={paidStr}
                            onChangeText={(val) => setPaidAmounts(prev => ({ ...prev, [p.uniqueId]: val }))}
                            keyboardType="numeric"
                            style={{
                              backgroundColor: '#F1F5F9',
                              borderRadius: 12,
                              height: 44,
                              paddingHorizontal: 12,
                              fontSize: 15,
                              fontWeight: '700',
                              color: '#1E293B',
                            }}
                          />
                        </YStack>
                        <YStack ai="flex-end" jc="center" pt="$4">
                           <Text fos={11} fow="800" col={debt > 0 ? '$red10' : '$green10'} textTransform="uppercase">
                             {debt > 0 ? 'Qarz' : 'To\'landi'}
                           </Text>
                           <Text fos={15} fow="900" col={debt > 0 ? '$red10' : '$green10'}>
                             {Math.abs(debt).toLocaleString()} {currency}
                           </Text>
                        </YStack>
                      </XStack>
                    </YStack>
                    {i < participantTotals.length - 1 && <Separator borderColor="$gray3" my="$2" />}
                  </React.Fragment>
                );
              })}
            </YStack>
          </YStack>

          {/* Details Breakdown */}
          <YStack gap="$3">
            <Text fos={14} fow="800" col="$gray9" textTransform="uppercase" ml="$2">
               {t('sessions.finish.breakdown', 'Tafsilotlar')}
            </Text>
            {payload?.totalsByItem?.map((item) => (
              <YStack 
                key={item.itemId} 
                bg="white" 
                br={20} 
                p="$4" 
                gap="$3"
                shadowColor="#000" 
                shadowOpacity={0.03} 
                shadowRadius={10} 
                elevation={2}
              >
                <XStack jc="space-between">
                  <Text fow="800" fos={15} col="$gray12">{item.name}</Text>
                  <Text fow="800" fos={15} col="#007AFF">{item.total.toLocaleString()} {currency}</Text>
                </XStack>
                <XStack flexWrap="wrap" gap="$2">
                  {allocations.filter(a => a.itemId === item.itemId).map(alloc => (
                    <XStack key={alloc.participantId} ai="center" gap="$2">
                      <XStack bg="$gray2" px="$2" py="$1" br={8} ai="center" gap="$1.5">
                        <Circle size={14} bg="$gray4" />
                        <Text fos={11} fow="700" col="$gray10">
                          {alloc.participantId}: {alloc.shareAmount.toLocaleString()}
                        </Text>
                      </XStack>
                      <Pressable onPress={() => setCommentTarget({ itemId: item.itemId, itemName: item.name, participantId: alloc.participantId })}>
                        <YStack p="$1.5" br={8} bg="$gray2">
                          <MessageSquare size={12} color="#007AFF" />
                        </YStack>
                      </Pressable>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            ))}
          </YStack>

        </YStack>
      </ScrollView>

      {/* Footer Actions */}
      <YStack 
        bg="white" 
        p="$5" 
        pb={insets.bottom + 105} 
        borderTopLeftRadius={32} 
        borderTopRightRadius={32}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: -10 }}
        shadowOpacity={0.1}
        shadowRadius={20}
        elevation={20}
      >
        <XStack gap="$3">
          <Button
            f={1}
            onPress={() => router.push('/tabs')}
            bg="$gray2"
            h={56}
            br={16}
          >
            <Text col="$gray12" fos={16} fow="800">{t('common.close', 'Yopish')}</Text>
          </Button>
          <Button
            f={2}
            onPress={async () => {
              try {
                // Send notifications for debts
                for (const p of participantTotals) {
                  const paidStr = paidAmounts[p.uniqueId] || p.amountOwed.toString();
                  const paidNum = parseFloat(paidStr) || 0;
                  const debt = p.amountOwed - paidNum;

                  if (debt > 0) {
                    try {
                      // 1. Create/Get Chat
                      const chatRes = await api.post('/chats', { uniqueId: p.uniqueId });
                      const chatId = chatRes.data.id;
                      // 2. Send Message
                      const msg = `Salom! "${payload?.sessionName || 'Xarajat'}" bo'yicha sizda ${debt.toLocaleString()} ${currency} qarz qoldi. Iltimos, imkon bo'lganda o'tkazib yuboring. 😊`;
                      await api.post(`/chats/${chatId}/messages`, { content: msg });
                    } catch (chatErr) {
                      console.warn(`Failed to notify ${p.uniqueId}:`, chatErr);
                    }
                  }
                }

                await closeSession();
                router.replace('/tabs');
              } catch (e) {
                console.error('Confirm payment failed:', e);
              }
            }}
            disabled={finalizing}
            bg="#007AFF"
            h={56}
            br={16}
            icon={finalizing ? <Spinner color="white" /> : <Wallet size={20} color="white" />}
          >
            <Text col="white" fos={16} fow="800">
              {finalizing ? '' : t('sessions.finish.confirm_payment', 'To\'lovni tasdiqlash')}
            </Text>
          </Button>
        </XStack>
      </YStack>

      {/* Comment Sheet */}
      <Sheet
        modal
        open={!!commentTarget}
        onOpenChange={(open) => !open && setCommentTarget(null)}
        snapPoints={[40]}
        dismissOnSnapToBottom
        position={0}
        animation="bouncy"
      >
        <Sheet.Overlay bg="rgba(0,0,0,0.5)" />
        <Sheet.Frame p="$5" bg="white" borderTopLeftRadius={32} borderTopRightRadius={32}>
          <Sheet.Handle />
          <YStack gap="$4" mt="$2">
            <XStack jc="space-between" ai="center">
              <YStack>
                <Text fos={18} fow="900" col="$gray12">{commentTarget?.participantId} uchun eslatma</Text>
                <Text fos={13} col="$gray10" fow="600">{commentTarget?.itemName}</Text>
              </YStack>
              <Pressable onPress={() => setCommentTarget(null)}>
                <Circle size={32} bg="$gray2" ai="center" jc="center">
                  <Text fos={20} col="$gray9">×</Text>
                </Circle>
              </Pressable>
            </XStack>

            <TextInput
              autoFocus
              multiline
              placeholder="Eslatma matnini kiriting..."
              value={commentText}
              onChangeText={setCommentText}
              style={{
                backgroundColor: '#F8F9FA',
                borderRadius: 16,
                padding: 16,
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top',
                color: '#1E293B'
              }}
            />

            <Button
              onPress={handleSendComment}
              disabled={!commentText.trim() || sendingComment}
              bg="#007AFF"
              h={50}
              br={14}
              icon={sendingComment ? <Spinner color="white" /> : <Send size={18} color="white" />}
            >
              <Text col="white" fow="800">Yuborish</Text>
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
