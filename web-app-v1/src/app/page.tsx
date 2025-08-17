import AuthProvider from '../components/auth/AuthProvider';
import DataProvider from '../components/auth/DataProvider';
import LoginTriggerProvider from '../components/auth/LoginTriggerContext';
import AuthDebugInfo from '../components/auth/AuthDebugInfo';
import ChannelDiscovery from '../components/ChannelDiscovery';
import Header from '../components/Header';

export default function Home() {
  return (
    <AuthProvider>
      <DataProvider>
        <LoginTriggerProvider>
          <main className="min-h-screen bg-gray-50">
            <Header />

            {/* Auth Debug Info */}
            <div className="max-w-7xl mx-auto px-6 py-4">
              <AuthDebugInfo />
            </div>

            {/* Channel Discovery Component */}
            <ChannelDiscovery />
          </main>
        </LoginTriggerProvider>
      </DataProvider>
    </AuthProvider>
  );
}
