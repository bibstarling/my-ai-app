#!/usr/bin/env node

import { createClerkClient } from '@clerk/backend';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
} catch (error) {
  console.error('Error loading .env.local:', error);
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function checkUsers() {
  console.log('🔍 Fetching users from Clerk...\n');
  
  try {
    const response = await clerk.users.getUserList({ limit: 100 });
    const users = response.data;
    
    console.log(`Found ${users.length} user(s) in Clerk:\n`);
    
    users.forEach((user, index) => {
      const email = user.emailAddresses?.[0]?.emailAddress;
      const name = user.firstName || user.username || 'Unknown';
      const createdAt = new Date(user.createdAt).toLocaleString();
      
      console.log(`${index + 1}. ${name}`);
      console.log(`   Clerk ID: ${user.id}`);
      console.log(`   Email: ${email || 'No email'}`);
      console.log(`   Created: ${createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
