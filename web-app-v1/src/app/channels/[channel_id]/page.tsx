'use client';

import { useParams } from 'next/navigation';
import DataProvider from '../../../components/auth/DataProvider';

export default function ChannelProfilePage() {
  const params = useParams();
  const channelId = params.channel_id as string;

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Hello from Channel Profile Page!
            </h1>
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Channel Details
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-lg text-blue-800">
                    <strong>Channel ID:</strong> {channelId}
                  </p>
                </div>
                <p className="text-gray-600">
                  This is where the channel profile content will be displayed.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <h3 className="font-semibold text-gray-700 mb-2">Posts</h3>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <h3 className="font-semibold text-gray-700 mb-2">Followers</h3>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <h3 className="font-semibold text-gray-700 mb-2">Following</h3>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DataProvider>
  );
}
