import React, { useState } from 'react';
import { ButterflyChart } from './components/ButterflyChart';
import { PatrolRouteMap } from './components/PatrolRouteMap';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chart' | 'map'>('map');

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            巡检路线监控
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'chart'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            区域负载统计
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {activeTab === 'chart' ? (
            <div className="p-6 md:p-8">
              <div className="mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">区域负载情况统计</h1>
                <p className="text-gray-500 text-sm mt-1">
                  数据展示各区域的重载与过载台数对比
                </p>
              </div>
              <div className="w-full h-[500px]">
                <ButterflyChart />
              </div>
            </div>
          ) : (
            <div className="relative w-full h-[600px] md:h-[700px]">
              <PatrolRouteMap />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;