const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  references: [{
    title: String,
    source: String,
    url: String
  }],
  isError: {
    type: Boolean,
    default: false
  },
  metadata: {
    tokens: Number,
    processingTime: Number,
    model: String
  }
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [messageSchema],
  summary: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  metadata: {
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    totalMessages: { type: Number, default: 0 },
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ sessionId: 1, createdAt: -1 });

// Method to add message
chatSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.metadata.totalMessages += 1;
  return this.save();
};

// Method to get last messages
chatSchema.statics.getLastMessages = function(userId, limit = 50) {
  return this.findOne({ userId, status: 'active' })
    .sort({ 'messages.timestamp': -1 })
    .limit(limit);
};

module.exports = mongoose.model('Chat', chatSchema);
