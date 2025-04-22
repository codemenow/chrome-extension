// Initialize storage when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 
    urlCounts: {},
    blockedDomains: []
  });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isBlocked = await isUrlBlocked(tab.url);
    if (!isBlocked) {
      updateVisitCount(tab.url);
    }
  }
});

// Listen for tab switches
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const isBlocked = await isUrlBlocked(tab.url);
      if (!isBlocked) {
        updateBadgeCount(tab.url);
      }
    }
  } catch (error) {
    console.error('Error getting tab info:', error);
  }
});

// Function to check if URL should be blocked
async function isUrlBlocked(url) {
  // Block new tab
  if (url === 'chrome://newtab/') {
    return true;
  }
  
  // Get domain from URL
  try {
    const domain = new URL(url).hostname;
    const data = await chrome.storage.local.get('blockedDomains');
    return data.blockedDomains.includes(domain);
  } catch (e) {
    return false;
  }
}

// Function to update visit count for a URL
async function updateVisitCount(url) {
  try {
    // Get current counts from storage
    const data = await chrome.storage.local.get('urlCounts');
    const urlCounts = data.urlCounts || {};
    
    // Increment count for current URL
    urlCounts[url] = (urlCounts[url] || 0) + 1;
    
    // Save updated counts
    await chrome.storage.local.set({ urlCounts });
    
    // Update badge with current URL's count
    updateBadgeCount(url);
  } catch (error) {
    console.error('Error updating visit count:', error);
  }
}

// Function to update badge count for a URL
async function updateBadgeCount(url) {
  try {
    const data = await chrome.storage.local.get('urlCounts');
    const urlCounts = data.urlCounts || {};
    const count = urlCounts[url] || 0;
    
    // Update badge with current URL's count
    chrome.action.setBadgeText({
      text: count.toString()
    });
    
    // Set badge color
    chrome.action.setBadgeBackgroundColor({
      color: '#4CAF50'
    });
  } catch (error) {
    console.error('Error updating badge count:', error);
  }
}

// Function to get top visited sites
async function getTopVisitedSites(limit = 10) {
  try {
    const data = await chrome.storage.local.get('urlCounts');
    const urlCounts = data.urlCounts || {};
    
    // Convert to array and sort by count
    const sortedSites = Object.entries(urlCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
    
    return sortedSites;
  } catch (error) {
    console.error('Error getting top visited sites:', error);
    return [];
  }
} 