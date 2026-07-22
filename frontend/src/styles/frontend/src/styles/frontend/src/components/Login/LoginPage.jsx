import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../Common/GlassCard';
import { validatePhone } from '../../utils/validators';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // اعتبارسنجی
    if (!validatePhone(phone)) {
      setError('شماره تلفن نامعتبر است');
      return;
    }
    if (name.trim().length < 2) {
      setError('نام باید حداقل ۲ کاراکتر باشد');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name })
      });

      const data = await response.json();
      if (response.ok) {
        login(data.token, data.user);
      } else {
        setError(data.message || 'خطا در ورود');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mosque-pattern-bg">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 gold-gradient shimmer rounded-full"></div>
            <img 
              src="/mosque-icon.svg" 
              alt="آوای یقین" 
              className="relative z-10 w-full h-full p-2"
            />
          </div>
          <h1 className="text-3xl font-bold gold-gradient">آوای یقین</h1>
          <p className="text-gray-400 mt-2">دستیار هوشمند پاسخ به سوالات دینی</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              نام و نام خانوادگی
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 glass text-white rounded-xl focus:outline-none focus:border-gold-500 transition"
              placeholder="مثال: علی محمدی"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              شماره تلفن
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 glass text-white rounded-xl focus:outline-none focus:border-gold-500 transition"
              placeholder="مثال: 09123456789"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 gold-gradient rounded-xl text-gray-900 font-bold text-lg transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                در حال ورود...
              </span>
            ) : 'ورود به آوای یقین'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          با ورود به سیستم، شما با{' '}
          <a href="#" className="text-gold-400 hover:underline">قوانین</a>
          {' '}ما موافقت می‌کنید
        </p>
      </GlassCard>
    </div>
  );
};

export default LoginPage;
