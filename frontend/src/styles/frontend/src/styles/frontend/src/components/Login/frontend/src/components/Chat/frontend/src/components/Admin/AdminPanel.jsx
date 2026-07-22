import React, { useState, useEffect } from 'react';
import GlassCard from '../Common/GlassCard';
import Settings from './Settings';
import ChatHistory from './ChatHistory';
import UsersManager from './UsersManager';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: '📊 داشبورد', icon: '📊' },
    { id: 'settings', label: '⚙️ تنظیمات', icon: '⚙️' },
    { id: 'chats', label: '💬 تاریخچه چت', icon: '💬' },
    { id: 'users', label: '👥 کاربران', icon: '👥' },
  ];

  return (
    <div className="min-h-screen p-4 mosque-pattern-bg">
      <div className="max-w-7xl mx-auto">
        {/* هدر */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gold-gradient">پنل مدیریت آوای یقین</h1>
              <p className="text-gray-400 mt-1">مدیریت کامل ربات هوشمند دینی</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition"
            >
              خروج از پنل
            </button>
          </div>
        </GlassCard>

        {/* تب‌ها */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl transition ${
                activeTab === tab.id
                  ? 'glass-gold border-gold-500 text-gold-400'
                  : 'glass hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* محتوای تب‌ها */}
        <div className="min-h-[400px]">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard 
                title="کاربران کل" 
                value={stats.totalUsers || 0}
                icon="👥"
                color="blue"
              />
              <StatCard 
                title="پیام‌های امروز" 
                value={stats.todayMessages || 0}
                icon="💬"
                color="green"
              />
              <StatCard 
                title="میانگین پاسخ" 
                value={stats.avgResponseTime || '۰.۵ ثانیه'}
                icon="⚡"
                color="gold"
              />
              <StatCard 
                title="رضایت کاربران" 
                value={`${stats.satisfactionRate || ۹۵}%`}
                icon="⭐"
                color="purple"
              />
            </div>
          )}

          {activeTab === 'settings' && <Settings />}
          {activeTab === 'chats' && <ChatHistory />}
          {activeTab === 'users' && <UsersManager />}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'border-blue-500/30 bg-blue-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    gold: 'border-gold-500/30 bg-gold-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10'
  };

  return (
    <GlassCard className={`p-6 border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </GlassCard>
  );
};

export default AdminPanel;
