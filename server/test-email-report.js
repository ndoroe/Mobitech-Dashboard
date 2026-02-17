#!/usr/bin/env node

/**
 * Test script to manually trigger email report
 * Usage: node test-email-report.js [HH:MM]
 * Example: node test-email-report.js 13:45
 */

require('dotenv').config();
const { checkAndSendReports } = require('./src/utils/emailScheduler');

console.log('🧪 Testing email report feature...\n');

// Get time from command line argument or use current time
let testTime = new Date();
if (process.argv[2]) {
  const [hours, minutes] = process.argv[2].split(':');
  testTime = new Date();
  testTime.setHours(parseInt(hours), parseInt(minutes), 0);
  console.log(`Testing with time: ${process.argv[2]}\n`);
}

// Run the check function
checkAndSendReports(testTime).then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
