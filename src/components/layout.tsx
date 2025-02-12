import { useWalletStatus, useWalletAddress, useAuthActions, useIsDarkMode, useUIActions } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isWalletConnected = useWalletStatus();
  const address = useWalletAddress();
  const { connectWallet } = useAuthActions();
  const isDarkMode = useIsDarkMode();
  const { toggleDarkMode } = useUIActions();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <a className="mr-6 flex items-center space-x-2" href="/">
                <span className="font-bold">Far Anki</span>
              </a>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <nav className="flex items-center space-x-4">
                <button
                  onClick={() => toggleDarkMode()}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                {!isWalletConnected ? (
                  <button
                    onClick={() => connectWallet()}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                )}
              </nav>
            </div>
          </div>
        </header>

        <main className="container py-6 md:py-10">
          {children}
        </main>

        <footer className="border-t py-6 md:py-0">
          <div className="container flex h-14 items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Built with ❤️ by the Far Anki team
            </p>
            <nav className="flex items-center space-x-4">
              <a
                href="https://github.com/yourusername/far-anki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                GitHub
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
} 