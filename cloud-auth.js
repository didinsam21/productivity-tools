/**
 * Enhanced Cloud Storage Sync Manager
 * Automatically detects cloud provider based on browser and uses browser-native APIs
 * Works with Google Drive (Chrome), OneDrive (Edge), Dropbox, and other cloud storage
 */

class CloudStorageManager {
    constructor() {
        this.isConnected = false;
        this.provider = null;
        this.autoSyncEnabled = false;
        this.autoSyncInterval = null;
        this.syncFrequency = 15; // minutes
        this.userEmail = null;
        this.lastSync = null;
        this.storage = null;
        this.encryptBeforeSync = true;
        this.syncFileName = 'productivity-suite-backup.json';
        this.fileHandle = null;
        this.detectedProvider = null;
        this.browserInfo = this.detectBrowser();
    }

    // ===== BROWSER DETECTION =====
    
    detectBrowser() {
        const userAgent = navigator.userAgent;
        let browser = 'unknown';
        let version = 'unknown';
        
        // Chrome detection
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser = 'chrome';
            version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
        }
        // Edge detection
        else if (userAgent.includes('Edg')) {
            browser = 'edge';
            version = userAgent.match(/Edg\/(\d+)/)?.[1] || 'unknown';
        }
        // Firefox detection
        else if (userAgent.includes('Firefox')) {
            browser = 'firefox';
            version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
        }
        // Safari detection
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'safari';
            version = userAgent.match(/Version\/(\d+)/)?.[1] || 'unknown';
        }
        
        return { browser, version, userAgent };
    }

    // ===== CLOUD PROVIDER DETECTION =====
    
    async detectCloudProvider() {
        try {
            // Check if user is signed into cloud services via browser
            const providers = await this.checkCloudSignIn();
            
            if (providers.length > 0) {
                // Prioritize based on browser
                const browserPriority = {
                    'chrome': ['google-drive', 'dropbox', 'onedrive'],
                    'edge': ['onedrive', 'google-drive', 'dropbox'],
                    'firefox': ['dropbox', 'google-drive', 'onedrive'],
                    'safari': ['icloud', 'dropbox', 'google-drive', 'onedrive']
                };
                
                const priority = browserPriority[this.browserInfo.browser] || ['google-drive', 'onedrive', 'dropbox'];
                
                // Find the first available provider in priority order
                for (const preferredProvider of priority) {
                    if (providers.includes(preferredProvider)) {
                        return preferredProvider;
                    }
                }
                
                // Fallback to first available provider
                return providers[0];
            }
            
            return null;
        } catch (error) {
            console.error('Error detecting cloud provider:', error);
            return null;
        }
    }

    async checkCloudSignIn() {
        const providers = [];
        
        try {
            // Check for Google Drive (Chrome/Edge)
            if (await this.checkGoogleDriveSignIn()) {
                providers.push('google-drive');
            }
            
            // Check for OneDrive (Edge/Chrome)
            if (await this.checkOneDriveSignIn()) {
                providers.push('onedrive');
            }
            
            // Check for Dropbox
            if (await this.checkDropboxSignIn()) {
                providers.push('dropbox');
            }
            
            // Check for iCloud (Safari)
            if (this.browserInfo.browser === 'safari' && await this.checkICloudSignIn()) {
                providers.push('icloud');
            }
            
        } catch (error) {
            console.error('Error checking cloud sign-in status:', error);
        }
        
        return providers;
    }

    async checkGoogleDriveSignIn() {
        try {
            // Skip cloud detection if running locally (file:// protocol)
            if (window.location.protocol === 'file:') {
                console.log('Running locally - skipping Google Drive detection');
                return false;
            }

            // Check if user is signed into Google account
            const response = await fetch('https://accounts.google.com/gsi/status', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.signedIn || false;
            }
            
            // Alternative check using Google Drive API
            try {
                const driveResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
                    credentials: 'include'
                });
                return driveResponse.ok;
            } catch (e) {
                // Ignore API errors
                console.log('Google Drive API check failed:', e.message);
            }
            
            return false;
        } catch (error) {
            console.log('Google Drive sign-in check failed:', error.message);
            return false;
        }
    }

    async checkOneDriveSignIn() {
        try {
            // Skip cloud detection if running locally (file:// protocol)
            if (window.location.protocol === 'file:') {
                console.log('Running locally - skipping OneDrive detection');
                return false;
            }

            // Check if user is signed into Microsoft account
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                method: 'GET',
                credentials: 'include'
            });
            
            return response.ok;
        } catch (error) {
            console.log('OneDrive sign-in check failed:', error.message);
            return false;
        }
    }

    async checkDropboxSignIn() {
        try {
            // Skip cloud detection if running locally (file:// protocol)
            if (window.location.protocol === 'file:') {
                console.log('Running locally - skipping Dropbox detection');
                return false;
            }

            // Check if user is signed into Dropbox
            const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
                method: 'POST',
                credentials: 'include'
            });
            
            return response.ok;
        } catch (error) {
            console.log('Dropbox sign-in check failed:', error.message);
            return false;
        }
    }

    async checkICloudSignIn() {
        try {
            // Skip cloud detection if running locally (file:// protocol)
            if (window.location.protocol === 'file:') {
                console.log('Running locally - skipping iCloud detection');
                return false;
            }

            // Check if user is signed into iCloud (Safari)
            if (this.browserInfo.browser === 'safari') {
                // Safari has built-in iCloud integration
                return true;
            }
            return false;
        } catch (error) {
            console.log('iCloud sign-in check failed:', error.message);
            return false;
        }
    }

    // ===== ENHANCED INITIALIZATION =====

    async initialize(storage) {
        this.storage = storage;
        await this.loadCloudSettings();
        
        // Auto-detect cloud provider on initialization
        this.detectedProvider = await this.detectCloudProvider();
        
        this.updateCloudUI();
        
        // Start auto-sync if it was previously enabled
        if (this.autoSyncEnabled && this.isConnected) {
            this.startAutoSync();
        }
        
        // Auto-connect if we're in a background iframe and not already connected
        if (this.isInBackgroundIframe() && !this.isConnected) {
            console.log('Background iframe detected - attempting auto-connect to cloud storage');
            try {
                await this.connectToCloud();
                if (this.isConnected) {
                    console.log('Auto-connected to cloud storage in background');
                    // Enable auto-sync by default in background mode
                    this.setAutoSyncEnabled(true);
                    this.startAutoSync();
                }
            } catch (error) {
                console.log('Auto-connect failed in background:', error.message);
            }
        }
    }

    async loadCloudSettings() {
        try {
            const settings = await this.storage.loadEncrypted('cloud-settings');
            if (settings) {
                this.provider = settings.provider;
                this.autoSyncEnabled = settings.autoSyncEnabled || false;
                this.syncFrequency = settings.syncFrequency || 15;
                this.lastSync = settings.lastSync;
                this.userEmail = settings.userEmail;
                this.encryptBeforeSync = settings.encryptBeforeSync !== undefined ? settings.encryptBeforeSync : true;
                this.syncFileName = settings.syncFileName || 'productivity-suite-backup.json';
                
                // Restore file handle if available
                if (settings.fileHandle && 'showOpenFilePicker' in window) {
                    try {
                        this.fileHandle = await window.showOpenFilePicker({
                            multiple: false,
                            types: [{
                                description: 'Productivity Suite Backup',
                                accept: { 'application/json': ['.json'] }
                            }]
                        });
                    } catch (error) {
                        console.log('File handle not restored:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading cloud settings:', error);
        }
    }

    async saveCloudSettings() {
        try {
            const settings = {
                provider: this.provider,
                autoSyncEnabled: this.autoSyncEnabled,
                syncFrequency: this.syncFrequency,
                lastSync: this.lastSync,
                userEmail: this.userEmail,
                encryptBeforeSync: this.encryptBeforeSync,
                syncFileName: this.syncFileName
            };
            await this.storage.saveEncrypted('cloud-settings', settings);
        } catch (error) {
            console.error('Error saving cloud settings:', error);
        }
    }

    // ===== BACKGROUND IFRAME DETECTION =====
    
    isInBackgroundIframe() {
        // Skip background iframe detection if running locally (file:// protocol)
        if (window.location.protocol === 'file:') {
            console.log('Running locally - skipping background iframe detection');
            return false;
        }

        // Check if we're in a hidden iframe (background settings)
        const isInIframe = window !== window.top;
        const isHidden = document.body.style.display === 'none' || 
                        document.body.style.visibility === 'hidden' ||
                        window.location.href.includes('background-settings');
        
        // Additional check for the specific background iframe ID
        let isBackgroundIframe = false;
        try {
            isBackgroundIframe = document.getElementById('background-settings') !== null || 
                              (window.parent && window.parent.document && 
                               window.parent.document.getElementById('background-settings') === window.frameElement);
        } catch (error) {
            // Ignore cross-origin errors
            console.log('Cross-origin iframe check failed:', error.message);
        }
        
        const result = isInIframe && (isHidden || isBackgroundIframe);
        console.log('Background iframe check:', { isInIframe, isHidden, isBackgroundIframe, result });
        return result;
    }

    // ===== ENHANCED CLOUD CONNECTION =====

    async connectToCloud() {
        try {
            console.log('Enhanced connectToCloud called');
            
            // Auto-detect cloud provider if not already set
            if (!this.detectedProvider) {
                this.detectedProvider = await this.detectCloudProvider();
                console.log('Detected cloud provider:', this.detectedProvider);
            }
            
            // Check if we're in an iframe (which blocks File System Access API)
            const isInIframe = window !== window.top;
            
            // Use File System Access API if available and not in iframe
            if ('showSaveFilePicker' in window && !isInIframe) {
                console.log('Using File System Access API for cloud sync');
                return await this.connectWithFileSystemAPI();
            } else {
                if (isInIframe) {
                    console.log('In iframe - using enhanced download/upload mode');
                } else {
                    console.log('File System Access API not supported - using enhanced download/upload mode');
                }
                return await this.connectWithEnhancedDownloadAPI();
            }
        } catch (error) {
            console.error('Failed to connect to cloud:', error);
            throw error;
        }
    }

    async connectWithFileSystemAPI() {
        try {
            // Suggest filename based on detected provider
            const providerNames = {
                'google-drive': 'Productivity Suite Backup (Google Drive)',
                'onedrive': 'Productivity Suite Backup (OneDrive)',
                'dropbox': 'Productivity Suite Backup (Dropbox)',
                'icloud': 'Productivity Suite Backup (iCloud)'
            };
            
            const suggestedName = providerNames[this.detectedProvider] || this.syncFileName;
            
            // Let user choose where to save the file (Google Drive, OneDrive, etc.)
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: [{
                    description: 'Productivity Suite Backup',
                    accept: { 'application/json': ['.json'] }
                }]
            });

            this.fileHandle = fileHandle;
            this.isConnected = true;
            this.provider = this.detectedProvider || 'browser-native';
            this.userEmail = `Connected to ${this.getProviderDisplayName(this.provider)}`;
            
            // Test the connection by creating a small test file
            await this.testConnection();
            
            await this.saveCloudSettings();
            this.updateCloudUI();
            
            // Auto-enable sync if this is the first connection
            if (!this.autoSyncEnabled) {
                this.setAutoSyncEnabled(true);
            }
            
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('File selection was cancelled');
            }
            throw error;
        }
    }

    async connectWithEnhancedDownloadAPI() {
        // Enhanced fallback for browsers without File System Access API or when in iframe
        this.isConnected = true;
        this.provider = this.detectedProvider || 'download';
        this.userEmail = `Manual sync via ${this.getProviderDisplayName(this.provider)}`;
        
        await this.saveCloudSettings();
        this.updateCloudUI();
        
        // Show user instructions for manual sync with detected provider
        console.log(`Connected using manual download/upload mode for ${this.getProviderDisplayName(this.provider)}`);
        
        // Auto-enable sync even in manual mode
        if (!this.autoSyncEnabled) {
            this.setAutoSyncEnabled(true);
        }
        
        return true;
    }

    getProviderDisplayName(provider) {
        const names = {
            'google-drive': 'Google Drive',
            'onedrive': 'OneDrive',
            'dropbox': 'Dropbox',
            'icloud': 'iCloud',
            'browser-native': 'Browser Cloud Storage',
            'download': 'Manual Download'
        };
        return names[provider] || provider;
    }

    async testConnection() {
        if (!this.fileHandle) return false;
        
        try {
            const testData = { test: true, timestamp: new Date().toISOString() };
            const writable = await this.fileHandle.createWritable();
            await writable.write(JSON.stringify(testData, null, 2));
            await writable.close();
            
            // Verify we can read it back
            const file = await this.fileHandle.getFile();
            const content = await file.text();
            const parsed = JSON.parse(content);
            
            return parsed.test === true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    async disconnectFromCloud() {
        this.isConnected = false;
        this.provider = null;
        this.userEmail = null;
        this.fileHandle = null;
        this.stopAutoSync();
        
        await this.saveCloudSettings();
        this.updateCloudUI();
    }

    // ===== SYNC OPERATIONS =====

    async syncToCloud() {
        if (!this.isConnected) {
            throw new Error('Not connected to cloud storage');
        }

        try {
            // Create complete export of all data
            const allData = await this.gatherAllData();
            
            let syncData = allData;

            // Apply encryption if enabled
            if (this.encryptBeforeSync) {
                syncData = await this.encryptData(allData);
            }

            // Save to cloud using appropriate method
            if (this.fileHandle) {
                await this.saveWithFileSystemAPI(syncData);
            } else {
                await this.saveWithDownloadAPI(syncData);
            }
            
            this.lastSync = new Date().toISOString();
            await this.saveCloudSettings();
            this.updateCloudUI();
            
            return true;
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        }
    }

    async gatherAllData() {
        const allData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            app: 'Productivity Suite',
            tools: {}
        };

        // Export data from all tools
        const toolKeys = [
            { key: 'notebook-data', name: 'notebook' },
            { key: 'pomodoro-data', name: 'pomodoro' },
            { key: 'checklist-data', name: 'checklist' },
            { key: 'eisenhower-data', name: 'eisenhower' }
        ];

        for (const {key, name} of toolKeys) {
            try {
                const data = await this.storage.loadEncrypted(key);
                if (data) {
                    allData.tools[name] = data;
                }
            } catch (error) {
                console.error(`Error loading ${name}:`, error);
            }
        }

        return allData;
    }

    async saveWithFileSystemAPI(data) {
        if (!this.fileHandle) {
            throw new Error('No file handle available');
        }

        const writable = await this.fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    }

    async saveWithDownloadAPI(data) {
        // Create download link for manual save
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.syncFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async downloadFromCloud() {
        if (!this.isConnected) {
            throw new Error('Not connected to cloud storage');
        }

        try {
            let data;

            if (this.fileHandle) {
                data = await this.loadWithFileSystemAPI();
            } else {
                throw new Error('Please manually upload your backup file');
            }

            // Decrypt if needed
            if (this.encryptBeforeSync) {
                data = await this.decryptData(data);
            }

            // Import data to all tools
            await this.importAllData(data);
            
            this.lastSync = new Date().toISOString();
            await this.saveCloudSettings();
            this.updateCloudUI();
            
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    async loadWithFileSystemAPI() {
        if (!this.fileHandle) {
            throw new Error('No file handle available');
        }

        const file = await this.fileHandle.getFile();
        const content = await file.text();
        return JSON.parse(content);
    }

    async importAllData(data) {
        if (!data.tools) {
            throw new Error('Invalid backup file format');
        }

        for (const [toolName, toolData] of Object.entries(data.tools)) {
            try {
                const key = `${toolName}-data`;
                await this.storage.saveEncrypted(key, toolData);
            } catch (error) {
                console.error(`Error importing ${toolName}:`, error);
            }
        }
    }

    // ===== ENCRYPTION =====

    async encryptData(data) {
        try {
            // Simple encryption - in production, use proper crypto
            const dataString = JSON.stringify(data);
            const encoded = btoa(unescape(encodeURIComponent(dataString)));
            return {
                encrypted: true,
                data: encoded,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            return data; // Return unencrypted if encryption fails
        }
    }

    async decryptData(encryptedData) {
        try {
            if (!encryptedData.encrypted) {
                return encryptedData;
            }

            const decoded = decodeURIComponent(escape(atob(encryptedData.data)));
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    // ===== ENHANCED AUTO SYNC =====

    startAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }

        this.autoSyncEnabled = true;
        
        // Initial sync after a short delay
        setTimeout(async () => {
            try {
                await this.syncToCloud();
                console.log('Initial auto-sync completed successfully');
            } catch (error) {
                console.error('Initial auto-sync failed:', error);
            }
        }, 5000); // 5 second delay for initial sync

        // Set up recurring sync
        this.autoSyncInterval = setInterval(async () => {
            try {
                await this.syncToCloud();
                console.log('Recurring auto-sync completed successfully');
            } catch (error) {
                console.error('Recurring auto-sync failed:', error);
            }
        }, this.syncFrequency * 60 * 1000);

        this.saveCloudSettings();
        this.updateCloudUI();
        
        console.log(`Auto-sync started with ${this.syncFrequency} minute intervals`);
    }

    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
        this.autoSyncEnabled = false;
        this.saveCloudSettings();
        this.updateCloudUI();
    }

    setSyncFrequency(minutes) {
        this.syncFrequency = minutes;
        if (this.autoSyncEnabled) {
            this.stopAutoSync();
            this.startAutoSync();
        }
        this.saveCloudSettings();
    }

    setAutoSyncEnabled(enabled) {
        this.autoSyncEnabled = enabled;
        if (enabled && this.isConnected) {
            this.startAutoSync();
        } else {
            this.stopAutoSync();
        }
        this.saveCloudSettings();
        this.updateCloudUI();
    }

    setEncryptBeforeSync(encrypt) {
        this.encryptBeforeSync = encrypt;
        this.saveCloudSettings();
    }

    // ===== ENHANCED UI UPDATES =====

    updateCloudUI() {
        // Update connection status
        const statusElement = document.getElementById('cloud-connection-status');
        const providerElement = document.getElementById('cloud-provider-name');
        const lastSyncElement = document.getElementById('cloud-last-sync');
        const autoSyncElement = document.getElementById('cloud-auto-sync-status');

        if (statusElement) {
            statusElement.textContent = this.isConnected ? 'Connected' : 'Not connected';
            statusElement.className = this.isConnected ? 'info-value connected' : 'info-value';
        }

        if (providerElement) {
            if (this.isConnected) {
                providerElement.textContent = this.getProviderDisplayName(this.provider);
            } else {
                providerElement.textContent = 'None';
            }
        }

        if (lastSyncElement) {
            if (this.lastSync) {
                const date = new Date(this.lastSync);
                lastSyncElement.textContent = date.toLocaleString();
            } else {
                lastSyncElement.textContent = 'Never';
            }
        }

        if (autoSyncElement) {
            autoSyncElement.textContent = this.autoSyncEnabled ? 'Enabled' : 'Disabled';
        }

        // Update control buttons
        this.updateControlButtons();
        
        // Show browser detection info
        this.updateBrowserInfo();
        
        // Notify parent window of sync status (for background iframe)
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({
                    type: 'cloud-sync-status',
                    connected: this.isConnected,
                    lastSync: this.lastSync,
                    autoSyncEnabled: this.autoSyncEnabled,
                    provider: this.provider,
                    browser: this.browserInfo.browser
                }, '*');
            } catch (error) {
                // Ignore cross-origin errors
            }
        }
    }

    updateBrowserInfo() {
        // Add browser detection info to the UI if not already present
        let browserInfoElement = document.getElementById('browser-info');
        if (!browserInfoElement) {
            const cloudSection = document.querySelector('.settings-section h3');
            if (cloudSection && cloudSection.textContent.includes('Cloud Storage')) {
                browserInfoElement = document.createElement('div');
                browserInfoElement.id = 'browser-info';
                browserInfoElement.className = 'storage-info';
                browserInfoElement.style.marginTop = '10px';
                browserInfoElement.style.fontSize = '0.85rem';
                browserInfoElement.style.color = '#666';
                
                const section = cloudSection.parentNode;
                section.insertBefore(browserInfoElement, section.querySelector('.setting-item'));
            }
        }
        
        if (browserInfoElement) {
            const providerName = this.detectedProvider ? this.getProviderDisplayName(this.detectedProvider) : 'None detected';
            const isLocal = window.location.protocol === 'file:';
            browserInfoElement.innerHTML = `
                <div class="info-item">
                    <span class="info-label">Browser:</span>
                    <span class="info-value">${this.browserInfo.browser.charAt(0).toUpperCase() + this.browserInfo.browser.slice(1)} ${this.browserInfo.version}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Environment:</span>
                    <span class="info-value">${isLocal ? 'Local Development' : 'Production'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Detected Cloud:</span>
                    <span class="info-value">${providerName}${isLocal ? ' (Cloud detection disabled locally)' : ''}</span>
                </div>
            `;
        }
    }

    updateControlButtons() {
        const connectBtn = document.getElementById('connect-cloud-btn');
        const disconnectBtn = document.getElementById('disconnect-cloud-btn');
        const syncBtn = document.getElementById('sync-now-btn');
        const autoSyncBtn = document.getElementById('toggle-auto-sync-btn');
        const providerSelect = document.getElementById('cloud-provider-select');

        if (connectBtn) {
            connectBtn.disabled = this.isConnected;
            connectBtn.style.display = this.isConnected ? 'none' : 'inline-block';
        }

        if (disconnectBtn) {
            disconnectBtn.style.display = this.isConnected ? 'inline-block' : 'none';
        }

        if (syncBtn) {
            syncBtn.style.display = this.isConnected ? 'inline-block' : 'none';
        }

        if (autoSyncBtn) {
            autoSyncBtn.style.display = this.isConnected ? 'inline-block' : 'none';
            autoSyncBtn.textContent = `⚙️ Auto-sync: ${this.autoSyncEnabled ? 'ON' : 'OFF'}`;
        }

        if (providerSelect) {
            providerSelect.value = this.provider || '';
        }
    }

    // ===== PUBLIC API =====

    async handleConnect() {
        try {
            console.log('handleConnect called');
            await this.connectToCloud();
            return { success: true, message: 'Successfully connected to cloud storage' };
        } catch (error) {
            console.error('handleConnect error:', error);
            return { success: false, message: error.message };
        }
    }

    async handleDisconnect() {
        try {
            await this.disconnectFromCloud();
            return { success: true, message: 'Disconnected from cloud storage' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async handleSyncNow() {
        try {
            await this.syncToCloud();
            return { success: true, message: 'Data synced successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async handleDownload() {
        try {
            await this.downloadFromCloud();
            return { success: true, message: 'Data downloaded successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    handleToggleAutoSync() {
        if (this.autoSyncEnabled) {
            this.stopAutoSync();
            return { success: true, message: 'Auto-sync disabled' };
        } else {
            this.startAutoSync();
            return { success: true, message: 'Auto-sync enabled' };
        }
    }
}

// ===== UI MANAGEMENT =====

class CloudAuthUI {
    constructor(cloudManager) {
        this.cloudManager = cloudManager;
    }

    initialize() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Cloud provider selection
        const providerSelect = document.getElementById('cloud-provider-select');
        if (providerSelect) {
            providerSelect.addEventListener('change', () => {
                this.cloudManager.provider = providerSelect.value;
                this.updateUI();
            });
        }

        // Control buttons
        const connectBtn = document.getElementById('connect-cloud-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', async () => {
                console.log('Connect button clicked!');
                await this.handleConnect();
            });
        }

        const disconnectBtn = document.getElementById('disconnect-cloud-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', async () => {
                await this.handleDisconnect();
            });
        }

        const syncBtn = document.getElementById('sync-now-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', async () => {
                await this.handleSyncNow();
            });
        }

        const autoSyncBtn = document.getElementById('toggle-auto-sync-btn');
        if (autoSyncBtn) {
            autoSyncBtn.addEventListener('click', async () => {
                await this.handleToggleAutoSync();
            });
        }

        // Sync settings
        const encryptCheckbox = document.getElementById('encrypt-before-sync');
        if (encryptCheckbox) {
            encryptCheckbox.addEventListener('change', (e) => {
                this.cloudManager.setEncryptBeforeSync(e.target.checked);
            });
        }

        const frequencySelect = document.getElementById('sync-frequency-select');
        if (frequencySelect) {
            frequencySelect.addEventListener('change', (e) => {
                this.cloudManager.setSyncFrequency(parseInt(e.target.value));
            });
        }
    }

    async handleConnect() {
        const result = await this.cloudManager.handleConnect();
        this.showMessage(result.message, result.success ? 'success' : 'error');
    }

    async handleDisconnect() {
        const result = await this.cloudManager.handleDisconnect();
        this.showMessage(result.message, result.success ? 'success' : 'error');
    }

    async handleSyncNow() {
        const result = await this.cloudManager.handleSyncNow();
        this.showMessage(result.message, result.success ? 'success' : 'error');
    }

    async handleToggleAutoSync() {
        const result = this.cloudManager.handleToggleAutoSync();
        this.showMessage(result.message, result.success ? 'success' : 'error');
    }

    updateUI() {
        // Show/hide sync options based on connection status
        const syncOptions = document.getElementById('sync-options');
        if (syncOptions) {
            syncOptions.style.display = this.cloudManager.isConnected ? 'block' : 'none';
        }

        // Update provider selection
        const providerSelect = document.getElementById('cloud-provider-select');
        if (providerSelect) {
            providerSelect.value = this.cloudManager.provider || '';
        }

        // Update encryption checkbox
        const encryptCheckbox = document.getElementById('encrypt-before-sync');
        if (encryptCheckbox) {
            encryptCheckbox.checked = this.cloudManager.encryptBeforeSync;
        }

        // Update frequency select
        const frequencySelect = document.getElementById('sync-frequency-select');
        if (frequencySelect) {
            frequencySelect.value = this.cloudManager.syncFrequency.toString();
        }
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageElement = document.getElementById('cloud-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'cloud-message';
            messageElement.className = 'message';
            const cloudSection = document.querySelector('.settings-section h3');
            if (cloudSection && cloudSection.textContent.includes('Cloud Storage')) {
                cloudSection.parentNode.insertBefore(messageElement, cloudSection.nextSibling);
            }
        }

        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.CloudStorageManager = CloudStorageManager;
    window.CloudAuthUI = CloudAuthUI;
}
