#!/usr/bin/env node
/**
 * Quick script to test if an OpenAI API key is valid
 * Usage: node scripts/test-openai-key.mjs sk-proj-...your-key...
 */

import OpenAI from 'openai';

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Usage: node scripts/test-openai-key.mjs <your-api-key>');
  console.error('\nExample: node scripts/test-openai-key.mjs sk-proj-abc123...');
  process.exit(1);
}

console.log('🔍 Testing OpenAI API key...');
console.log(`   Key prefix: ${apiKey.substring(0, 20)}...`);
console.log('');

const openai = new OpenAI({ apiKey });

try {
  console.log('⏳ Making test request to OpenAI...');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Hi' }],
  });
  
  console.log('');
  console.log('✅ SUCCESS! Your API key is valid!');
  console.log(`   Model: ${response.model}`);
  console.log(`   Response: ${response.choices[0]?.message?.content}`);
  console.log('');
  console.log('✨ Your key works! You can now use it in the app.');
  
} catch (error) {
  console.log('');
  console.error('❌ FAILED! API key test failed');
  console.error('');
  console.error('Error details:');
  console.error(`   Status: ${error.status || error.statusCode || 'N/A'}`);
  console.error(`   Code: ${error.code || 'N/A'}`);
  console.error(`   Message: ${error.message}`);
  console.error('');
  
  if (error.status === 401 || error.statusCode === 401) {
    console.error('🔴 DIAGNOSIS: Invalid API Key');
    console.error('');
    console.error('Possible causes:');
    console.error('  1. The API key is incorrect (typo, copy error)');
    console.error('  2. The API key was deleted or regenerated in OpenAI dashboard');
    console.error('  3. The API key doesn\'t have the right permissions');
    console.error('');
    console.error('Solutions:');
    console.error('  1. Go to: https://platform.openai.com/api-keys');
    console.error('  2. Create a NEW API key (or verify the existing one)');
    console.error('  3. Copy the entire key carefully');
    console.error('  4. Paste it in your app settings');
    
  } else if (error.status === 429 || error.statusCode === 429) {
    console.error('🟡 DIAGNOSIS: Rate Limit / Account Setup Required');
    console.error('');
    console.error('Your key is VALID, but OpenAI needs you to:');
    console.error('  1. Add payment method: https://platform.openai.com/settings/organization/billing');
    console.error('  2. Add credits ($5-10 minimum)');
    console.error('  3. Wait 5-10 minutes');
    console.error('  4. Try again');
    console.error('');
    console.error('Or switch to Groq (completely free, no payment needed):');
    console.error('  https://console.groq.com/keys');
    
  } else {
    console.error('🟠 DIAGNOSIS: Other Error');
    console.error('');
    console.error('Check the error message above for details.');
  }
  
  console.error('');
  process.exit(1);
}
