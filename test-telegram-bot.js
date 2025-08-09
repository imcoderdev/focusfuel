#!/usr/bin/env node

/**
 * Local Telegram Bot Tester
 * This script simulates Telegram webhook messages to test your bot locally
 */

const fetch = require('node-fetch').default || require('node-fetch');

const LOCAL_API_URL = 'http://localhost:3000/api/telegram-webhook';

// Test Chat ID (you can use any number for testing)
const TEST_CHAT_ID = 1707155356;

// Simulate different types of Telegram messages
const testMessages = [
  {
    name: "Start Command",
    message: {
      update_id: 1,
      message: {
        message_id: 1,
        from: {
          id: TEST_CHAT_ID,
          is_bot: false,
          first_name: "TestParent",
          username: "testparent"
        },
        chat: {
          id: TEST_CHAT_ID,
          first_name: "TestParent",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/start"
      }
    }
  },
  {
    name: "Help Command",
    message: {
      update_id: 2,
      message: {
        message_id: 2,
        from: {
          id: TEST_CHAT_ID,
          is_bot: false,
          first_name: "TestParent",
          username: "testparent"
        },
        chat: {
          id: TEST_CHAT_ID,
          first_name: "TestParent",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "help"
      }
    }
  },
  {
    name: "Natural Question - Tasks",
    message: {
      update_id: 3,
      message: {
        message_id: 3,
        from: {
          id: TEST_CHAT_ID,
          is_bot: false,
          first_name: "TestParent",
          username: "testparent"
        },
        chat: {
          id: TEST_CHAT_ID,
          first_name: "TestParent",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "What tasks is my child working on today?"
      }
    }
  },
  {
    name: "Natural Question - Progress",
    message: {
      update_id: 4,
      message: {
        message_id: 4,
        from: {
          id: TEST_CHAT_ID,
          is_bot: false,
          first_name: "TestParent",
          username: "testparent"
        },
        chat: {
          id: TEST_CHAT_ID,
          first_name: "TestParent",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "How is my child doing with their studies this week?"
      }
    }
  },
  {
    name: "Natural Question - Study Habits",
    message: {
      update_id: 5,
      message: {
        message_id: 5,
        from: {
          id: TEST_CHAT_ID,
          is_bot: false,
          first_name: "TestParent",
          username: "testparent"
        },
        chat: {
          id: TEST_CHAT_ID,
          first_name: "TestParent",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "When does my child study best and how can I help them focus?"
      }
    }
  }
];

async function testTelegramBot() {
  console.log('🤖 Testing Telegram Bot Locally...\n');
  console.log('📡 API Endpoint:', LOCAL_API_URL);
  console.log('💬 Test Chat ID:', TEST_CHAT_ID);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (let i = 0; i < testMessages.length; i++) {
    const test = testMessages[i];
    
    console.log(`🧪 Test ${i + 1}: ${test.name}`);
    console.log(`📝 Message: "${test.message.message.text}"`);
    console.log('─'.repeat(80));

    try {
      const response = await fetch(LOCAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TelegramBotTester/1.0'
        },
        body: JSON.stringify(test.message)
      });

      const result = await response.json();
      
      console.log('✅ Status:', response.status);
      console.log('📤 Response:', JSON.stringify(result, null, 2));
      
      if (result.test_mode) {
        console.log('🎭 TEST MODE DETECTED');
        console.log('📨 Bot Response Preview:');
        console.log('─'.repeat(40));
        console.log(result.message_sent?.substring(0, 200) + '...');
        console.log('─'.repeat(40));
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    console.log('\n' + '━'.repeat(100) + '\n');
    
    // Wait 2 seconds between tests
    if (i < testMessages.length - 1) {
      console.log('⏳ Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('🎉 All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check the console output above for any errors');
  console.log('2. Verify the responses match expected behavior');
  console.log('3. Test with real Telegram bot by setting up webhook');
  console.log('4. Deploy to Vercel for production testing');
}

// Run the tests
testTelegramBot().catch(console.error);
