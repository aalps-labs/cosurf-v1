import AuthProvider from '../components/auth/AuthProvider';
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
            <ChannelDiscovery />
          </main>
        </LoginTriggerProvider>
      </DataProvider>
    </AuthProvider>
  );
}
