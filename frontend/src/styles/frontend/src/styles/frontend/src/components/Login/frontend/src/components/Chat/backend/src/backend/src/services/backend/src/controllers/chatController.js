const Chat = require('../models/Chat');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'پیام نمی‌تواند خالی باشد' });
    }

    // پیدا کردن یا ایجاد چت
    let chat = await Chat.findOne({ 
      userId, 
      sessionId: sessionId || 'default',
      status: 'active'
    });

    if (!chat) {
      chat = new Chat({
        userId,
        sessionId: sessionId || uuidv4(),
        messages: [],
        metadata: {
          startedAt: new Date(),
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      });
    }

    // اضافه کردن پیام کاربر
    const userMessage = {
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    chat.messages.push(userMessage);

    // دریافت پاسخ از هوش مصنوعی
    const chatHistory = chat.messages.slice(-10);
    const aiResponse = await aiService.generateResponse(message, chatHistory);

    // اضافه کردن پاسخ AI
    const aiMessage = {
      text: aiResponse.text,
      sender: 'ai',
      timestamp: new Date(),
      references: aiResponse.references || [],
      metadata: aiResponse.metadata
    };
    chat.messages.push(aiMessage);
    chat.metadata.totalMessages = chat.messages.length;

    // ذخیره چت
    await chat.save();

    // به‌روزرسانی آمار کاربر
    await User.findByIdAndUpdate(userId, {
      $inc: { totalMessages: 1 },
      $set: { lastSeen: new Date() }
    });

    res.json({
      success: true,
      message: aiResponse.text,
      references: aiResponse.references,
      metadata: aiResponse.metadata,
      chatId: chat._id,
      sessionId: chat.sessionId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'خطا در پردازش پیام',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, page = 1, sessionId } = req.query;

    const query = { userId, status: 'active' };
    if (sessionId) query.sessionId = sessionId;

    const chat = await Chat.findOne(query)
      .sort({ 'messages.timestamp': -1 })
      .limit(parseInt(limit));

    if (!chat) {
      return res.json({ messages: [], total: 0 });
    }

    res.json({
      messages: chat.messages.slice(-parseInt(limit)),
      total: chat.messages.length,
      sessionId: chat.sessionId,
      chatId: chat._id
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'خطا در دریافت تاریخچه' });
  }
};

exports.clearChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;

    await Chat.findOneAndUpdate(
      { userId, sessionId: sessionId || 'default' },
      { $set: { messages: [], status: 'archived' } }
    );

    res.json({ success: true, message: 'چت با موفقیت پاک شد' });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ error: 'خطا در پاک کردن چت' });
  }
};
