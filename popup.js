// Color theme handling
function initializeColorTheme() {
  chrome.storage.local.get(['colorTheme', 'darkTheme'], ({ colorTheme, darkTheme }) => {
    // Set default value if not set
    if (!colorTheme) {
      colorTheme = 'cotton-candy';
      chrome.storage.local.set({ colorTheme });
    }

    // Apply saved theme
    document.documentElement.setAttribute('data-theme', darkTheme ? 'dark' : colorTheme);
    document.getElementById('colorThemeSelect').value = colorTheme;
  });
}

// Color theme change handler
document.getElementById('colorThemeSelect').addEventListener('change', async (e) => {
  const colorTheme = e.target.value;
  const { darkTheme } = await chrome.storage.local.get('darkTheme');
  document.documentElement.setAttribute('data-theme', darkTheme ? 'dark' : colorTheme);
  await chrome.storage.local.set({ colorTheme });
});

// Initialize color theme on popup open
initializeColorTheme();

// Font settings handling
function initializeFontSettings() {
  chrome.storage.local.get(['fontFamily', 'fontSize'], ({ fontFamily, fontSize }) => {
    // Set default values if not set
    if (!fontFamily) {
      fontFamily = 'Inter';
      chrome.storage.local.set({ fontFamily });
    }
    if (!fontSize) {
      fontSize = '14px';
      chrome.storage.local.set({ fontSize });
    }

    // Apply saved settings
    document.documentElement.style.setProperty('--font-family', `'${fontFamily}', sans-serif`);
    document.documentElement.style.setProperty('--font-size', fontSize);

    // Update select elements
    document.getElementById('fontSelect').value = fontFamily;
    document.getElementById('fontSizeSelect').value = fontSize;
  });
}

// Font family change handler
document.getElementById('fontSelect').addEventListener('change', async (e) => {
  const fontFamily = e.target.value;
  document.documentElement.style.setProperty('--font-family', `'${fontFamily}', sans-serif`);
  await chrome.storage.local.set({ fontFamily });
});

// Font size change handler
document.getElementById('fontSizeSelect').addEventListener('change', async (e) => {
  const fontSize = e.target.value;
  document.documentElement.style.setProperty('--font-size', fontSize);
  await chrome.storage.local.set({ fontSize });
});

// Initialize font settings on popup open
initializeFontSettings();

// Theme handling
function initializeTheme() {
  chrome.storage.local.get(['darkTheme', 'colorTheme'], ({ darkTheme, colorTheme }) => {
    if (darkTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('themeIcon').textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', colorTheme || 'cotton-candy');
      document.getElementById('themeIcon').textContent = '☀️';
    }
  });
}

// Theme toggle handler
document.getElementById('themeToggle').addEventListener('click', async () => {
  const { darkTheme, colorTheme } = await chrome.storage.local.get(['darkTheme', 'colorTheme']);
  const newDarkTheme = !darkTheme;
  document.documentElement.setAttribute('data-theme', newDarkTheme ? 'dark' : (colorTheme || 'cotton-candy'));
  document.getElementById('themeIcon').textContent = newDarkTheme ? '🌙' : '☀️';
  await chrome.storage.local.set({ darkTheme: newDarkTheme });
});

// Initialize theme on popup open
initializeTheme();

// Function to check if URL is a YouTube video
function isYouTubeVideo(url) {
  try {
    const urlObj = new URL(url);
    return (
      (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') &&
      urlObj.pathname === '/watch' &&
      urlObj.searchParams.has('v')
    );
  } catch (e) {
    return false;
  }
}

// Tab switching functionality
function switchToTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabId).classList.add('active');
  document.getElementById(tabId + 'Btn').classList.add('active');
  
  // If switching to settings tab, update the blocked domains list
  if (tabId === 'settingsTab') {
    updateBlockedDomainsList();
  }
}

// Add click handlers for tab buttons
document.getElementById('mainTabBtn').addEventListener('click', () => {
  switchToTab('mainTab');
});

document.getElementById('settingsTabBtn').addEventListener('click', () => {
  switchToTab('settingsTab');
});

// Settings icon click handler
document.getElementById('settingsIcon').addEventListener('click', () => {
  switchToTab('settingsTab');
});

// Get current tab's URL and update popup
chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
  const currentUrl = tabs[0].url;
  document.getElementById('currentUrl').textContent = currentUrl;
  
  try {
    // Get visit count for current URL
    const data = await chrome.storage.local.get('urlCounts');
    const urlCounts = data.urlCounts || {};
    const count = urlCounts[currentUrl] || 0;
    
    // Update popup with visit count
    document.getElementById('visitCount').textContent = count;
    
    // Handle YouTube video URLs
    const youtubeContainer = document.getElementById('youtubeContainer');
    if (isYouTubeVideo(currentUrl)) {
      document.getElementById('youtubeCount').textContent = count;
      youtubeContainer.classList.add('active');
      // Hide the regular count display
      document.getElementById('visitCount').style.display = 'none';
      document.querySelector('.label').style.display = 'none';
    } else {
      youtubeContainer.classList.remove('active');
      document.getElementById('visitCount').style.display = 'block';
      document.querySelector('.label').style.display = 'block';
    }
    
    // Get and display current domain
    try {
      const domain = new URL(currentUrl).hostname;
      document.getElementById('currentDomain').textContent = domain;
      
      // Check if domain is blocked
      const blockedData = await chrome.storage.local.get('blockedDomains');
      const isBlocked = blockedData.blockedDomains.includes(domain);
      
      const blockButton = document.getElementById('blockDomainBtn');
      if (isBlocked) {
        blockButton.textContent = 'Tracking enabled for this domain';
        blockButton.style.backgroundColor = '#4CAF50';
        blockButton.onclick = () => unblockDomain(domain);
      } else {
        blockButton.textContent = 'Do not track this domain';
        blockButton.style.backgroundColor = '#ff4444';
        blockButton.onclick = () => blockDomain(domain);
      }
    } catch (e) {
      document.getElementById('blockDomainContainer').style.display = 'none';
    }
    
    // Get and display top visited sites
    const topSites = await getTopVisitedSites();
    const tbody = document.getElementById('topSitesBody');
    tbody.innerHTML = '';
    
    topSites.forEach(([url, count]) => {
      const row = document.createElement('tr');
      const urlCell = document.createElement('td');
      const countCell = document.createElement('td');
      
      // Create clickable link
      const link = document.createElement('a');
      link.href = url;
      link.textContent = url;
      link.title = url; // Show full URL on hover
      
      // Add click handler to open in new tab
      link.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: link.href });
      });
      
      urlCell.appendChild(link);
      countCell.textContent = count;
      
      row.appendChild(urlCell);
      row.appendChild(countCell);
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error updating popup:', error);
  }
});

// Function to update blocked domains list
async function updateBlockedDomainsList() {
  const blockedDomainsList = document.getElementById('blockedDomainsList');
  blockedDomainsList.innerHTML = '';
  
  try {
    const data = await chrome.storage.local.get('blockedDomains');
    const blockedDomains = data.blockedDomains || [];
    
    blockedDomains.forEach(domain => {
      const domainItem = document.createElement('div');
      domainItem.className = 'blocked-domain-item';
      
      const domainText = document.createElement('span');
      domainText.textContent = domain;
      
      const actions = document.createElement('div');
      actions.className = 'domain-actions';
      
      const editButton = document.createElement('button');
      editButton.innerHTML = '&#9998;'; // Pencil edit icon
      editButton.title = 'Edit domain';
      editButton.onclick = () => editDomain(domain);
      
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '&#128465;'; // Delete bin icon
      deleteButton.title = 'Delete domain';
      deleteButton.onclick = () => deleteDomain(domain);
      
      actions.appendChild(editButton);
      actions.appendChild(deleteButton);
      
      domainItem.appendChild(domainText);
      domainItem.appendChild(actions);
      blockedDomainsList.appendChild(domainItem);
    });
  } catch (error) {
    console.error('Error updating blocked domains list:', error);
  }
}

// Function to edit domain
async function editDomain(oldDomain) {
  const newDomain = prompt('Enter new domain:', oldDomain);
  if (newDomain && newDomain !== oldDomain) {
    try {
      const data = await chrome.storage.local.get('blockedDomains');
      const blockedDomains = data.blockedDomains || [];
      const index = blockedDomains.indexOf(oldDomain);
      
      if (index > -1) {
        blockedDomains[index] = newDomain;
        await chrome.storage.local.set({ blockedDomains });
        updateBlockedDomainsList();
      }
    } catch (error) {
      console.error('Error editing domain:', error);
    }
  }
}

// Function to delete domain
async function deleteDomain(domain) {
  try {
    const data = await chrome.storage.local.get('blockedDomains');
    const blockedDomains = data.blockedDomains || [];
    const index = blockedDomains.indexOf(domain);
    
    if (index > -1) {
      blockedDomains.splice(index, 1);
      await chrome.storage.local.set({ blockedDomains });
      updateBlockedDomainsList();
    }
  } catch (error) {
    console.error('Error deleting domain:', error);
  }
}

// Function to block domain
async function blockDomain(domain) {
  try {
    const data = await chrome.storage.local.get('blockedDomains');
    const blockedDomains = data.blockedDomains || [];
    
    if (!blockedDomains.includes(domain)) {
      blockedDomains.push(domain);
      await chrome.storage.local.set({ blockedDomains });
      
      // Update button state
      const blockButton = document.getElementById('blockDomainBtn');
      blockButton.textContent = 'Tracking enabled for this domain';
      blockButton.style.backgroundColor = '#4CAF50';
      blockButton.onclick = () => unblockDomain(domain);
      
      // Update blocked domains list if in settings tab
      if (document.getElementById('settingsTab').classList.contains('active')) {
        updateBlockedDomainsList();
      }
    }
  } catch (error) {
    console.error('Error blocking domain:', error);
  }
}

// Function to unblock domain
async function unblockDomain(domain) {
  try {
    const data = await chrome.storage.local.get('blockedDomains');
    const blockedDomains = data.blockedDomains || [];
    
    const index = blockedDomains.indexOf(domain);
    if (index > -1) {
      blockedDomains.splice(index, 1);
      await chrome.storage.local.set({ blockedDomains });
      
      // Update button state
      const blockButton = document.getElementById('blockDomainBtn');
      blockButton.textContent = 'Do not track this domain';
      blockButton.style.backgroundColor = '#ff4444';
      blockButton.onclick = () => blockDomain(domain);
      
      // Update blocked domains list if in settings tab
      if (document.getElementById('settingsTab').classList.contains('active')) {
        updateBlockedDomainsList();
      }
    }
  } catch (error) {
    console.error('Error unblocking domain:', error);
  }
}

// Reset all data
document.getElementById('resetButton').addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
    try {
      await chrome.storage.local.set({
        urlCounts: {},
        blockedDomains: []
      });
      updateBlockedDomainsList();
      alert('All data has been reset successfully.');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Error resetting data. Please try again.');
    }
  }
});

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