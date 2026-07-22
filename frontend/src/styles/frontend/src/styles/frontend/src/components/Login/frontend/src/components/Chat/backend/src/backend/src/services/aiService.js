const axios = require('axios');
const { Settings } = require('../models/Settings');

class AIService {
  constructor() {
    // استفاده از کلید API از محیط
    this.apiKey = process.env.AI_API_KEY;
    this.baseURL = process.env.AI_API_URL || 'https://api.openai.com/v1';
    this.model = process.env.AI_MODEL || 'gpt-4';
    
    // لاگ برای اطمینان از وجود کلید (فقط در محیط توسعه)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 AI API Key configured:', this.apiKey ? '✅ Yes' : '❌ No');
    }
  }

  async getSettings() {
    try {
      const settings = await Settings.findOne();
      return settings || {
        robotName: 'آوای یقین',
        personality: 'مهربان و صمیمی',
        welcomeMessage: 'سلام! به آوای یقین خوش آمدید. چطور می‌توانم کمکتان کنم؟'
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        robotName: 'آوای یقین',
        personality: 'مهربان و صمیمی',
        welcomeMessage: 'سلام! به آوای یقین خوش آمدید.'
      };
    }
  }

  async generateResponse(userMessage, chatHistory = []) {
    const settings = await this.getSettings();
    
    const systemPrompt = `شما ${settings.robotName} هستید، یک دستیار هوشمند پاسخ به سوالات دینی.

شخصیت شما: ${settings.personality}

قوانین پاسخ‌دهی:
۱. تمام پاسخ‌ها باید بر اساس قرآن کریم و احادیث معتبر باشد.
۲. لحن پاسخ‌ها گرم، صمیمی و محترمانه باشد.
۳. در صورت امکان، به آیات و روایات استناد کنید.
۴. پاسخ‌ها باید مختصر، مفید و قابل فهم باشد.
۵. در صورت ندانستن پاسخ، صادقانه بگویید و پیشنهاد مراجعه به منابع معتبر دهید.
۶. از پاسخ‌های کلی و بدون منبع خودداری کنید.
۷. به سوالات با دقت و ظرافت پاسخ دهید.

شما در حال پاسخ به یک کاربر مسلمان هستید که به دنبال راهنمایی دینی است.
لطفاً با احترام و مهربانی پاسخ دهید.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: userMessage }
    ];

    try {
      // بررسی وجود کلید API
      if (!this.apiKey) {
        throw new Error('AI_API_KEY not configured in environment variables');
      }

      console.log('📤 Sending request to AI API...');
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ AI response received successfully');

      const aiResponse = response.data.choices[0].message.content;
      
      // استخراج منابع از پاسخ
      const references = this.extractReferences(aiResponse);

      return {
        text: aiResponse,
        references,
        metadata: {
          tokens: response.data.usage?.total_tokens || 0,
          model: this.model,
          processingTime: response.headers['x-response-time'] || 0
        }
      };
    } catch (error) {
      console.error('❌ AI Service Error:', error.message);
      
      // خطاهای خاص API
      if (error.response) {
        console.error('API Response Error:', error.response.data);
        if (error.response.status === 401) {
          throw new Error('کلید API نامعتبر است. لطفاً کلید را بررسی کنید.');
        } else if (error.response.status === 429) {
          throw new Error('محدودیت درخواست API. لطفاً چند لحظه بعد تلاش کنید.');
        } else if (error.response.status === 500) {
          throw new Error('خطا در سرور هوش مصنوعی. لطفاً بعداً تلاش کنید.');
        }
      }
      
      throw new Error(`خطا در ارتباط با سرویس هوش مصنوعی: ${error.message}`);
    }
  }

  extractReferences(text) {
    const references = [];
    
    // الگوی تشخیص آیات
    const ayahPattern = /سوره\s*([^\s]+)\s*آیه\s*(\d+)/gi;
    let match;
    while ((match = ayahPattern.exec(text)) !== null) {
      references.push({
        type: 'ayah',
        surah: match[1],
        ayah: match[2],
        title: `${match[1]} - آیه ${match[2]}`,
        source: 'قرآن کریم'
      });
    }

    // الگوی تشخیص احادیث
    const hadithPattern = /(?:پیامبر|رسول|حدیث|روایت)\s*([^،.]+)/gi;
    while ((match = hadithPattern.exec(text)) !== null) {
      references.push({
        type: 'hadith',
        text: match[1].trim(),
        title: 'حدیث شریف',
        source: 'احادیث معتبر'
      });
    }

    return references;
  }

  async getWelcomeMessage() {
    const settings = await this.getSettings();
    return settings.welcomeMessage;
  }

  // تست اتصال به API
  async testConnection() {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
  }
}

module.exports = new AIService();
