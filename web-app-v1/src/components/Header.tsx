'use client';

import Link from 'next/link';
import LoginButton from './auth/LoginButton';

export default function Header() {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
          Channel Discovery
        </Link>
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
  );
}
