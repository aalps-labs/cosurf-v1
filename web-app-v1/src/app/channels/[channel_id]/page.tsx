'use client';

import { useParams } from 'next/navigation';
import DataProvider from '../../../components/auth/DataProvider';

export default function ChannelProfilePage() {
  const params = useParams();
  const channelId = params.channel_id as string;

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Layout Container - Single merged container */}
          <div className="bg-white rounded-lg shadow-md">
            
            {/* Main Content with Vertical Divider */}
            <div className="flex">
              
              {/* Main Dashboard Area - Left side */}
              <div className="flex-1">
                {/* Channel Name Header - Only spans main area */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {channelId}
                  </h1>
                </div>
                
                {/* Main Content */}
                <div className="p-6 min-h-96">
                  {/* Content will be added here */}
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="border-r border-gray-200"></div>

              {/* Right Side Panel */}
              <div className="w-80 p-6">
                
                {/* Channel Info Section */}
                <div className="pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Channel Info</h3>
                  <div className="text-sm text-gray-600">
                    Channel info content will go here
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div className="border-t border-gray-200 my-6"></div>

                {/* Actions Section */}
                <div className="pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
                  <div className="text-sm text-gray-600">
                    Action buttons will go here
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div className="border-t border-gray-200 my-6"></div>

                {/* Related Channels Section */}
                <div className="pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Related Channels</h3>
                  <div className="text-sm text-gray-600">
                    Related channels will go here
                  </div>
                </div>

                {/* Horizontal Divider */}
                <div className="border-t border-gray-200 my-6"></div>

                {/* Buffer Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Buffer</h3>
                  <div className="text-sm text-gray-600">
                    Buffer content will go here
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
