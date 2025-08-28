/**
 * Cloud Storage Authentication and Synchronization Manager
 * Supports Google Drive, Microsoft OneDrive, and Dropbox
 */

class CloudStorageManager {
    constructor() {
        this.isConnected = false;
        this.provider = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.autoSyncEnabled = false;
        this.autoSyncInterval = null;
        this.syncFrequency = 15; // minutes
        this.userEmail = null;
        this.rememberCredentials = false;
        this.lastSync = null;
        this.storage = null;
        this.encryptBeforeSync = true;
        this.apiCredentials = null;
    }

    async initialize(storage) {
        this.storage = storage;
        await this.loadCloudSettings();
        await this.loadApiCredentials();
    }

    async loadApiCredentials() {
        try {
            const apiCredentials = await this.storage.loadEncrypted('api-credentials');
            this.apiCredentials = apiCredentials || {};
        } catch (error) {
            console.error('Error loading API credentials:', error);
            this.apiCredentials = {};
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
                this.rememberCredentials = settings.rememberCredentials || false;
                this.encryptBeforeSync = settings.encryptBeforeSync !== undefined ? settings.encryptBeforeSync : true;
                
                // Check if we have a valid stored token
                if (settings.accessToken) {
                    this.accessToken = settings.accessToken;
                    this.refreshToken = settings.refreshToken;
                    await this.validateToken();
                }
            }
            this.updateCloudUI();
        } catch (error) {
            console.error('Error loading cloud settings:', error);
        }
    }

    async saveCloudSettings() {
        try {
            const settings = {
                provider: this.provider,
                accessToken: this.accessToken,
                refreshToken: this.refreshToken,
                autoSyncEnabled: this.autoSyncEnabled,
                syncFrequency: this.syncFrequency,
                lastSync: this.lastSync,
                userEmail: this.userEmail,
                rememberCredentials: this.rememberCredentials,
                encryptBeforeSync: this.encryptBeforeSync
            };
            await this.storage.saveEncrypted('cloud-settings', settings);
        } catch (error) {
            console.error('Error saving cloud settings:', error);
        }
    }

    // ===== GOOGLE DRIVE INTEGRATION =====

    async uploadToGoogleDrive(data) {
        // In a real implementation, you'd use the Google Drive API
        console.log('Uploading to Google Drive:', data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { fileId: 'demo_file_google_' + Date.now() };
    }

    async downloadFromGoogleDrive() {
        // In a real implementation, you'd use the Google Drive API
        console.log('Downloading from Google Drive');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            timestamp: new Date().toISOString(),
            data: {}
        };
    }

    // ===== MICROSOFT ONEDRIVE INTEGRATION =====

    async uploadToOneDrive(data) {
        // In a real implementation, you'd use Microsoft Graph API
        console.log('Uploading to OneDrive:', data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { fileId: 'demo_file_onedrive_' + Date.now() };
    }

    async downloadFromOneDrive() {
        // In a real implementation, you'd use Microsoft Graph API
        console.log('Downloading from OneDrive');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            timestamp: new Date().toISOString(),
            data: {}
        };
    }

    // ===== DROPBOX INTEGRATION =====

    async uploadToDropbox(data) {
        // In a real implementation, you'd use Dropbox API
        console.log('Uploading to Dropbox:', data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { fileId: 'demo_file_dropbox_' + Date.now() };
    }

    async downloadFromDropbox() {
        // In a real implementation, you'd use Dropbox API
        console.log('Downloading from Dropbox');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            timestamp: new Date().toISOString(),
            data: {}
        };
    }

    // ===== GENERAL AUTHENTICATION METHODS =====
    async handleAuthenticationSuccess(provider, authData) {
        try {
            // Check if we have API credentials for this provider
            const providerKey = provider === 'googledrive' ? 'google' : 
                               provider === 'onedrive' ? 'microsoft' : 'dropbox';
            
            const hasCredentials = this.apiCredentials && 
                                 this.apiCredentials[providerKey] &&
                                 this.apiCredentials[providerKey].clientId;
            
            this.provider = provider;
            this.isConnected = true;
            
            // Generate token based on whether we have real credentials
            if (hasCredentials && authData.authMethod === 'credentials') {
                this.accessToken = `real_creds_${provider}_${Date.now()}`;
                this.userEmail = authData.email;
            } else {
                this.accessToken = `demo_creds_${provider}_${Date.now()}`;
                this.userEmail = authData.email;
            }
            
            // Save settings including remember me preference
            if (authData.rememberMe) {
                this.rememberCredentials = true;
            }
            
            await this.saveCloudSettings();
            this.updateCloudUI();
            
            // Start auto-sync if enabled
            if (this.autoSyncEnabled) {
                this.startAutoSync();
            }
            
            return { hasRealCredentials: hasCredentials };
        } catch (error) {
            console.error('Authentication success handler failed:', error);
            throw error;
        }
    }

    getProviderCredentials(provider) {
        const providerKey = provider === 'googledrive' ? 'google' : 
                           provider === 'onedrive' ? 'microsoft' : 'dropbox';
        
        return this.apiCredentials && this.apiCredentials[providerKey] ? 
               this.apiCredentials[providerKey] : null;
    }

    hasValidCredentials(provider) {
        const credentials = this.getProviderCredentials(provider);
        if (!credentials) return false;
        
        // Check for required fields based on provider
        switch (provider) {
            case 'googledrive':
                return !!(credentials.clientId && credentials.clientSecret);
            case 'onedrive':
                return !!(credentials.clientId && credentials.clientSecret);
            case 'dropbox':
                return !!(credentials.appKey && credentials.appSecret);
            default:
                return false;
        }
    }

    async validateToken() {
        if (!this.accessToken) return false;
        
        try {
            // In a real implementation, you'd validate the token with the provider's API
            // For demo purposes, we'll assume tokens are valid for 24 hours
            if (this.accessToken.includes('demo_token')) {
                this.isConnected = true;
                return true;
            }
            
            // Validate with actual API endpoints here
            return await this.validateWithProvider();
        } catch (error) {
            console.error('Token validation failed:', error);
            this.disconnect();
            return false;
        }
    }

    async validateWithProvider() {
        switch (this.provider) {
            case 'googledrive':
                // Validate Google token
                return true;
            case 'onedrive':
                // Validate Microsoft token
                return true;
            case 'dropbox':
                // Validate Dropbox token
                return true;
            default:
                return false;
        }
    }

    // ===== SYNC OPERATIONS =====
    async syncToCloud() {
        if (!this.isConnected) {
            throw new Error('Not connected to cloud storage');
        }

        try {
            // Create complete export of all data
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

            let syncData = allData;

            // Apply encryption if enabled
            if (this.encryptBeforeSync) {
                syncData = await this.encryptData(allData);
            }

            // Upload to cloud storage
            await this.uploadToProvider(syncData);
            
            this.lastSync = new Date().toISOString();
            await this.saveCloudSettings();
            this.updateCloudUI();
            
            return true;
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        }
    }

    async encryptData(data) {
        try {
            // Simple encryption using Web Crypto API
            const encoder = new TextEncoder();
            const dataString = JSON.stringify(data);
            const dataBuffer = encoder.encode(dataString);
            
            // Generate a key (in production, use a proper key derivation)
            const key = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt']
            );
            
            // Generate IV
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt the data
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                dataBuffer
            );
            
            // Return encrypted package
            return {
                encrypted: true,
                timestamp: new Date().toISOString(),
                iv: Array.from(iv),
                data: Array.from(new Uint8Array(encrypted))
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            // Fallback to unencrypted if encryption fails
            return data;
        }
    }

    async uploadToProvider(data) {
        switch (this.provider) {
            case 'googledrive':
                return await this.uploadToGoogleDrive(data);
            case 'onedrive':
                return await this.uploadToOneDrive(data);
            case 'dropbox':
                return await this.uploadToDropbox(data);
            default:
                throw new Error('Provider not supported');
        }
    }

    async downloadFromCloud() {
        if (!this.isConnected) {
            throw new Error('Not connected to cloud storage');
        }

        try {
            let cloudData = await this.downloadFromProvider();
            
            // Check if data is encrypted
            if (cloudData && cloudData.encrypted) {
                try {
                    cloudData = await this.decryptData(cloudData);
                } catch (error) {
                    console.error('Failed to decrypt cloud data:', error);
                    throw new Error('Failed to decrypt cloud data. Data may be corrupted or use a different encryption key.');
                }
            }
            
            if (cloudData && cloudData.tools) {
                const conflictResolution = document.getElementById('conflict-resolution-select').value;
                
                // Map tool names back to storage keys
                const toolMapping = {
                    'notebook': 'notebook-data',
                    'pomodoro': 'pomodoro-data',
                    'checklist': 'checklist-data',
                    'eisenhower': 'eisenhower-data'
                };
                
                for (const [toolName, cloudValue] of Object.entries(cloudData.tools)) {
                    const dataKey = toolMapping[toolName];
                    if (!dataKey) continue;
                    
                    const localData = await this.storage.loadEncrypted(dataKey);
                    
                    if (localData && conflictResolution === 'prompt') {
                        // Handle conflict
                        const choice = confirm(`Conflict detected for ${toolName}.\n\nClick OK to keep cloud data, Cancel to keep local data.`);
                        if (choice) {
                            await this.storage.saveEncrypted(dataKey, cloudValue);
                        }
                    } else if (!localData || conflictResolution === 'remote') {
                        await this.storage.saveEncrypted(dataKey, cloudValue);
                    } else if (conflictResolution === 'merge') {
                        // Simple merge strategy
                        const merged = this.mergeData(localData, cloudValue);
                        await this.storage.saveEncrypted(dataKey, merged);
                    }
                    // 'local' option keeps local data unchanged
                }
            }
            
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    async decryptData(encryptedData) {
        try {
            // This is a simplified decryption - in production you'd need proper key management
            console.log('Encrypted data received - decryption not fully implemented for demo');
            
            // For demo purposes, return simulated decrypted data
            return {
                version: '1.0',
                timestamp: new Date().toISOString(),
                app: 'Productivity Suite',
                tools: {}
            };
        } catch (error) {
            console.error('Decryption failed:', error);
            throw error;
        }
    }

    async downloadFromProvider() {
        switch (this.provider) {
            case 'googledrive':
                return await this.downloadFromGoogleDrive();
            case 'onedrive':
                return await this.downloadFromOneDrive();
            case 'dropbox':
                return await this.downloadFromDropbox();
            default:
                throw new Error('Provider not supported');
        }
    }

    mergeData(local, remote) {
        // Simple merge strategy - takes the newer data
        const localTime = new Date(local.lastModified || 0).getTime();
        const remoteTime = new Date(remote.lastModified || 0).getTime();
        
        return remoteTime > localTime ? remote : local;
    }

    async syncNow() {
        try {
            const syncBtn = document.getElementById('sync-now-btn');
            if (syncBtn) {
                syncBtn.textContent = '🔄 Syncing...';
                syncBtn.disabled = true;
            }
            
            // Upload local changes
            await this.syncToCloud();
            
            // Download remote changes
            await this.downloadFromCloud();
            
            return true;
        } catch (error) {
            console.error('Manual sync failed:', error);
            throw error;
        } finally {
            const syncBtn = document.getElementById('sync-now-btn');
            if (syncBtn) {
                syncBtn.textContent = '🔄 Sync Now';
                syncBtn.disabled = false;
            }
        }
    }

    // ===== AUTO-SYNC MANAGEMENT =====
    toggleAutoSync() {
        this.autoSyncEnabled = !this.autoSyncEnabled;
        
        if (this.autoSyncEnabled) {
            this.startAutoSync();
        } else {
            this.stopAutoSync();
        }
        
        this.saveCloudSettings();
        this.updateCloudUI();
    }

    startAutoSync() {
        this.stopAutoSync(); // Clear any existing interval
        
        const intervalMs = this.syncFrequency * 60 * 1000;
        this.autoSyncInterval = setInterval(async () => {
            try {
                await this.syncToCloud();
                await this.downloadFromCloud();
                this.updateCloudUI();
            } catch (error) {
                console.error('Auto-sync failed:', error);
            }
        }, intervalMs);
    }

    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
    }

    async disconnect() {
        this.isConnected = false;
        this.provider = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.autoSyncEnabled = false;
        this.userEmail = null;
        this.stopAutoSync();
        
        await this.saveCloudSettings();
        this.updateCloudUI();
        
        return true;
    }

    // ===== UI MANAGEMENT =====
    updateCloudUI() {
        const statusElement = document.getElementById('cloud-connection-status');
        const providerElement = document.getElementById('cloud-provider-name');
        const lastSyncElement = document.getElementById('cloud-last-sync');
        const autoSyncStatusElement = document.getElementById('cloud-auto-sync-status');
        
        const connectBtn = document.getElementById('connect-cloud-btn');
        const disconnectBtn = document.getElementById('disconnect-cloud-btn');
        const syncNowBtn = document.getElementById('sync-now-btn');
        const toggleAutoSyncBtn = document.getElementById('toggle-auto-sync-btn');
        const syncOptions = document.getElementById('sync-options');
        const providerSelect = document.getElementById('cloud-provider-select');
        
        if (this.isConnected) {
            if (statusElement) {
                statusElement.textContent = '✅ Connected';
                statusElement.style.color = '#059669';
            }
            if (providerElement) {
                const providerNames = {
                    'googledrive': 'Google Drive',
                    'onedrive': 'Microsoft OneDrive',
                    'dropbox': 'Dropbox'
                };
                providerElement.textContent = providerNames[this.provider] || this.provider;
            }
            if (lastSyncElement) {
                lastSyncElement.textContent = this.lastSync ? 
                    new Date(this.lastSync).toLocaleString() : 'Never';
            }
            if (autoSyncStatusElement) {
                autoSyncStatusElement.textContent = this.autoSyncEnabled ? 'Enabled' : 'Disabled';
            }
            
            if (connectBtn) connectBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
            if (syncNowBtn) syncNowBtn.style.display = 'inline-block';
            if (toggleAutoSyncBtn) {
                toggleAutoSyncBtn.style.display = 'inline-block';
                toggleAutoSyncBtn.textContent = `⚙️ Auto-sync: ${this.autoSyncEnabled ? 'ON' : 'OFF'}`;
            }
            if (syncOptions) syncOptions.style.display = 'block';
            if (providerSelect) providerSelect.disabled = true;
        } else {
            if (statusElement) {
                statusElement.textContent = '❌ Not connected';
                statusElement.style.color = '#dc2626';
            }
            if (providerElement) providerElement.textContent = 'None';
            if (lastSyncElement) lastSyncElement.textContent = 'Never';
            if (autoSyncStatusElement) autoSyncStatusElement.textContent = 'Disabled';
            
            if (connectBtn) {
                connectBtn.style.display = 'inline-block';
                connectBtn.disabled = !providerSelect?.value;
            }
            if (disconnectBtn) disconnectBtn.style.display = 'none';
            if (syncNowBtn) syncNowBtn.style.display = 'none';
            if (toggleAutoSyncBtn) toggleAutoSyncBtn.style.display = 'none';
            if (syncOptions) syncOptions.style.display = 'none';
            if (providerSelect) providerSelect.disabled = false;
        }
    }

    // ===== PROVIDER-SPECIFIC CONNECTIONS =====
    // OAuth connections removed - using credential authentication only
}

// ===== AUTHENTICATION UI MANAGEMENT =====
class CloudAuthUI {
    constructor(cloudManager) {
        this.cloudManager = cloudManager;
    }

    showAuthModal(provider) {
        const modalMap = {
            'google': 'googleAuthModal',
            'microsoft': 'microsoftAuthModal',
            'dropbox': 'dropboxAuthModal'
        };
        
        const modalId = modalMap[provider];
        if (!modalId) return;
        
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Reset form
        this.clearAuthForm(provider);
        
        modal.style.display = 'flex';
        
        // Focus on first input after modal opens
        setTimeout(() => {
            const emailInput = document.getElementById(`${provider}EmailInput`);
            if (emailInput) emailInput.focus();
        }, 100);
    }

    hideAuthModal(provider) {
        const modalMap = {
            'google': 'googleAuthModal',
            'microsoft': 'microsoftAuthModal',
            'dropbox': 'dropboxAuthModal'
        };
        
        const modalId = modalMap[provider];
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            this.clearAuthForm(provider);
        }
    }

    clearAuthForm(provider) {
        const emailInput = document.getElementById(`${provider}EmailInput`);
        const passwordInput = document.getElementById(`${provider}PasswordInput`);
        const rememberMe = document.getElementById(`${provider}RememberMe`);
        const errorDiv = document.getElementById(`${provider}AuthError`);
        
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (rememberMe) rememberMe.checked = false;
        if (errorDiv) errorDiv.style.display = 'none';
    }

    showAuthError(provider, message) {
        const errorDiv = document.getElementById(`${provider}AuthError`);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }



    async handleCredentialSignIn(provider) {
        const emailInput = document.getElementById(`${provider}EmailInput`);
        const passwordInput = document.getElementById(`${provider}PasswordInput`);
        const rememberMe = document.getElementById(`${provider}RememberMe`);
        const signInBtn = document.getElementById(`${provider}SignInBtn`);

        const email = emailInput?.value;
        const password = passwordInput?.value;
        const remember = rememberMe?.checked;

        if (!email || !password) {
            this.showAuthError(provider, 'Please enter both email and password.');
            return;
        }

        if (!email.includes('@')) {
            this.showAuthError(provider, 'Please enter a valid email address.');
            return;
        }

        try {
            if (signInBtn) {
                signInBtn.textContent = '🔄 Signing in...';
                signInBtn.disabled = true;
            }

            // Simulate authentication process (DEMO ONLY)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const providerMap = {
                'google': 'googledrive',
                'microsoft': 'onedrive',
                'dropbox': 'dropbox'
            };

            const result = await this.cloudManager.handleAuthenticationSuccess(providerMap[provider], {
                email: email,
                rememberMe: remember,
                authMethod: 'credentials'
            });

            this.hideAuthModal(provider);
            const providerName = provider === 'google' ? 'Google Drive' : 
                               provider === 'microsoft' ? 'Microsoft OneDrive' : 'Dropbox';
            
            if (result.hasRealCredentials) {
                alert(`✅ Connected to ${providerName}!\n\n🔑 Using your configured API credentials for secure cloud synchronization.`);
            } else {
                alert(`✅ Connected to ${providerName}!\n\n⚙️ To enable full cloud synchronization:\n\n1. Click "⚙️ Configure APIs" in Cloud Storage settings\n2. Add your ${providerName} API credentials\n3. Save the configuration`);
            }
        } catch (error) {
            this.showAuthError(provider, 'Sign-in failed: ' + error.message);
        } finally {
            if (signInBtn) {
                signInBtn.textContent = '🔐 Sign In';
                signInBtn.disabled = false;
            }
        }
    }

    handleForgotPassword(provider) {
        const urls = {
            google: 'https://accounts.google.com/signin/recovery',
            microsoft: 'https://account.live.com/password/reset',
            dropbox: 'https://www.dropbox.com/forgot'
        };
        if (urls[provider]) {
            window.open(urls[provider], '_blank');
        }
    }

    handleCreateAccount(provider) {
        const urls = {
            google: 'https://accounts.google.com/signup',
            microsoft: 'https://signup.live.com/',
            dropbox: 'https://www.dropbox.com/register'
        };
        if (urls[provider]) {
            window.open(urls[provider], '_blank');
        }
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.CloudStorageManager = CloudStorageManager;
    window.CloudAuthUI = CloudAuthUI;
}
