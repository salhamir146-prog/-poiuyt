const axios = require('axios');
const { Settings } = require('../models/Settings');

class AIService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY;
    this.baseURL = process.env.AI_API_URL || 'https://api.openai.com/v1';
    this.model = process.env.AI_MODEL || 'gpt-4';
  }

  async getSettings() {
    const settings = await Settings.findOne();
    return settings || {
      robotName: 'آوای یقین',
      personality: 'مهربان و صمیمی',
      welcomeMessage: 'سلام! به آوای یقین خوش آمدید.'
    };
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
      ...chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: userMessage }
    ];

    try {
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

      const aiResponse = response.data.choices[0].message.content;
      
      // استخراج منابع از پاسخ
      const references = this.extractReferences(aiResponse);

      return {
        text: aiResponse,
        references,
        metadata: {
          tokens: response.data.usage.total_tokens,
          model: this.model,
          processingTime: response.headers['x-response-time'] || 0
        }
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('خطا در ارتباط با سرویس هوش مصنوعی');
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
        title: `${match[1]} - آیه ${match[2]}`
      });
    }

    // الگوی تشخیص احادیث
    const hadithPattern = /(?:پیامبر|رسول|حدیث|روایت)\s*([^،.]+)/gi;
    while ((match = hadithPattern.exec(text)) !== null) {
      references.push({
        type: 'hadith',
        text: match[1].trim(),
        title: 'حدیث شریف'
      });
    }

    return references;
  }

  async getWelcomeMessage() {
    const settings = await this.getSettings();
    return settings.welcomeMessage;
  }
}

module.exports = new AIService();
