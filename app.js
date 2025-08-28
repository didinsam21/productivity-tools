// PWA Template - Main Application Logic

// DOM elements
const installBtn = document.getElementById('install-btn');
const statusDiv = document.getElementById('status');

// PWA install prompt
let deferredPrompt;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Register service worker
    registerServiceWorker();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update status
    updateStatus('App loaded successfully!', 'success');
});

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // Check if we're on localhost or HTTPS
            const isSecureContext = location.protocol === 'https:' || 
                                   location.hostname === 'localhost' || 
                                   location.hostname === '127.0.0.1';
            
            if (!isSecureContext) {
                console.warn('Service Worker requires HTTPS or localhost');
                updateStatus('⚠️ Service Worker requires HTTPS or localhost to work', 'info');
                return;
            }
            
            const registration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('Service Worker registered successfully:', registration);
            updateStatus('✅ Service Worker registered successfully!', 'success');
            
            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
                console.log('Service Worker update found');
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New update available
                            updateStatus('App update available! Refresh to update.', 'info');
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            updateStatus(`❌ Service Worker failed: ${error.message}`, 'error');
            
            // Provide helpful debugging info
            if (error.message.includes('scope')) {
                updateStatus('Try serving from a local web server instead of file://', 'info');
            }
        }
    } else {
        console.log('Service Worker not supported');
        updateStatus('Service Worker not supported in this browser', 'info');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Install button
    installBtn.addEventListener('click', handleInstallClick);
    
    // PWA install prompt events
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Online/Offline status
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Check initial online status
    updateOnlineStatus();
}



// Handle install button click
async function handleInstallClick() {
    if (!deferredPrompt) {
        updateStatus('Install prompt not available', 'info');
        return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        updateStatus('App installation started!', 'success');
    } else {
        updateStatus('App installation dismissed', 'info');
    }
    
    // Clear the deferred prompt
    deferredPrompt = null;
    installBtn.style.display = 'none';
}

// Handle before install prompt
function handleBeforeInstallPrompt(event) {
    console.log('PWA: Before install prompt triggered');
    
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    
    // Save the event so it can be triggered later
    deferredPrompt = event;
    
    // Show the install button
    installBtn.style.display = 'block';
    
    updateStatus('App can be installed! Click the install button.', 'info');
}

// Handle app installed
function handleAppInstalled(event) {
    console.log('PWA: App was installed', event);
    updateStatus('App installed successfully! 🎉', 'success');
    
    // Hide the install button
    installBtn.style.display = 'none';
    deferredPrompt = null;
}

// Handle online status
function handleOnlineStatus() {
    console.log('PWA: Back online');
    updateStatus('Back online! ✅', 'success');
    updateOnlineStatus();
}

// Handle offline status
function handleOfflineStatus() {
    console.log('PWA: Gone offline');
    updateStatus('You are offline. App will work with cached content. 📡', 'info');
    updateOnlineStatus();
}

// Update online status indicator
function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    const statusIndicator = document.querySelector('.online-status');
    
    if (!statusIndicator) {
        // Create status indicator if it doesn't exist
        const indicator = document.createElement('div');
        indicator.className = 'online-status';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: bold;
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(indicator);
    }
    
    const indicator = document.querySelector('.online-status');
    
    if (isOnline) {
        indicator.textContent = '🟢 Online';
        indicator.style.backgroundColor = '#d4edda';
        indicator.style.color = '#155724';
        indicator.style.border = '1px solid #c3e6cb';
    } else {
        indicator.textContent = '🔴 Offline';
        indicator.style.backgroundColor = '#f8d7da';
        indicator.style.color = '#721c24';
        indicator.style.border = '1px solid #f5c6cb';
    }
}

// Update status message
function updateStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Auto-clear success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 5000);
    }
}

// Utility functions for PWA features
const PWAUtils = {
    // Check if app is installed
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    },
    
    // Check if app is running in PWA mode
    isPWAMode() {
        return this.isInstalled();
    },
    
    // Get device info
    getDeviceInfo() {
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        
        return {
            isMobile,
            isIOS,
            isAndroid,
            isDesktop: !isMobile,
            userAgent
        };
    },
    
    // Share API (if supported)
    async share(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                console.log('Content shared successfully');
                return true;
            } catch (error) {
                console.error('Error sharing content:', error);
                return false;
            }
        } else {
            console.log('Web Share API not supported');
            return false;
        }
    },
    
    // Notification API (if supported)
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    },
    
    // Show notification
    showNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            return notification;
        }
        return null;
    }
};

// Cross-platform storage utilities (97%+ browser compatibility)
const PWAStorageUtils = {
    // Feature detection for localStorage
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Save app state with fallbacks
    saveAppState(state) {
        try {
            if (this.isStorageAvailable()) {
                localStorage.setItem('pwa-app-state', JSON.stringify(state));
                console.log('App state saved to localStorage');
            } else {
                // Fallback to session storage or memory
                sessionStorage.setItem('pwa-app-state', JSON.stringify(state));
                console.log('App state saved to sessionStorage (fallback)');
            }
        } catch (error) {
            console.error('Failed to save app state:', error);
            // Ultimate fallback - store in memory
            window._pwaAppState = state;
        }
    },
    
    // Load app state with fallbacks
    loadAppState() {
        try {
            if (this.isStorageAvailable()) {
                const state = localStorage.getItem('pwa-app-state');
                return state ? JSON.parse(state) : null;
            } else {
                // Try sessionStorage fallback
                const state = sessionStorage.getItem('pwa-app-state');
                return state ? JSON.parse(state) : null;
            }
        } catch (error) {
            console.error('Failed to load app state:', error);
            // Try memory fallback
            return window._pwaAppState || null;
        }
    },
    
    // Save user preferences
    savePreferences(prefs) {
        try {
            localStorage.setItem('pwa-preferences', JSON.stringify(prefs));
            updateStatus('Preferences saved!', 'success');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            updateStatus('Failed to save preferences', 'error');
        }
    },
    
    // Load user preferences
    loadPreferences() {
        try {
            const prefs = localStorage.getItem('pwa-preferences');
            return prefs ? JSON.parse(prefs) : {
                theme: 'auto',
                notifications: true,
                clickCount: 0
            };
        } catch (error) {
            console.error('Failed to load preferences:', error);
            return { theme: 'auto', notifications: true, clickCount: 0 };
        }
    }
};

// Load saved preferences on app start
let userPreferences = PWAStorageUtils.loadPreferences();

// Initialize storage demo
let demoStorage = null;

// Wait for both DOM and encrypted-storage.js to be ready
function waitForDependencies() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
        return;
    }
    
    // Check if EncryptedStorage is available
    if (typeof window.EncryptedStorage === 'undefined') {
        setTimeout(waitForDependencies, 100);
        return;
    }
    
    initStorageDemo();
}

// Initialize storage demo
waitForDependencies();

// Backup initialization on window load
window.addEventListener('load', function() {
    if (!demoStorage && typeof window.EncryptedStorage !== 'undefined') {
        setTimeout(initStorageDemo, 500);
    }
});



// Make utilities available globally
window.PWAUtils = PWAUtils;
window.PWAStorageUtils = PWAStorageUtils;





// === STORAGE DEMO FUNCTIONALITY ===

function initStorageDemo() {
    // Initialize encrypted storage
    if (window.EncryptedStorage) {
        try {
            demoStorage = new EncryptedStorage();
        } catch (error) {
            showDemoOutput('Failed to initialize encrypted storage', true);
        }
    } else {
        showDemoOutput('EncryptedStorage class not available', true);
        return;
    }
    
    // Get demo elements
    const saveBtn = document.getElementById('save-data-btn');
    const loadBtn = document.getElementById('load-data-btn');
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const inspectBtn = document.getElementById('inspect-storage-btn');
    const clearBtn = document.getElementById('clear-data-btn');
    const demoOutput = document.getElementById('demo-output');
    
    // Check if all required elements exist
    const missingElements = [];
    if (!saveBtn) missingElements.push('save-data-btn');
    if (!loadBtn) missingElements.push('load-data-btn');
    if (!exportBtn) missingElements.push('export-data-btn');
    if (!importBtn) missingElements.push('import-data-btn');
    if (!inspectBtn) missingElements.push('inspect-storage-btn');
    if (!clearBtn) missingElements.push('clear-data-btn');
    if (!demoOutput) missingElements.push('demo-output');
    
    if (missingElements.length > 0) {
        console.error('Missing demo elements:', missingElements);
        if (demoOutput) {
            showDemoOutput(`Missing UI elements: ${missingElements.join(', ')}`, true);
        } else {
            updateStatus('Storage demo UI elements not found', 'error');
        }
        return;
    }
    
    // Add event listeners
    try {
        saveBtn.addEventListener('click', handleSaveData);
        loadBtn.addEventListener('click', handleLoadData);
        exportBtn.addEventListener('click', handleExportData);
        importBtn.addEventListener('click', handleImportData);
        inspectBtn.addEventListener('click', handleInspectStorage);
        clearBtn.addEventListener('click', handleClearData);
        
    } catch (error) {
        console.error('Error adding event listeners:', error);
        showDemoOutput('Failed to add button event listeners', true);
        return;
    }
    
    showDemoOutput('Storage demo ready! Enter data above and click Save Data to test.', false);
}



function showDemoOutput(message, isError = false) {
    const output = document.getElementById('demo-output');
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌ ERROR' : '✅ SUCCESS';
    const formattedMessage = `[${timestamp}] ${prefix}: ${message}`;
    
    if (output) {
        output.textContent = formattedMessage;
    } else {
        // Fallback to console if demo output element not found
        console.log('Demo Output:', formattedMessage);
    }
    
    // Also show in main status
    updateStatus(message, isError ? 'error' : 'success');
}

async function handleSaveData() {
    const keyInput = document.getElementById('demo-key');
    const dataInput = document.getElementById('demo-data');
    const passwordInput = document.getElementById('demo-password');
    
    if (!keyInput || !dataInput || !demoStorage) {
        showDemoOutput('Demo not properly initialized', true);
        return;
    }
    
    const key = keyInput.value.trim();
    const data = dataInput.value.trim();
    const password = passwordInput.value || null;
    
    if (!key || !data) {
        showDemoOutput('Please enter both a key and data to save', true);
        return;
    }
    
    try {
        // Try to parse as JSON, fallback to string
        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            parsedData = data;
        }
        
        const success = await demoStorage.saveEncrypted(key, parsedData, password);
        
        if (success) {
            const encType = password ? 'password-encrypted' : 'auto-encrypted';
            showDemoOutput(`Data saved as '${key}' (${encType})`);
        } else {
            showDemoOutput('Failed to save data', true);
        }
    } catch (error) {
        showDemoOutput(`Save failed: ${error.message}`, true);
    }
}

async function handleLoadData() {
    const keyInput = document.getElementById('demo-key');
    const dataInput = document.getElementById('demo-data');
    const passwordInput = document.getElementById('demo-password');
    
    if (!keyInput || !dataInput || !demoStorage) {
        showDemoOutput('Demo not properly initialized', true);
        return;
    }
    
    const key = keyInput.value.trim();
    const password = passwordInput.value || null;
    
    if (!key) {
        showDemoOutput('Please enter a key to load', true);
        return;
    }
    
    try {
        const data = await demoStorage.loadEncrypted(key, password);
        
        if (data !== null) {
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            dataInput.value = dataStr;
            showDemoOutput(`Data loaded from '${key}'`);
        } else {
            showDemoOutput(`No data found for key '${key}' or wrong password`, true);
        }
    } catch (error) {
        showDemoOutput(`Load failed: ${error.message}`, true);
    }
}

async function handleExportData() {
    if (!demoStorage) {
        showDemoOutput('Demo not properly initialized', true);
        return;
    }
    
    try {
        const allData = {};
        const encryptionInfo = {};
        
        // Get all stored keys (localStorage example) - export in encrypted form
        if (demoStorage.features.localStorage) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !key.startsWith('pwa-')) { // Skip internal app data
                    const rawValue = localStorage.getItem(key);
                    if (rawValue) {
                        // Check if it appears to be encrypted data (base64-like)
                        const isEncrypted = rawValue.length > 50 && /^[A-Za-z0-9+/=]+$/.test(rawValue);
                        
                        allData[key] = rawValue; // Export the raw (potentially encrypted) value
                        encryptionInfo[key] = {
                            encrypted: isEncrypted,
                            size: rawValue.length,
                            type: isEncrypted ? 'encrypted' : 'plaintext'
                        };
                    }
                }
            }
        }
        
        // Create and download export file with encryption metadata
        const exportData = {
            timestamp: new Date().toISOString(),
            appName: 'PWA Template',
            exportType: 'encrypted',
            encryptionMethod: demoStorage.encryptionMethod,
            storageMethod: demoStorage.features.localStorage ? 'localStorage' : 'fallback',
            encryptionInfo: encryptionInfo,
            data: allData,
            importInstructions: 'To import this data, use the PWA storage demo and manually restore each key-value pair. Encrypted data will require the original password for decryption.'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `pwa-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const count = Object.keys(allData).length;
        const encryptedCount = Object.values(encryptionInfo).filter(info => info.encrypted).length;
        showDemoOutput(`Exported ${count} items (${encryptedCount} encrypted) to download file`);
    } catch (error) {
        showDemoOutput(`Export failed: ${error.message}`, true);
    }
}

async function handleImportData() {
    if (!demoStorage) {
        showDemoOutput('Demo not properly initialized', true);
        return;
    }
    
    try {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        // Handle file selection
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) {
                showDemoOutput('No file selected', true);
                return;
            }
            
            try {
                // Read the file
                const fileText = await file.text();
                const importData = JSON.parse(fileText);
                
                // Validate import data structure
                if (!importData.data || typeof importData.data !== 'object') {
                    showDemoOutput('Invalid import file format - missing data section', true);
                    return;
                }
                
                // Show import preview and confirmation
                const dataKeys = Object.keys(importData.data);
                const confirmMessage = `Import ${dataKeys.length} items from "${file.name}"?\n\n` +
                    `File Info:\n` +
                    `• Export Date: ${importData.timestamp || 'Unknown'}\n` +
                    `• App: ${importData.appName || 'Unknown'}\n` +
                    `• Export Type: ${importData.exportType || 'Unknown'}\n` +
                    `• Encryption Method: ${importData.encryptionMethod || 'Unknown'}\n\n` +
                    `Items to import:\n${dataKeys.slice(0, 10).map(key => `• ${key}`).join('\n')}` +
                    (dataKeys.length > 10 ? `\n... and ${dataKeys.length - 10} more` : '') +
                    `\n\nThis will overwrite any existing data with the same keys.`;
                
                if (!confirm(confirmMessage)) {
                    showDemoOutput('Import cancelled by user');
                    return;
                }
                
                // Import the data
                let importedCount = 0;
                let errorCount = 0;
                const errors = [];
                
                for (const [key, value] of Object.entries(importData.data)) {
                    try {
                        // Store the raw value directly to localStorage (preserving encryption)
                        if (demoStorage.features.localStorage) {
                            localStorage.setItem(key, value);
                            importedCount++;
                        } else {
                            // Fallback to memory storage
                            if (!window._encryptedStorage) window._encryptedStorage = {};
                            window._encryptedStorage[key] = value;
                            importedCount++;
                        }
                    } catch (error) {
                        errorCount++;
                        errors.push(`${key}: ${error.message}`);
                        console.error(`Failed to import ${key}:`, error);
                    }
                }
                
                // Show results
                if (errorCount === 0) {
                    showDemoOutput(`Successfully imported ${importedCount} items from "${file.name}"`);
                } else {
                    showDemoOutput(`Imported ${importedCount} items with ${errorCount} errors. Check console for details.`, true);
                    console.error('Import errors:', errors);
                }
                

                
            } catch (error) {
                if (error instanceof SyntaxError) {
                    showDemoOutput('Invalid JSON file format', true);
                } else {
                    showDemoOutput(`Import failed: ${error.message}`, true);
                }
                console.error('Import error:', error);
            } finally {
                // Clean up the file input
                document.body.removeChild(fileInput);
            }
        });
        
        // Add to DOM and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
        
    } catch (error) {
        showDemoOutput(`Import failed: ${error.message}`, true);
        console.error('Import error:', error);
    }
}

async function handleInspectStorage() {
    if (!demoStorage) {
        showDemoOutput('Demo not properly initialized', true);
        return;
    }
    
    try {
        // Gather information about stored data
        const storageInfo = {
            totalItems: 0,
            encryptedItems: 0,
            totalSize: 0,
            items: []
        };
        
        // Check localStorage for data
        if (demoStorage.features.localStorage) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const value = localStorage.getItem(key);
                    const size = new Blob([value]).size;
                    
                    storageInfo.totalItems++;
                    storageInfo.totalSize += size;
                    
                    // Check if it might be encrypted (basic heuristic)
                    const isEncrypted = value.length > 50 && /^[A-Za-z0-9+/=]+$/.test(value);
                    if (isEncrypted) {
                        storageInfo.encryptedItems++;
                    }
                    
                    storageInfo.items.push({
                        key: key,
                        size: size,
                        encrypted: isEncrypted,
                        type: key.startsWith('pwa-') ? 'App Data' : 'User Data'
                    });
                }
            }
        }
        
        // Create detailed report
        const report = `📊 LOCAL STORAGE INSPECTION REPORT
        
🗂️ Storage Overview:
• Total Items: ${storageInfo.totalItems}
• Encrypted Items: ${storageInfo.encryptedItems}
• Total Size: ${(storageInfo.totalSize / 1024).toFixed(2)} KB
• Storage Method: ${demoStorage.features.localStorage ? 'localStorage' : 'Fallback'}
• Encryption: ${demoStorage.encryptionMethod === 'webcrypto' ? 'AES-256-GCM' : 'XOR Cipher'}

📂 STORED ITEMS:
${storageInfo.items.length > 0 ? 
    storageInfo.items.map(item => 
        `• ${item.key} (${item.type}) - ${item.size} bytes ${item.encrypted ? '🔐' : '📄'}`
    ).join('\n') : 
    'No items found'
}

🛠️ ACCESS YOUR DATA:
1. Press F12 to open Developer Tools
2. Go to Application/Storage tab
3. Click "Local Storage" → "${window.location.origin}"
4. View all stored keys and values

💾 PHYSICAL LOCATION (Browser-dependent):
• Chrome/Edge: %LocalAppData%\\Google\\Chrome\\User Data\\Default\\Local Storage
• Firefox: %AppData%\\Mozilla\\Firefox\\Profiles\\[profile]\\storage\\default
• Note: Direct file access is restricted for security

⚠️ IMPORTANT: Browser storage is domain-specific and may be cleared by:
• Manual browser data clearing
• Incognito/Private mode (temporary)
• Storage quota limits
• Browser updates (rare)

For permanent storage, use the Export function to download your data.`;

        // Show in a modal-like dialog
        const modalContent = `
            <div style="
                position: fixed; 
                top: 0; left: 0; 
                width: 100%; height: 100%; 
                background: rgba(0,0,0,0.8); 
                z-index: 10000; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            ">
                <div style="
                    background: white; 
                    padding: 30px; 
                    border-radius: 12px; 
                    max-width: 800px; 
                    max-height: 90vh; 
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    position: relative;
                ">
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        position: absolute; 
                        top: 15px; 
                        right: 20px; 
                        background: #dc3545; 
                        color: white; 
                        border: none; 
                        border-radius: 50%; 
                        width: 30px; 
                        height: 30px; 
                        cursor: pointer;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                    <pre style="
                        white-space: pre-wrap; 
                        font-family: 'Courier New', monospace; 
                        font-size: 14px; 
                        line-height: 1.5;
                        margin: 0;
                        color: #333;
                    ">${report}</pre>
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="navigator.clipboard.writeText(\`${report.replace(/`/g, '\\`')}\`).then(() => alert('Report copied to clipboard!'))" style="
                            background: #007bff; 
                            color: white; 
                            border: none; 
                            padding: 10px 20px; 
                            border-radius: 6px; 
                            cursor: pointer; 
                            margin-right: 10px;
                        ">📋 Copy Report</button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                            background: #6c757d; 
                            color: white; 
                            border: none; 
                            padding: 10px 20px; 
                            border-radius: 6px; 
                            cursor: pointer;
                        ">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalContent;
        document.body.appendChild(modalDiv);
        
        showDemoOutput(`Storage inspection complete - found ${storageInfo.totalItems} items (${storageInfo.encryptedItems} encrypted)`);
        
    } catch (error) {
        showDemoOutput(`Inspection failed: ${error.message}`, true);
    }
}

async function handleClearData() {
    if (!demoStorage) {
        showDemoOutput('Demo not properly initialized', true);
        return;
    }
    
    const confirmed = confirm(
        'Are you sure you want to clear ALL stored data?\n\n' +
        'This will delete:\n' +
        '- All encrypted data\n' +
        '- All regular localStorage data\n' +
        '- App preferences and settings\n\n' +
        'This action cannot be undone!'
    );
    
    if (!confirmed) {
        showDemoOutput('Clear operation cancelled');
        return;
    }
    
    try {
        await demoStorage.clearAll();
        
        // Clear form inputs
        const keyInput = document.getElementById('demo-key');
        const dataInput = document.getElementById('demo-data');
        const passwordInput = document.getElementById('demo-password');
        
        if (keyInput) keyInput.value = 'demo-data';
        if (dataInput) dataInput.value = '{"message": "Hello PWA!"}';
        if (passwordInput) passwordInput.value = '';
        
        showDemoOutput('All data cleared successfully');
        
        // Reset user preferences
        userPreferences = { theme: 'auto', notifications: true, clickCount: 0 };
        PWAStorageUtils.savePreferences(userPreferences);
        
    } catch (error) {
        showDemoOutput(`Clear failed: ${error.message}`, true);
    }
}
