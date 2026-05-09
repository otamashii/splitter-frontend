import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { YStack, XStack, Text, Button, ScrollView, Input, Circle, View } from 'tamagui';
import { ChevronLeft, Plus, Trash2, ReceiptText, Banknote, Users } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useReceiptSessionStore } from '@/features/receipt/model/receipt-session.store';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/shared/lib/stores/app-store';

type ManualItem = {
  id: string;
  name: string;
  price: string;
  quantity: string;
};

export default function ManualCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [sessionName, setSessionName] = useState('');
  const [items, setItems] = useState<ManualItem[]>([
    { id: Math.random().toString(), name: '', price: '', quantity: '1' }
  ]);

  const setStoreSessionName = useReceiptSessionStore(s => s.setSessionName);
  const setStoreItems = useReceiptSessionStore(s => s.setItems);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), name: '', price: '', quantity: '1' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ManualItem, value: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleNext = () => {
    const finalName = sessionName || t('sessions.manual.default_name', 'Manual Session');
    setStoreSessionName(finalName);
    
    const storeItems = items.map(item => ({
      id: item.id,
      name: item.name || t('sessions.manual.unnamed_item', 'Unnamed Item'),
      unitPrice: parseFloat(item.price) || 0,
      quantity: parseFloat(item.quantity) || 1,
      totalPrice: (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1),
      splitMode: (parseFloat(item.quantity) || 1) > 1 ? 'count' as const : 'equal' as const,
      assignedTo: [],
      perPersonCount: {}
    }));

    setStoreItems(storeItems);
    router.push('/tabs/sessions/participants');
  };

  const total = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1), 0);

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
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <XStack ai="center" jc="space-between">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">{t('sessions.manual.title', 'Qo\'lda kiritish')}</Text>
          <View width={40} />
        </XStack>

        <YStack mt="$6" gap="$4">
          <YStack gap="$2">
            <Text col="white" opacity={0.8} fos={12} fow="700" textTransform="uppercase">{t('sessions.manual.session_name', 'Xarajat nomi')}</Text>
            <Input
              placeholder={t('sessions.manual.session_name_placeholder', 'Masalan: Tushlik, Kechki ovqat')}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={sessionName}
              onChangeText={setSessionName}
              bg="rgba(255,255,255,0.15)"
              borderWidth={0}
              col="white"
              fos={18}
              fow="700"
              h={56}
              br={16}
              px="$4"
            />
          </YStack>
        </YStack>
      </LinearGradient>

      <ScrollView f={1} p="$5" showsVerticalScrollIndicator={false}>
        <XStack jc="space-between" ai="center" mb="$4">
          <Text fos={18} fow="800" col={isDark ? 'white' : '#1E293B'}>{t('sessions.manual.items', 'Mahsulotlar')}</Text>
          <Text fos={14} fow="600" col="$gray10">{items.length} {t('sessions.manual.items_count', 'ta')}</Text>
        </XStack>

        <YStack gap="$4" pb="$10">
          {items.map((item, index) => (
            <YStack 
              key={item.id}
              bg={isDark ? '#1C1C1E' : 'white'} 
              br={24} 
              p="$4" 
              gap="$4"
              shadowColor="#007AFF"
              shadowOffset={{ width: 0, height: 8 }}
              shadowOpacity={isDark ? 0.3 : 0.06}
              shadowRadius={20}
              elevation={8}
              borderWidth={1}
              borderColor={isDark ? '#2C2C2E' : '$gray3'}
            >
              <XStack jc="space-between" ai="center">
                <Circle size={32} bg="rgba(0,122,255,0.1)" ai="center" jc="center">
                  <Text col="#007AFF" fow="800">{index + 1}</Text>
                </Circle>
                <Pressable onPress={() => removeItem(item.id)}>
                   <Trash2 size={20} color={items.length > 1 ? "#FF3B30" : "$gray5"} />
                </Pressable>
              </XStack>

              <YStack gap="$1.5">
                <Text fos={12} fow="700" col="$gray9" ml="$1">{t('sessions.manual.item_name', 'Nomi')}</Text>
                <Input
                  placeholder={t('sessions.manual.item_name_placeholder', 'Pizza, Burger...')}
                  placeholderTextColor="$gray8"
                  value={item.name}
                  onChangeText={(v) => updateItem(item.id, 'name', v)}
                  bg={isDark ? '#2C2C2E' : '$gray2'}
                  borderWidth={0}
                  h={48}
                  br={12}
                  col={isDark ? 'white' : '#1E293B'}
                />
              </YStack>

              <XStack gap="$4">
                <YStack f={2} gap="$1.5">
                  <Text fos={12} fow="700" col="$gray9" ml="$1">{t('sessions.manual.item_price', 'Narxi')}</Text>
                  <XStack ai="center" bg={isDark ? '#2C2C2E' : '$gray2'} br={12} h={48} px="$3">
                    <Banknote size={18} color="$gray10" />
                    <Input
                      f={1}
                      placeholder="0"
                      placeholderTextColor="$gray8"
                      keyboardType="numeric"
                      value={item.price}
                      onChangeText={(v) => updateItem(item.id, 'price', v)}
                      bg="transparent"
                      borderWidth={0}
                      col={isDark ? 'white' : '#1E293B'}
                    />
                  </XStack>
                </YStack>
                <YStack f={1} gap="$1.5">
                  <Text fos={12} fow="700" col="$gray9" ml="$1">{t('sessions.manual.item_quantity', 'Soni')}</Text>
                  <Input
                    placeholder="1"
                    placeholderTextColor="$gray8"
                    keyboardType="numeric"
                    value={item.quantity}
                    onChangeText={(v) => updateItem(item.id, 'quantity', v)}
                    bg={isDark ? '#2C2C2E' : '$gray2'}
                    borderWidth={0}
                    h={48}
                    br={12}
                    ta="center"
                    col={isDark ? 'white' : '#1E293B'}
                  />
                </YStack>
              </XStack>
            </YStack>
          ))}

          <Button
            onPress={addItem}
            bg="rgba(0,122,255,0.05)"
            borderColor="#007AFF"
            borderWidth={2}
            borderStyle="dashed"
            h={60}
            br={20}
            icon={<Plus color="#007AFF" size={24} />}
          >
            <Text col="#007AFF" fow="800">{t('sessions.manual.add_item', 'Mahsulot qo\'shish')}</Text>
          </Button>
        </YStack>
      </ScrollView>

      {/* Footer Summary */}
      <YStack 
        bg={isDark ? '#1C1C1E' : 'white'} 
        p="$5" 
        pb={insets.bottom + 20} 
        borderTopLeftRadius={32} 
        borderTopRightRadius={32}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: -10 }}
        shadowOpacity={isDark ? 0.3 : 0.1}
        shadowRadius={20}
        elevation={20}
      >
        <XStack jc="space-between" ai="center" mb="$4">
          <Text fos={16} fow="700" col="$gray10">{t('sessions.manual.total', 'Jami summa:')}</Text>
          <XStack ai="baseline" gap="$1">
            <Text fos={24} fow="900" col="#007AFF">{total.toLocaleString()}</Text>
            <Text fos={14} fow="700" col="#007AFF">UZS</Text>
          </XStack>
        </XStack>
        <Button
          onPress={handleNext}
          bg="#007AFF"
          h={56}
          br={16}
          shadowColor="#007AFF"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.2}
          shadowRadius={8}
          pressStyle={{ scale: 0.98 }}
        >
          <Text col="white" fos={18} fow="800">{t('common.next', 'Davom etish')}</Text>
        </Button>
      </YStack>
    </YStack>
  );
}


