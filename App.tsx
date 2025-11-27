import React from 'react';
import { ButterflyChart } from './components/ButterflyChart';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 md:p-8">
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
    </div>
  );
};

export default App;