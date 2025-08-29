# Local Development Guide

## 🚀 Running the App Locally

The Productivity Suite app needs to be served over HTTP/HTTPS to work properly. Running it directly from the file system (`file://` protocol) will cause several issues:

### ❌ Problems with `file://` Protocol
- **CORS Errors**: Cannot make cross-origin requests to cloud providers
- **Service Worker**: Cannot register service workers
- **Security Restrictions**: Many browser APIs are blocked
- **Cloud Detection**: Cloud provider detection will fail

### ✅ Solutions

#### Option 1: Python HTTP Server (Recommended)
```bash
# Navigate to the project directory
cd productivity-tools

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Then open: http://localhost:8000
```

#### Option 2: Node.js HTTP Server
```bash
# Install serve globally (if not already installed)
npm install -g serve

# Serve the current directory
serve . -p 8000

# Then open: http://localhost:8000
```

#### Option 3: Live Server (VS Code Extension)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. The app will open automatically in your browser

#### Option 4: PHP Development Server
```bash
# If you have PHP installed
php -S localhost:8000

# Then open: http://localhost:8000
```

## 🔧 Development Features

When running locally over HTTP, you'll have access to:

### ✅ Working Features
- **Full Cloud Sync**: Cloud provider detection and sync will work
- **Service Worker**: Offline functionality and PWA features
- **All APIs**: File System Access API and other browser APIs
- **CORS-Free**: No cross-origin restrictions
- **Auto-Sync**: Background sync will function properly

### 🧪 Testing Cloud Sync

1. **Start the local server** using one of the methods above
2. **Open the app** at `http://localhost:8000`
3. **Go to Settings** → Cloud Storage & Sync
4. **Sign into your cloud provider** (Google Drive, OneDrive, Dropbox) in your browser
5. **Click "Connect to Cloud Storage"** to test the enhanced sync features

### 🌐 Browser Testing

Test the enhanced cloud sync with different browsers:

- **Chrome**: Will prioritize Google Drive
- **Edge**: Will prioritize OneDrive  
- **Firefox**: Will prioritize Dropbox
- **Safari**: Will prioritize iCloud

## 🐛 Debugging

### Console Messages
When running locally, you'll see helpful console messages:
- `Running locally - skipping [Provider] detection` (when using file://)
- `Cloud detection disabled locally` (in the UI)
- `Version 1.0.0 (Local Development)` (in settings)

### Common Issues

#### "ServiceWorker registration failed"
- **Cause**: Running with `file://` protocol
- **Solution**: Use HTTP server (see options above)

#### "CORS policy blocked"
- **Cause**: Cross-origin requests from `file://` protocol
- **Solution**: Use HTTP server (see options above)

#### "Cloud detection disabled locally"
- **Cause**: Running with `file://` protocol
- **Solution**: Use HTTP server to enable cloud features

## 📱 PWA Testing

To test Progressive Web App features:

1. **Use HTTPS or localhost** (PWA features require secure context)
2. **Install the app** using browser's install prompt
3. **Test offline functionality** by disabling network
4. **Verify service worker** in browser DevTools

## 🔒 Security Notes

- **Local Development**: The app runs in a secure context when served over HTTP
- **Cloud Sync**: Only works when served over HTTP/HTTPS
- **File Access**: File System Access API requires secure context
- **Service Worker**: Requires secure context for registration

## 🚀 Production Deployment

When ready to deploy:

1. **Upload to HTTPS server** (GitHub Pages, Netlify, Vercel, etc.)
2. **All features will work** including cloud sync
3. **PWA features** will be fully functional
4. **Cloud detection** will work automatically

---

**Happy coding!** 🎉
