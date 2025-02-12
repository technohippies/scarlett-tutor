import { useEffect } from 'react';
import { useWalletStatus, useWalletAddress, useAuthActions } from '../../auth/store/hooks';
import { House } from '@phosphor-icons/react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isWalletConnected = useWalletStatus();
  const address = useWalletAddress();
  const { checkWalletConnection } = useAuthActions();

  useEffect(() => {
    checkWalletConnection();
  }, [checkWalletConnection]);

  return (
    <div className="dark">
      <div className="min-h-screen flex flex-col bg-neutral-900 text-white">
        <header className="sticky top-0 z-50 w-full border-neutral-800 border-b bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <div className="flex items-center">
                <a className="flex items-center space-x-2" href="/">
                  <House className="w-5 h-5" />
                  <span className="font-bold">Far Anki</span>
                </a>
              </div>
              <div className="flex items-center">
                <button
                  onClick={checkWalletConnection}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:bg-blue-700 h-9 px-4 py-2"
                >
                  {isWalletConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
            {children}
          </div>
        </main>

        <div className="sticky bottom-0 left-0 right-0 p-4 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60 border-t border-neutral-800">
          <div className="container flex justify-center gap-4">
            {/* Footer buttons will be rendered here by child components */}
          </div>
        </div>
      </div>
    </div>
  );
} 