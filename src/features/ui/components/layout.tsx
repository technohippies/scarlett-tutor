import { useEffect } from 'react';
import { useAuthActions } from '../../auth/store/hooks';
import { PWABanner } from './pwa-banner';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { checkWalletConnection } = useAuthActions();

  useEffect(() => {
    console.log('[Layout] Mounting');
    checkWalletConnection();
  }, [checkWalletConnection]);

  return (
    <div className="dark">
      <div className="min-h-screen flex flex-col bg-neutral-900 text-white">
        <PWABanner />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 