import AuthProvider from '../components/auth/AuthProvider';
import LoginButton from '../components/auth/LoginButton';
import AuthDebugInfo from '../components/auth/AuthDebugInfo';
import ChannelDiscovery from '../components/ChannelDiscovery';

export default function Home() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-gray-50">
        {/* Simple header with login - non-intrusive */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Channel Discovery
            </h1>
            <LoginButton />
          </div>
        </div>

        {/* Auth Debug Info */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <AuthDebugInfo />
        </div>

        {/* Channel Discovery Component */}
        <ChannelDiscovery />
      </main>
    </AuthProvider>
  );
}
