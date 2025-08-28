# PWA Template

A minimal, production-ready Progressive Web App template with encrypted storage and offline support.

## ✨ Features

- 🚀 **Offline Support**: Service worker for caching and offline functionality
- 🔐 **Encrypted Storage**: AES-256-GCM encryption with browser fallbacks  
- 📱 **Mobile Ready**: Responsive design for all devices
- 📲 **Installable**: Native app experience
- ⚡ **Fast Loading**: Optimized caching strategies
- 💾 **Data Management**: Save, load, export, import, and inspect data
- 🎨 **Clean UI**: Minimal, modern interface
- 🔧 **Zero Dependencies**: Pure HTML, CSS, and JavaScript

## 📁 File Structure

```
PWA Template/
├── index.html           # Main HTML file (minimal structure)
├── styles.css           # Clean, minimal CSS styles  
├── app.js              # Core PWA functionality
├── encrypted-storage.js # AES-256 encryption utilities
├── service-worker.js    # Offline caching
├── manifest.json        # PWA configuration
├── icons/              # App icons
│   ├── icon-192x192.png
│   ├── icon-512x512.png  
│   └── *.svg
├── LICENSE             # The Unlicense
├── .gitignore          # Git ignore patterns
└── README.md           # Documentation
```

## 🚀 Quick Start

1. **Clone this repository**:
   ```bash
   git clone <repository-url>
   cd pwa-template
   ```

2. **Start a local server**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**: Navigate to `http://localhost:8000`

4. **Test PWA features**:
   - 📲 Install the app (install prompt should appear)
   - 🔌 Toggle offline mode to test caching
   - 💾 Use the storage demo to save/load encrypted data
   - 📱 Test on mobile devices for full experience

## 💾 Encrypted Storage

### Basic Usage

The template includes a robust encrypted storage system with AES-256-GCM encryption:

```javascript
// Initialize storage
const storage = new EncryptedStorage();

// Save encrypted data
const myData = { message: 'Hello, secure world!', timestamp: Date.now() };
await storage.saveEncrypted('my-note', myData);

// Load encrypted data  
const loadedData = await storage.loadEncrypted('my-note');
console.log(loadedData); // { message: 'Hello, secure world!', timestamp: 1234567890 }
```

### Password Protection

```javascript
// Save with password
const sensitiveData = { 
    accountNumber: '1234-5678-9012',
    apiKey: 'secret-api-key-here'
};
await storage.saveEncrypted('sensitive-data', sensitiveData, 'myPassword123');

// Load with password (required)
const decrypted = await storage.loadEncrypted('sensitive-data', 'myPassword123');
```

### Storage Backend Options

```javascript
// Use localStorage (default)
const localStorage = new EncryptedStorage({ backend: 'localStorage' });

// Use IndexedDB for larger data
const indexedStorage = new EncryptedStorage({ backend: 'indexedDB' });

// Memory storage (session only)
const memoryStorage = new EncryptedStorage({ backend: 'memory' });
```

### Advanced Examples

```javascript
// Custom configuration
const storage = new EncryptedStorage({
    keyName: 'my-app-key',     // Custom key storage name
    backend: 'indexedDB',      // Storage backend
    keySize: 256               // AES key size (256-bit)
});

// Encrypt/decrypt without storage
const encrypted = await storage.encrypt('sensitive text', 'password');
const decrypted = await storage.decrypt(encrypted, 'password');

// Clean up all encrypted data
await storage.clearAll();
```

### Error Handling

```javascript
try {
    await storage.saveEncrypted('data-key', myData);
    console.log('Data saved successfully');
} catch (error) {
    console.error('Failed to save data:', error.message);
    // Handle encryption failure, storage quota exceeded, etc.
}

try {
    const data = await storage.loadEncrypted('data-key', 'wrongPassword');
} catch (error) {
    console.error('Failed to decrypt:', error.message);
    // Handle wrong password, corrupted data, etc.
}
```

### Browser Compatibility

The storage system automatically detects and adapts to browser capabilities:

- **Modern browsers**: Uses Web Crypto API with AES-256-GCM
- **Older browsers**: Falls back to XOR encryption  
- **Storage**: Prefers localStorage, falls back to IndexedDB, then memory
- **Encoding**: Uses TextEncoder/Decoder with fallbacks

### Storage Demo Features

The built-in demo showcases:

- **Save**: Store text or JSON with optional password encryption
- **Load**: Retrieve saved data (password required for encrypted items)  
- **Export**: Download backup file (preserves encryption)
- **Import**: Restore from backup files
- **Inspect**: View storage details and browser access instructions
- **Clear**: Remove all stored data with confirmation

### API Reference

#### Constructor Options

```javascript
const storage = new EncryptedStorage({
    keyName: 'pwa-encryption-key',  // Key storage identifier
    backend: 'localStorage',        // 'localStorage' | 'indexedDB' | 'memory'
    keySize: 256                    // AES key size: 128, 192, or 256 bits
});
```

#### Core Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `saveEncrypted(key, data, password?)` | Save encrypted data | `key`: string, `data`: any, `password`: string? | `Promise<boolean>` |
| `loadEncrypted(key, password?)` | Load and decrypt data | `key`: string, `password`: string? | `Promise<any \| null>` |
| `encrypt(data, password?)` | Encrypt data without saving | `data`: any, `password`: string? | `Promise<string>` |
| `decrypt(encryptedData, password?)` | Decrypt data | `encryptedData`: string, `password`: string? | `Promise<any>` |
| `clearAll()` | Remove all encrypted data | none | `Promise<boolean>` |

#### Utility Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `generateAndStoreKey(password?)` | Generate new encryption key | `Promise<Array<number>>` |
| `isWebCryptoAvailable()` | Check Web Crypto API support | `boolean` |
| `isLocalStorageAvailable()` | Check localStorage support | `boolean` |
| `isIndexedDBAvailable()` | Check IndexedDB support | `boolean` |

#### Feature Detection

```javascript
// Check what features are available
console.log(storage.features);
// {
//     webCrypto: true,      // Web Crypto API available
//     localStorage: true,   // localStorage available  
//     indexedDB: true,      // IndexedDB available
//     textEncoder: true     // TextEncoder available
// }

// Check encryption method being used
console.log(storage.encryptionMethod); // 'webcrypto' or 'simple'
```

## PWA Requirements Met

✅ **HTTPS**: Required for production (localhost works for development)  
✅ **Web App Manifest**: `manifest.json` with proper configuration  
✅ **Service Worker**: Handles caching and offline functionality  
✅ **Icons**: Multiple sizes for different platforms  
✅ **Responsive Design**: Works on all screen sizes  
✅ **Fast Loading**: Service worker caching strategy  

## 🛠️ Customization

### Quick Start Customization
1. **App Name**: Update `manifest.json` and `index.html` title
2. **Colors**: Modify gradient colors in `styles.css` 
3. **Icons**: Replace files in `icons/` directory
4. **Cache**: Update file list in `service-worker.js`

### Key Files to Modify
- `manifest.json`: App metadata and configuration
- `styles.css`: Colors, fonts, and layout
- `index.html`: App structure and meta tags
- `service-worker.js`: Caching strategy and file list

## Browser Support

- ✅ Chrome/Chromium (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Edge (full support)
- ⚠️ Internet Explorer (limited support)

## 🚀 Deployment

1. **Deploy to HTTPS** (required for PWA features)
2. **Test offline functionality** 
3. **Verify installation** works on target devices
4. **Run Lighthouse audit** for PWA compliance
5. **Update cache version** in service worker when deploying changes

## 🧪 Development

- **DevTools**: Use Application tab to debug PWA features
- **Offline Testing**: Toggle network in DevTools
- **PWA Audit**: Run Lighthouse for compliance check  
- **Installation**: Test on mobile devices for full experience
- **Cache Updates**: Increment `CACHE_NAME` when updating files

## License

This project is released into the public domain under [The Unlicense](https://unlicense.org). You are free to use, modify, distribute, or sell this software for any purpose without restriction.
