// Import themes CSS
const link = document.createElement('link');
link.href = chrome.runtime.getURL('styles/themes.css');
link.type = 'text/css';
link.rel = 'stylesheet';
document.head.appendChild(link);

// Function to apply color theme
function applyColorTheme() {
  chrome.storage.local.get(['colorTheme'], function(result) {
    const theme = result.colorTheme || 'cotton-candy';
    document.documentElement.setAttribute('data-theme', theme);
  });
}

// Apply theme initially
applyColorTheme();

// Listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.colorTheme) {
    document.documentElement.setAttribute('data-theme', changes.colorTheme.newValue);
  }
}); 