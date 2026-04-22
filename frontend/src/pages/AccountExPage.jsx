import { useState } from 'react';
import { Database, Zap } from 'lucide-react';
import BrandAccPage from './BrandAccPage';
import ComExPage from './ComExPage';

export default function AccountExPage() {
  const [activeTab, setActiveTab] = useState('brand-acc');

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm ring-1 ring-slate-900/5">
        <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            {activeTab === 'brand-acc' ? <Database className="text-indigo-600" /> : <Zap className="text-indigo-600" />}
            ผังบัญชีและEX code
        </h1>
        {/* Toggle Switch */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('brand-acc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${
              activeTab === 'brand-acc'
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database size={16} />
            Brand Account
          </button>
          <button
            onClick={() => setActiveTab('com-ex')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${
              activeTab === 'com-ex'
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Zap size={16} />
            Express Code
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'brand-acc' ? <BrandAccPage /> : <ComExPage />}
      </div>
    </div>
  );
}
