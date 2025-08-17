import DataProvider from '../components/auth/DataProvider';
import LoginTriggerProvider from '../components/auth/LoginTriggerContext';
import ChannelDiscovery from '../components/ChannelDiscovery';
import Header from '../components/Header';
import AuthProvider from '../components/auth/AuthProvider';
import AuthDebugInfo from '../components/auth/AuthDebugInfo';

export default function Home() {
  return (

    <AuthProvider>
      <DataProvider>
        <LoginTriggerProvider>
          <main className="h-screen bg-gray-50 overflow-hidden">
            <Header />
                      {/* Auth Debug Info */}
                      {/* <AuthDebugInfo />
          <div className="max-w-7xl mx-auto px-6 py-4">
            <AuthDebugInfo />
          </div> */}
            <ChannelDiscovery />
          </main>
        </LoginTriggerProvider>
      </DataProvider>
    </AuthProvider>
  );
}
