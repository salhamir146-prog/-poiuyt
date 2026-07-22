const aiService = require('../services/aiService');
require('dotenv').config();

async function testAI() {
  console.log('🧪 Testing AI Service Connection...');
  console.log(`🔑 API Key: ${process.env.AI_API_KEY ? '✅ Set' : '❌ Not Set'}`);
  
  if (!process.env.AI_API_KEY) {
    console.error('❌ AI_API_KEY is not set in environment variables');
    return;
  }

  console.log('📤 Sending test message...');
  
  try {
    const response = await aiService.generateResponse('سلام، شما کیستید؟ لطفاً معرفی کنید خودتان را');
    console.log('✅ Response received:');
    console.log('-'.repeat(50));
    console.log(response.text);
    console.log('-'.repeat(50));
    console.log('📚 References:', response.references);
    console.log('📊 Metadata:', response.metadata);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// اجرای تست
testAI();
