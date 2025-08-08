// Simple test script to verify enhanced emergency AI with conversation history
const https = require('https');
const http = require('http');

const makeRequest = (url, data) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: 'Failed to parse response', body });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const testEmergencyAI = async () => {
  const baseUrl = 'http://localhost:3001';
  const testEmail = 'test@example.com';
  
  console.log('🔧 Testing Enhanced Emergency AI with Conversation History\n');
  
  try {
    // Test 1: First emergency interaction
    console.log('📞 Test 1: First emergency call...');
    const data1 = await makeRequest(`${baseUrl}/api/emergency-final`, {
      userEmail: testEmail,
      issue: 'feeling overwhelmed with too many tasks'
    });
    
    console.log('✅ Response 1:', data1.aiResponse || data1.error);
    console.log('');
    
    // Wait a moment then make another call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Second emergency interaction (should reference first)
    console.log('📞 Test 2: Second emergency call (similar issue)...');
    const data2 = await makeRequest(`${baseUrl}/api/emergency-final`, {
      userEmail: testEmail,
      issue: 'still feeling overwhelmed, tried your suggestion but not working'
    });
    
    console.log('✅ Response 2 (with history context):', data2.aiResponse || data2.error);
    console.log('');
    
    // Wait a moment then make another call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Different issue
    console.log('📞 Test 3: Different issue...');
    const data3 = await makeRequest(`${baseUrl}/api/emergency-final`, {
      userEmail: testEmail,
      issue: 'noisy environment, can\'t concentrate'
    });
    
    console.log('✅ Response 3 (different issue):', data3.aiResponse || data3.error);
    console.log('');
    
    console.log('🎉 All tests completed! The AI should now provide contextual responses based on conversation history.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testEmergencyAI();
