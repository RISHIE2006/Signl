// Signl Browser Mod - Content Script
// Extracts Job Description from LinkedIn and Indeed

console.log('Signl Browser Mod Active ⚡');

// This script will eventually add an overlay button to the UI
function extractJobDescription() {
  let jd = '';
  
  // LinkedIn selectors
  const liMain = document.querySelector('.jobs-description');
  const liDescription = document.querySelector('#job-details');
  
  // Indeed selectors
  const indeedDescription = document.querySelector('#jobDescriptionText');

  jd = liMain?.innerText || liDescription?.innerText || indeedDescription?.innerText || '';
  
  return jd.trim();
}

// Simple message listener for the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getJD') {
    const jd = extractJobDescription();
    sendResponse({ jd: jd });
  }
});
