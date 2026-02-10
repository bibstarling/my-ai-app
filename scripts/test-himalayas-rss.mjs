/**
 * Quick test script for Himalayas RSS feed
 */

async function testHimalayasRSS() {
  try {
    console.log('Fetching Himalayas RSS feed...');
    const response = await fetch('https://himalayas.app/jobs/rss');
    
    if (!response.ok) {
      console.error('Failed to fetch:', response.status, response.statusText);
      return;
    }
    
    const text = await response.text();
    console.log('RSS Feed fetched successfully!');
    console.log('Content length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    
    // Count items
    const itemMatches = text.match(/<item>/g);
    console.log('Number of job items:', itemMatches ? itemMatches.length : 0);
    
    // Extract first job title
    const titleMatch = text.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    if (titleMatch && titleMatch[1]) {
      console.log('First job title:', titleMatch[1]);
    }
    
  } catch (error) {
    console.error('Error testing RSS:', error);
  }
}

testHimalayasRSS();
