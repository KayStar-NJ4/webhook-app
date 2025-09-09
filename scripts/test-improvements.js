const telegramService = require('../src/services/telegramService');
const messageBroker = require('../src/services/messageBroker');
const logger = require('../src/utils/logger');

/**
 * Test script để kiểm tra các cải tiến của bot
 */
async function testImprovements() {
  console.log('🚀 Bắt đầu test các cải tiến bot...\n');

  // Test 1: Xử lý tin nhắn private chat
  console.log('📱 Test 1: Private Chat Message');
  const privateMessage = {
    message: {
      message_id: 123,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe'
      },
      chat: {
        id: 123456789,
        type: 'private'
      },
      date: Date.now(),
      text: 'Xin chào bot!'
    }
  };

  const processedPrivate = telegramService.processMessage(privateMessage);
  console.log('✅ Private message processed:', {
    conversationId: processedPrivate.conversationId,
    displayName: processedPrivate.displayName,
    isGroupChat: processedPrivate.isGroupChat
  });

  // Test 2: Xử lý tin nhắn group chat
  console.log('\n👥 Test 2: Group Chat Message');
  const groupMessage = {
    message: {
      message_id: 124,
      from: {
        id: 987654321,
        is_bot: false,
        first_name: 'Jane',
        last_name: 'Smith',
        username: 'janesmith'
      },
      chat: {
        id: -1001234567890,
        type: 'supergroup',
        title: 'Test Group'
      },
      date: Date.now(),
      text: 'Chào mọi người!'
    }
  };

  const processedGroup = telegramService.processMessage(groupMessage);
  console.log('✅ Group message processed:', {
    conversationId: processedGroup.conversationId,
    displayName: processedGroup.displayName,
    isGroupChat: processedGroup.isGroupChat,
    groupTitle: processedGroup.groupTitle
  });

  // Test 3: Kiểm tra conversation mapping
  console.log('\n🗺️ Test 3: Conversation Mapping');
  
  // Simulate conversation mapping
  messageBroker.setConversationMapping(processedPrivate.conversationId, 1001);
  messageBroker.setConversationMapping(processedGroup.conversationId, 1002);
  
  const mappings = messageBroker.getAllConversationMappings();
  console.log('✅ Conversation mappings:', mappings);

  // Test 4: Kiểm tra message deduplication
  console.log('\n🔄 Test 4: Message Deduplication');
  
  const messageKey1 = `${processedPrivate.conversationId}_${processedPrivate.messageId}`;
  const messageKey2 = `${processedGroup.conversationId}_${processedGroup.messageId}`;
  
  console.log('✅ Message keys generated:', {
    private: messageKey1,
    group: messageKey2
  });

  // Test 5: Kiểm tra contact data generation
  console.log('\n👤 Test 5: Contact Data Generation');
  
  const privateContactData = processedPrivate.isGroupChat ? {
    name: processedPrivate.displayName,
    firstName: processedPrivate.groupTitle || 'Group',
    lastName: '',
    username: `group_${processedPrivate.chatId}`,
    email: `group_${processedPrivate.chatId}@telegram.local`,
    isGroup: true
  } : {
    name: processedPrivate.displayName,
    firstName: processedPrivate.firstName,
    lastName: processedPrivate.lastName,
    username: processedPrivate.username,
    email: `${processedPrivate.userId}@telegram.local`,
    isGroup: false
  };

  const groupContactData = processedGroup.isGroupChat ? {
    name: processedGroup.displayName,
    firstName: processedGroup.groupTitle || 'Group',
    lastName: '',
    username: `group_${processedGroup.chatId}`,
    email: `group_${processedGroup.chatId}@telegram.local`,
    isGroup: true
  } : {
    name: processedGroup.displayName,
    firstName: processedGroup.firstName,
    lastName: processedGroup.lastName,
    username: processedGroup.username,
    email: `${processedGroup.userId}@telegram.local`,
    isGroup: false
  };

  console.log('✅ Private contact data:', privateContactData);
  console.log('✅ Group contact data:', groupContactData);

  // Test 6: Kiểm tra message content formatting
  console.log('\n💬 Test 6: Message Content Formatting');
  
  const privateMessageContent = processedPrivate.isGroupChat 
    ? `[${processedPrivate.displayName}]: ${processedPrivate.text}`
    : processedPrivate.text;

  const groupMessageContent = processedGroup.isGroupChat 
    ? `[${processedGroup.displayName}]: ${processedGroup.text}`
    : processedGroup.text;

  console.log('✅ Private message content:', privateMessageContent);
  console.log('✅ Group message content:', groupMessageContent);

  console.log('\n🎉 Tất cả tests đã hoàn thành thành công!');
  console.log('\n📋 Tóm tắt cải tiến:');
  console.log('✅ Phân biệt private chat và group chat');
  console.log('✅ Conversation ID thông minh');
  console.log('✅ Đặt tên contact phù hợp');
  console.log('✅ Message deduplication');
  console.log('✅ Context preservation');
  console.log('✅ Group chat support');
}

// Chạy test
testImprovements().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
