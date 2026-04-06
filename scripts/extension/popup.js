// Signl Browser Mod - Popup Logic
// Communicates with content script to get JD and links to main app.

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('job-title');
  const analyseBtn = document.getElementById('analyse-btn');

  // Query the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getJD' }, (response) => {
      if (response && response.jd) {
        statusEl.innerText = 'LinkedIn / Indeed Job Detected';
        statusEl.style.color = '#10b981'; // Green
        
        analyseBtn.onclick = () => {
          const signlUrl = `http://localhost:3000/analyse?remote_jd=${encodeURIComponent(response.jd)}`;
          window.open(signlUrl, '_blank');
        };
      } else {
        statusEl.innerText = 'No Job Description Found.';
        analyseBtn.disabled = true;
        analyseBtn.style.opacity = '0.5';
      }
    });
  });
});
