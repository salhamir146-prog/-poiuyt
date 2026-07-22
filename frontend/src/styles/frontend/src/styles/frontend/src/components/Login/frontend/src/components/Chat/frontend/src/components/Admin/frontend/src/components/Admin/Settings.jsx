import React, { useState, useEffect } from 'react';
import GlassCard from '../Common/GlassCard';

const Settings = () => {
  const [settings, setSettings] = useState({
    robotName: 'آوای یقین',
    personality: 'مهربان و صمیمی',
    welcomeMessage: 'سلام! به آوای یقین خوش آمدید. چطور می‌توانم کمکتان کنم؟',
    primaryColor: '#C9A96E',
    secondaryColor: '#2D5A27',
    fontSize: 'medium',
    language: 'fa',
    autoSave: true,
    showReferences: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setMessage('✅ تنظیمات با موفقیت ذخیره شد');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ خطا در ذخیره تنظیمات');
    } finally {
      setIsSaving(false);
    }
  };

  const personalities = [
    'مهربان و صمیمی',
    'علمی و دقیق',
    'خطابی و تأثیرگذار',
    'ادبی و شاعرانه',
    'ساده و روان'
  ];

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold gold-text mb-6">تنظیمات ربات</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              نام ربات
            </label>
            <input
              type="text"
              value={settings.robotName}
              onChange={(e) => setSettings({...settings, robotName: e.target.value})}
              className="w-full px-4 py-2 glass text-white rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              شخصیت ربات
            </label>
            <select
              value={settings.personality}
              onChange={(e) => setSettings({...settings, personality: e.target.value})}
              className="w-full px-4 py-2 glass text-white rounded-xl focus:outline-none"
            >
              {personalities.map(p => (
                <option key={p} value={p} className="bg-gray-800">{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              پیام خوش‌آمدگویی
            </label>
            <textarea
              value={settings.welcomeMessage}
              onChange={(e) => setSettings({...settings, welcomeMessage: e.target.value})}
              rows="3"
              className="w-full px-4 py-2 glass text-white rounded-xl focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                رنگ اصلی
              </label>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                className="w-full h-12 glass rounded-xl cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                رنگ ثانویه
              </label>
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                className="w-full h-12 glass rounded-xl cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                className="w-4 h-4 accent-gold-500"
              />
              ذخیره خودکار
            </label>
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={settings.showReferences}
                onChange={(e) => setSettings({...settings, showReferences: e.target.checked})}
                className="w-4 h-4 accent-gold-500"
              />
              نمایش منابع
            </label>
          </div>

          {message && (
            <div className={`p-3 rounded-xl ${
              message.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 gold-gradient rounded-xl text-gray-900 font-bold transition hover:scale-105 disabled:opacity-50"
          >
            {isSaving ? 'در حال ذخیره...' : '💾 ذخیره تنظیمات'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Settings;
