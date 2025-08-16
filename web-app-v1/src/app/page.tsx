import AuthProvider from '../components/auth/AuthProvider';
import DataProvider from '../components/auth/DataProvider';
import LoginButton from '../components/auth/LoginButton';
import AuthDebugInfo from '../components/auth/AuthDebugInfo';
import ChannelDiscovery from '../components/ChannelDiscovery';
import Link from 'next/link';

export default function Home() {
  return (
    <AuthProvider>
      <DataProvider>
        <main className="min-h-screen bg-gray-50">
          {/* Simple header with login - non-intrusive */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Channel Discovery
              </h1>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/channels/example-channel-123"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                  View Channel Profile
                </Link>
                <LoginButton />
              </div>
            </div>
          </div>

          {/* Auth Debug Info */}
          <div className="max-w-7xl mx-auto px-6 py-4">
            <AuthDebugInfo />
          </div>

          {/* Channel Discovery Component */}
          <ChannelDiscovery />
        </main>
      </DataProvider>
    </AuthProvider>
  );
}
