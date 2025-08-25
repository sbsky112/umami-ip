import { useApi } from '@/components/hooks';

export interface PublicTurnstileSettings {
  enabled: boolean;
  siteKey: string | null;
}

export function useTurnstileSettings() {
  const { get, useQuery } = useApi();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['public-turnstile-settings'],
    queryFn: () => get<PublicTurnstileSettings>('/public/settings/turnstile'),
  });

  return { settings: settings || { enabled: false, siteKey: null }, isLoading };
}

export default useTurnstileSettings;