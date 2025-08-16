import PaymentInterface from '../components/PaymentInterface';
import AuthProvider from '../components/auth/AuthProvider';
import LoginButton from '../components/auth/LoginButton';

export default function Home() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-gray-50">
        {/* Simple header with login - non-intrusive */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              x402 Payment Demo
            </h1>
            <LoginButton />
          </div>
        </div>

        {/* Existing payment interface - unchanged */}
        <PaymentInterface />
      </main>
    </AuthProvider>
  );
}
