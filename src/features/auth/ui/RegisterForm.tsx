import React, { useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Card } from '@/shared/ui/Card';
import ScreenFormContainer from '@/shared/ui/ScreenFormContainer';
import PasswordInput from '@/shared/ui/PasswordInput';
import { register as registerUser, RegisterRequest, getCurrentUser } from '../api';
import { saveToken } from '@/shared/lib/utils/token-storage';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { User, Mail, Lock } from '@tamagui/lucide-icons';

const schema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  uniqueId: z.string().min(3, 'Nickname must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterForm() {
  const { t } = useTranslation();
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', uniqueId: '', email: '', password: '' },
  });
  const setAuth = useAppStore((s) => s.setAuth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: RegisterRequest) => {
    try {
      setIsLoading(true);
      const res = await registerUser(values);
      await saveToken(res.token);

      let profile = res.user;
      try {
        profile = await getCurrentUser(res.token);
      } catch (fetchError) {
        console.warn('Registration profile refresh failed:', fetchError);
      }

      setAuth(res.token, profile);
      router.replace('/');
    } catch (error: any) {
      Alert.alert(
        t('common.error', 'Error'),
        error.message || t('auth.registerError', 'An error occurred during registration')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenFormContainer>
      <YStack space="$6" pt="$4">
        {/* Header */}
        <YStack alignItems="center" space="$3" pb="$4">
          <Text fontSize={32} fontWeight="900" color="$gray12" textAlign="center" letterSpacing={-0.5}>
            {t('auth.createAccount', 'Ro\'yxatdan o\'tish')}
          </Text>
          <Text fontSize={16} color="$gray10" textAlign="center" paddingHorizontal="$4" lineHeight={24}>
            {t('auth.createAccountDesc', 'Do\'stlaringiz bilan xarajatlarni oson bo\'lishing')}
          </Text>
        </YStack>

        {/* Form Card */}
        <YStack 
          backgroundColor="$background" 
          borderRadius={28}
          padding="$5"
          space="$5"
          shadowColor="#007AFF"
          shadowOffset={{ width: 0, height: 12 }}
          shadowOpacity={0.06}
          shadowRadius={30}
          elevation={12}
          borderWidth={1}
          borderColor="$gray3"
        >
            {/* Username */}
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, value } }) => (
                <XStack space="$3" alignItems="flex-start">
                  <YStack
                    width={48}
                    height={48}
                    backgroundColor="rgba(0, 122, 255, 0.1)"
                    borderRadius={24}
                    alignItems="center"
                    justifyContent="center"
                    marginTop="$4"
                  >
                    <User size={22} color="#007AFF" />
                  </YStack>
                  <YStack flex={1}>
                    <Input
                      label={t('auth.username', 'Username')}
                      placeholder={t('auth.usernamePlaceholder', 'Enter your username')}
                      value={value}
                      onChangeText={onChange}
                      error={errors.username?.message}
                      required
                    />
                  </YStack>
                </XStack>
              )}
            />

            {/* Nickname (uniqueId) */}
            <Controller
              control={control}
              name="uniqueId"
              render={({ field: { onChange, value } }) => (
                <XStack space="$3" alignItems="flex-start">
                  <YStack
                    width={48}
                    height={48}
                    backgroundColor="rgba(139, 92, 246, 0.1)"
                    borderRadius={24}
                    alignItems="center"
                    justifyContent="center"
                    marginTop="$4"
                  >
                    <Text fontSize={20} fontWeight="900" color="#8B5CF6">@</Text>
                  </YStack>
                  <YStack flex={1}>
                    <Input
                      label={t('auth.nickname', 'Nickname')}
                      placeholder={t('auth.nicknamePlaceholder', 'Unique nickname (e.g. john_doe)')}
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      error={errors.uniqueId?.message}
                      required
                    />
                  </YStack>
                </XStack>
              )}
            />

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <XStack space="$3" alignItems="flex-start">
                  <YStack
                    width={48}
                    height={48}
                    backgroundColor="rgba(0, 122, 255, 0.1)"
                    borderRadius={24}
                    alignItems="center"
                    justifyContent="center"
                    marginTop="$4"
                  >
                    <Mail size={22} color="#007AFF" />
                  </YStack>
                  <YStack flex={1}>
                    <Input
                      label={t('auth.email', 'Email')}
                      placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={errors.email?.message}
                      required
                    />
                  </YStack>
                </XStack>
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <XStack space="$3" alignItems="flex-start">
                  <YStack
                    width={48}
                    height={48}
                    backgroundColor="rgba(0, 122, 255, 0.1)"
                    borderRadius={24}
                    alignItems="center"
                    justifyContent="center"
                    marginTop="$4"
                  >
                    <Lock size={22} color="#007AFF" />
                  </YStack>
                  <YStack flex={1}>
                    <PasswordInput
                      label={t('auth.password', 'Password')}
                      placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                      value={value}
                      onChangeText={onChange}
                      error={errors.password?.message}
                      required
                    />
                  </YStack>
                </XStack>
              )}
            />

            {/* Submit */}
            <YStack mt="$2">
              <Button
                title={isLoading ? t('common.loading', 'Yuklanmoqda...') : t('auth.createAccount', 'Hisob yaratish')}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                backgroundColor="#007AFF"
                color="white"
                borderRadius={24}
                height={56}
                fontSize={18}
                fontWeight="700"
                shadowColor="#007AFF"
                shadowOffset={{ width: 0, height: 4 }}
                shadowOpacity={0.2}
                shadowRadius={8}
              />
            </YStack>
        </YStack>

        {/* Footer */}
        <YStack alignItems="center" space="$4" mt="$2">
          <XStack alignItems="center" space="$3">
            <YStack flex={1} height={1} backgroundColor="$gray5" />
            <Text fontSize={14} color="$gray9" fontWeight="500">
              {t('auth.haveAccount', 'Allaqachon hisobingiz bormi?')}
            </Text>
            <YStack flex={1} height={1} backgroundColor="$gray5" />
          </XStack>

          <Link href="/login" asChild>
            <Button 
              title={t('auth.signIn', 'Tizimga kirish')} 
              variant="outline" 
              borderColor="rgba(0, 122, 255, 0.3)"
              color="#007AFF"
              borderRadius={24}
              height={50}
              width="100%" 
            />
          </Link>
        </YStack>
      </YStack>
    </ScreenFormContainer>
  );
}
