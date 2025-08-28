// Encrypted Storage for PWAs - Maximum Browser Compatibility
// Uses Web Crypto API with fallbacks for universal support

class EncryptedStorage {
    constructor(options = {}) {
        this.keyName = options.keyName || 'pwa-encryption-key';
        this.storageBackend = options.backend || 'localStorage'; // localStorage, indexedDB, memory
        this.keySize = options.keySize || 256; // AES key size in bits
        this.ivSize = 12; // GCM IV size in bytes
        
        // Feature detection
        this.features = {
            webCrypto: this.isWebCryptoAvailable(),
            localStorage: this.isLocalStorageAvailable(),
            indexedDB: this.isIndexedDBAvailable(),
            textEncoder: typeof TextEncoder !== 'undefined'
        };
        
        // Choose best available encryption method
        this.encryptionMethod = this.features.webCrypto ? 'webcrypto' : 'simple';
    }

    // Feature Detection
    isWebCryptoAvailable() {
        return typeof crypto !== 'undefined' && 
               crypto.subtle !== undefined &&
               typeof crypto.getRandomValues === 'function';
    }

    isLocalStorageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    isIndexedDBAvailable() {
        return typeof indexedDB !== 'undefined';
    }

    // === WEB CRYPTO API IMPLEMENTATION (Modern Browsers) ===
    
    async generateKey() {
        if (!this.features.webCrypto) {
            throw new Error('Web Crypto API not available');
        }

        const key = await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: this.keySize
            },
            true, // extractable
            ['encrypt', 'decrypt']
        );

        return key;
    }

    async exportKey(key) {
        if (!this.features.webCrypto) {
            throw new Error('Web Crypto API not available');
        }

        const exported = await crypto.subtle.exportKey('raw', key);
        return Array.from(new Uint8Array(exported));
    }

    async importKey(keyData) {
        if (!this.features.webCrypto) {
            throw new Error('Web Crypto API not available');
        }

        const key = await crypto.subtle.importKey(
            'raw',
            new Uint8Array(keyData),
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );

        return key;
    }

    async encryptWithWebCrypto(data, key) {
        if (!this.features.webCrypto) {
            throw new Error('Web Crypto API not available');
        }

        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(this.ivSize));
        
        // Convert string to bytes
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(data);

        // Encrypt
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            dataBytes
        );

        // Combine IV and encrypted data
        const result = new Uint8Array(iv.length + encrypted.byteLength);
        result.set(iv);
        result.set(new Uint8Array(encrypted), iv.length);

        // Convert to base64 for storage
        return this.arrayBufferToBase64(result);
    }

    async decryptWithWebCrypto(encryptedData, key) {
        if (!this.features.webCrypto) {
            throw new Error('Web Crypto API not available');
        }

        // Convert from base64
        const combined = this.base64ToArrayBuffer(encryptedData);
        
        // Extract IV and encrypted data
        const iv = combined.slice(0, this.ivSize);
        const encrypted = combined.slice(this.ivSize);

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encrypted
        );

        // Convert bytes back to string
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    // === SIMPLE XOR ENCRYPTION (Fallback for older browsers) ===
    
    generateSimpleKey() {
        const key = [];
        for (let i = 0; i < 32; i++) {
            key.push(Math.floor(Math.random() * 256));
        }
        return key;
    }

    encryptSimple(data, key) {
        const dataBytes = this.stringToBytes(data);
        const encrypted = [];
        
        for (let i = 0; i < dataBytes.length; i++) {
            encrypted.push(dataBytes[i] ^ key[i % key.length]);
        }
        
        return this.bytesToBase64(encrypted);
    }

    decryptSimple(encryptedData, key) {
        const encrypted = this.base64ToBytes(encryptedData);
        const decrypted = [];
        
        for (let i = 0; i < encrypted.length; i++) {
            decrypted.push(encrypted[i] ^ key[i % key.length]);
        }
        
        return this.bytesToString(decrypted);
    }

    // === UNIFIED API ===

    async generateAndStoreKey(password) {
        let key;
        
        if (this.encryptionMethod === 'webcrypto') {
            // Generate secure key
            const cryptoKey = await this.generateKey();
            key = await this.exportKey(cryptoKey);
            
            // Derive key from password if provided
            if (password) {
                key = await this.deriveKeyFromPassword(password);
            }
        } else {
            // Generate simple key
            key = this.generateSimpleKey();
            
            // XOR with password if provided
            if (password) {
                const passwordBytes = this.stringToBytes(password);
                for (let i = 0; i < key.length; i++) {
                    key[i] ^= passwordBytes[i % passwordBytes.length];
                }
            }
        }

        // Store key securely
        await this.storeKey(key);
        return key;
    }

    async deriveKeyFromPassword(password) {
        if (!this.features.webCrypto) {
            // Simple password-based key for fallback
            const key = [];
            const passwordBytes = this.stringToBytes(password);
            for (let i = 0; i < 32; i++) {
                key.push(passwordBytes[i % passwordBytes.length] ^ (i * 17));
            }
            return key;
        }

        // Use PBKDF2 for secure key derivation
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const salt = encoder.encode('pwa-salt-' + window.location.hostname);

        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: this.keySize },
            true,
            ['encrypt', 'decrypt']
        );

        return await this.exportKey(derivedKey);
    }

    async storeKey(key) {
        const keyData = JSON.stringify(key);
        
        try {
            if (this.features.localStorage) {
                localStorage.setItem(this.keyName, keyData);
            } else if (this.features.indexedDB) {
                await this.storeInIndexedDB(this.keyName, keyData);
            } else {
                // Memory fallback
                window._encryptionKey = keyData;
            }
        } catch (error) {
            console.error('Failed to store encryption key:', error);
            throw error;
        }
    }

    async loadKey() {
        try {
            let keyData;
            
            if (this.features.localStorage) {
                keyData = localStorage.getItem(this.keyName);
            } else if (this.features.indexedDB) {
                keyData = await this.loadFromIndexedDB(this.keyName);
            } else {
                // Memory fallback
                keyData = window._encryptionKey;
            }
            
            return keyData ? JSON.parse(keyData) : null;
        } catch (error) {
            console.error('Failed to load encryption key:', error);
            return null;
        }
    }

    async encrypt(data, password = null) {
        try {
            // Get or generate key
            let key = await this.loadKey();
            if (!key || password) {
                key = await this.generateAndStoreKey(password);
            }

            // Convert data to string if it's an object
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);

            // Encrypt based on available method
            if (this.encryptionMethod === 'webcrypto') {
                const cryptoKey = await this.importKey(key);
                return await this.encryptWithWebCrypto(dataString, cryptoKey);
            } else {
                return this.encryptSimple(dataString, key);
            }
        } catch (error) {
            console.error('Encryption failed:', error);
            throw error;
        }
    }

    async decrypt(encryptedData, password = null) {
        try {
            // Get key
            let key = await this.loadKey();
            if (!key && password) {
                key = await this.generateAndStoreKey(password);
            }
            
            if (!key) {
                throw new Error('No encryption key available');
            }

            // Decrypt based on available method
            let decryptedString;
            if (this.encryptionMethod === 'webcrypto') {
                const cryptoKey = await this.importKey(key);
                decryptedString = await this.decryptWithWebCrypto(encryptedData, cryptoKey);
            } else {
                decryptedString = this.decryptSimple(encryptedData, key);
            }

            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(decryptedString);
            } catch (e) {
                return decryptedString;
            }
        } catch (error) {
            console.error('Decryption failed:', error);
            throw error;
        }
    }

    // === STORAGE METHODS ===

    async saveEncrypted(key, data, password = null) {
        try {
            const encrypted = await this.encrypt(data, password);
            
            // Save to chosen backend
            if (this.features.localStorage && this.storageBackend === 'localStorage') {
                localStorage.setItem(key, encrypted);
            } else if (this.features.indexedDB && this.storageBackend === 'indexedDB') {
                await this.storeInIndexedDB(key, encrypted);
            } else {
                // Memory fallback
                if (!window._encryptedStorage) window._encryptedStorage = {};
                window._encryptedStorage[key] = encrypted;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save encrypted data:', error);
            return false;
        }
    }

    async loadEncrypted(key, password = null) {
        try {
            let encrypted;
            
            // Load from chosen backend
            if (this.features.localStorage && this.storageBackend === 'localStorage') {
                encrypted = localStorage.getItem(key);
            } else if (this.features.indexedDB && this.storageBackend === 'indexedDB') {
                encrypted = await this.loadFromIndexedDB(key);
            } else {
                // Memory fallback
                encrypted = window._encryptedStorage && window._encryptedStorage[key];
            }
            
            if (!encrypted) {
                return null;
            }
            
            const decrypted = await this.decrypt(encrypted, password);
            return decrypted;
        } catch (error) {
            console.error('Failed to load encrypted data:', error);
            return null;
        }
    }

    // === UTILITY METHODS ===

    // IndexedDB helpers
    async storeInIndexedDB(key, data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EncryptedStorage', 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('encrypted')) {
                    db.createObjectStore('encrypted');
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['encrypted'], 'readwrite');
                const store = transaction.objectStore('encrypted');
                const putRequest = store.put(data, key);
                
                putRequest.onsuccess = () => resolve(true);
                putRequest.onerror = () => reject(putRequest.error);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async loadFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EncryptedStorage', 1);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['encrypted'], 'readonly');
                const store = transaction.objectStore('encrypted');
                const getRequest = store.get(key);
                
                getRequest.onsuccess = () => resolve(getRequest.result || null);
                getRequest.onerror = () => reject(getRequest.error);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // Base64 conversion helpers
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        return btoa(String.fromCharCode(...bytes));
    }

    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    bytesToBase64(bytes) {
        return btoa(String.fromCharCode(...bytes));
    }

    base64ToBytes(base64) {
        const binaryString = atob(base64);
        const bytes = [];
        for (let i = 0; i < binaryString.length; i++) {
            bytes.push(binaryString.charCodeAt(i));
        }
        return bytes;
    }

    stringToBytes(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i) & 0xFF);
        }
        return bytes;
    }

    bytesToString(bytes) {
        return String.fromCharCode(...bytes);
    }

    // Clean up
    async clearAll() {
        try {
            if (this.features.localStorage) {
                localStorage.removeItem(this.keyName);
                // Remove all encrypted data
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('encrypted-')) {
                        localStorage.removeItem(key);
                    }
                });
            }
            
            if (this.features.indexedDB) {
                const deleteRequest = indexedDB.deleteDatabase('EncryptedStorage');
                await new Promise((resolve) => {
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => resolve();
                });
            }
            
            // Clear memory storage
            delete window._encryptionKey;
            delete window._encryptedStorage;
            
            return true;
        } catch (error) {
            console.error('Failed to clear encrypted data:', error);
            return false;
        }
    }
}

// Simple demo function for testing
async function testEncryption() {
    const storage = new EncryptedStorage();
    
    // Simple test data
    const testData = {
        message: 'This is encrypted data!',
        timestamp: new Date().toISOString(),
        sensitive: 'Secret information'
    };
    
    // Test save and load
    const saved = await storage.saveEncrypted('test-note', testData);
    const loaded = await storage.loadEncrypted('test-note');
    
    return { saved, loaded, original: testData };
}

// Make available globally
window.EncryptedStorage = EncryptedStorage;
window.testEncryption = testEncryption;

// Export for module use (commented out for regular script loading)
// export { EncryptedStorage, testEncryption };
