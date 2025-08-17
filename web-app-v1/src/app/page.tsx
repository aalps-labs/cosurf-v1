import DataProvider from '../components/auth/DataProvider';
import LoginTriggerProvider from '../components/auth/LoginTriggerContext';
import ChannelDiscovery from '../components/ChannelDiscovery';
import Header from '../components/Header';

export default function Home() {
  return (

    <AuthProvider>
      <DataProvider>
        <LoginTriggerProvider>
          <main className="h-screen bg-gray-50 overflow-hidden">
            <Header />
                      {/* Auth Debug Info */}
          <div className="max-w-7xl mx-auto px-6 py-4">
            <AuthDebugInfo />
          </div>
            <ChannelDiscovery />
          </main>
        </LoginTriggerProvider>
      </DataProvider>
    </AuthProvider>
  );
}
