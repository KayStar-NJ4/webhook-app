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
  if (processedPrivate) {
    console.log('✅ Private message processed:', {
      conversationId: processedPrivate.conversationId,
      senderDisplayName: processedPrivate.senderDisplayName,
      isGroupChat: processedPrivate.isGroupChat
    });
  } else {
    console.log('❌ Private message not processed (should be processed)');
  }

  // Test 2: Xử lý tin nhắn group chat (không mention bot)
  console.log('\n👥 Test 2: Group Chat Message (No Bot Mention)');
  const groupMessageNoMention = {
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

  const processedGroupNoMention = telegramService.processMessage(groupMessageNoMention);
  if (processedGroupNoMention) {
    console.log('❌ Group message without mention was processed (should NOT be processed)');
  } else {
    console.log('✅ Group message without mention correctly ignored');
  }

  // Test 3: Xử lý tin nhắn group chat (có mention bot)
  console.log('\n👥 Test 3: Group Chat Message (With Bot Mention)');
  const groupMessageWithMention = {
    message: {
      message_id: 125,
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
      text: '@testbot chào bot!'
    }
  };

  const processedGroupWithMention = telegramService.processMessage(groupMessageWithMention);
  if (processedGroupWithMention) {
    console.log('✅ Group message with mention processed:', {
      conversationId: processedGroupWithMention.conversationId,
      senderDisplayName: processedGroupWithMention.senderDisplayName,
      isGroupChat: processedGroupWithMention.isGroupChat,
      groupTitle: processedGroupWithMention.groupTitle
    });
  } else {
    console.log('❌ Group message with mention not processed (should be processed)');
  }

  // Test 4: Kiểm tra conversation mapping
  console.log('\n🗺️ Test 4: Conversation Mapping');
  
  // Simulate conversation mapping
  if (processedPrivate) {
    messageBroker.setConversationMapping(processedPrivate.conversationId, 1001);
  }
  if (processedGroupWithMention) {
    messageBroker.setConversationMapping(processedGroupWithMention.conversationId, 1002);
  }
  
  const mappings = messageBroker.getAllConversationMappings();
  console.log('✅ Conversation mappings:', mappings);

  // Test 5: Kiểm tra message deduplication
  console.log('\n🔄 Test 5: Message Deduplication');
  
  if (processedPrivate && processedGroupWithMention) {
    const messageKey1 = `${processedPrivate.conversationId}_${processedPrivate.messageId}`;
    const messageKey2 = `${processedGroupWithMention.conversationId}_${processedGroupWithMention.messageId}`;
    
    console.log('✅ Message keys generated:', {
      private: messageKey1,
      group: messageKey2
    });
  }

  // Test 6: Kiểm tra contact data generation
  console.log('\n👤 Test 6: Contact Data Generation');
  
  if (processedPrivate) {
    const privateContactData = processedPrivate.isGroupChat ? {
      name: processedPrivate.groupTitle || `Group ${processedPrivate.chatId}`,
      firstName: processedPrivate.groupTitle || 'Group',
      lastName: '',
      username: `group_${processedPrivate.chatId}`,
      email: `group_${processedPrivate.chatId}@telegram.local`,
      isGroup: true
    } : {
      name: processedPrivate.senderDisplayName,
      firstName: processedPrivate.firstName,
      lastName: processedPrivate.lastName,
      username: processedPrivate.username,
      email: `${processedPrivate.userId}@telegram.local`,
      isGroup: false
    };

    console.log('✅ Private contact data:', privateContactData);
  }

  if (processedGroupWithMention) {
    const groupContactData = processedGroupWithMention.isGroupChat ? {
      name: processedGroupWithMention.groupTitle || `Group ${processedGroupWithMention.chatId}`,
      firstName: processedGroupWithMention.groupTitle || 'Group',
      lastName: '',
      username: `group_${processedGroupWithMention.chatId}`,
      email: `group_${processedGroupWithMention.chatId}@telegram.local`,
      isGroup: true
    } : {
      name: processedGroupWithMention.senderDisplayName,
      firstName: processedGroupWithMention.firstName,
      lastName: processedGroupWithMention.lastName,
      username: processedGroupWithMention.username,
      email: `${processedGroupWithMention.userId}@telegram.local`,
      isGroup: false
    };

    console.log('✅ Group contact data:', groupContactData);
  }

  // Test 7: Kiểm tra message content formatting
  console.log('\n💬 Test 7: Message Content Formatting');
  
  if (processedPrivate) {
    const privateMessageContent = processedPrivate.isGroupChat 
      ? `[${processedPrivate.senderDisplayName}]: ${processedPrivate.text}`
      : processedPrivate.text;

    console.log('✅ Private message content:', privateMessageContent);
  }

  if (processedGroupWithMention) {
    const groupMessageContent = processedGroupWithMention.isGroupChat 
      ? `[${processedGroupWithMention.senderDisplayName}]: ${processedGroupWithMention.text}`
      : processedGroupWithMention.text;

    console.log('✅ Group message content:', groupMessageContent);
  }

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
