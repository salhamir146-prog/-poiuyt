import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../Common/GlassCard';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useAuth } from '../../context/AuthContext';
import { sendMessage } from '../../utils/api';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    // بارگذاری تاریخچه چت
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history');
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await sendMessage(input);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        references: response.references || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'متاسفانه در ارتباط با سرور خطایی رخ داد. لطفاً مجدداً تلاش کنید.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col p-4">
      {/* هدر */}
      <GlassCard className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gold-gradient rounded-full flex items-center justify-center">
              <span className="text-xl">🕌</span>
            </div>
            <div>
              <h2 className="text-xl font-bold gold-text">آوای یقین</h2>
              <p className="text-xs text-gray-400">دستیار هوشمند دینی</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/admin'}
            className="px-4 py-2 glass rounded-xl text-sm hover:bg-white/10 transition"
          >
            ⚙️ پنل مدیریت
          </button>
        </div>
      </GlassCard>

      {/* فضای چت */}
      <GlassCard className="flex-1 p-4 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <div className="text-6xl mb-4">🕌</div>
              <p className="text-lg">به آوای یقین خوش آمدید</p>
              <p className="text-sm">سوالات دینی خود را مطرح کنید</p>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </GlassCard>

      {/* ورودی */}
      <GlassCard className="p-2">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="سوال خود را بپرسید..."
            className="flex-1 px-4 py-2 bg-transparent text-white rounded-xl focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 gold-gradient rounded-xl text-gray-900 font-bold transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? '...' : 'ارسال'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default ChatInterface;
