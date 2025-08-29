# Productivity Suite

A comprehensive Progressive Web App combining multiple productivity tools with encrypted storage, cloud sync, and offline support.

## ✨ Features

- 📝 **Notes Management**: Rich text editor with markdown support and organization
- 🕒 **Pomodoro Timer**: Focus sessions with customizable work/break intervals
- ☑️ **Smart Checklists**: Task management with priority levels and completion tracking
- 📊 **Eisenhower Matrix**: Task prioritization using the urgent/important framework
- 📅 **Calendar & Events**: Full-featured calendar with event management and scheduling
- ☁️ **Cloud Sync**: Automatic synchronization with Google Drive, OneDrive, and Dropbox
- 🔐 **Encrypted Storage**: AES-256-GCM encryption for all your data
- 📱 **Mobile Ready**: Responsive design optimized for all devices
- 📲 **Installable**: Works as a native app experience
- ⚡ **Fast & Offline**: Service worker caching for offline functionality
- 🎨 **Modern UI**: Clean, intuitive interface with dark/light theme support
- 🔧 **Zero Dependencies**: Pure HTML, CSS, and JavaScript

## 🛠️ Tools Included

### 📝 Notes System
- **Rich Text Editor**: Full-featured markdown editor with live preview
- **Notes List**: Organize and search through all your notes
- **Categories & Tags**: Flexible organization system
- **Export/Import**: Backup and restore your notes
- **Encryption**: Optional password protection for sensitive notes

### 🕒 Pomodoro Timer
- **Customizable Sessions**: Set your own work and break durations
- **Visual Progress**: Clean countdown with progress indicators
- **Audio Notifications**: Configurable sound alerts
- **Session Tracking**: Monitor your productivity sessions
- **Auto-Start Options**: Seamless transitions between work and breaks

### ☑️ Checklist Manager
- **Smart Task Lists**: Create and manage multiple checklists
- **Priority Levels**: High, medium, low priority classification
- **Due Dates**: Set deadlines and get reminders
- **Progress Tracking**: Visual completion indicators
- **Categories**: Organize tasks by project or context

### 📊 Eisenhower Matrix
- **Quadrant System**: Organize tasks by urgency and importance
- **Drag & Drop**: Easy task movement between quadrants
- **Color Coding**: Visual priority identification
- **Action Planning**: Built-in guidance for each quadrant
- **Export Views**: Save your matrix as images or data

### 📅 Calendar & Event Manager
- **Full Calendar View**: Monthly, weekly, and daily calendar views
- **Event Management**: Create, edit, and delete events with rich details
- **Priority System**: High, medium, low priority events with color coding
- **Recurring Events**: Set up repeating events and schedules
- **Event Categories**: Organize events by type (work, personal, meetings, etc.)
- **Time Slots**: Drag and drop events in weekly view
- **Search & Filter**: Find events quickly with search and filtering
- **Export Options**: Export calendar data and event lists

### ☁️ Cloud Storage & Sync
- **Smart Browser Detection**: Automatically detects your browser and preferred cloud provider
- **Multi-Provider Support**: Works with Google Drive (Chrome), OneDrive (Edge), Dropbox, iCloud (Safari)
- **Browser-Native Sync**: Uses File System Access API for seamless integration
- **Background Auto-Sync**: Continuous synchronization running in background iframe
- **Automatic Sync**: Set up automatic synchronization every 5-60 minutes with initial sync delay
- **Encrypted Sync**: All data encrypted before syncing to cloud
- **Complete Backup**: Full export of all productivity tools data
- **Cross-Device Access**: Access your data from any device with cloud sync
- **Offline Support**: Works offline with sync when connection is restored
- **Conflict Resolution**: Smart handling of data conflicts during sync
- **Status Indicators**: Real-time sync status displayed in main app
- **Provider Optimization**: Chrome → Google Drive, Edge → OneDrive, Safari → iCloud, Firefox → Dropbox

### ⚙️ Settings & Data Management
- **Theme Selection**: Light, dark, and auto modes
- **Data Export**: Complete backup of all your data
- **Import Tools**: Restore from previous backups
- **Storage Inspector**: View and manage encrypted data
- **Security Settings**: Configure encryption and passwords
- **Cloud Settings**: Manage sync preferences and cloud connections

## 📁 Project Structure

```
productivity-tools/
├── index.html              # Main app shell with navigation
├── styles.css              # Global styles and themes
├── app.js                  # Core app functionality and routing
├── encrypted-storage.js    # AES-256 encryption utilities
├── cloud-auth.js           # Cloud storage sync manager
├── service-worker.js       # Offline caching and PWA features
├── manifest.json           # PWA configuration
├── notes-list.html         # Notes management interface
├── note-editor.html        # Rich text note editor
├── pomodoro.html           # Pomodoro timer tool
├── checklist.html          # Task and checklist manager
├── eisenhower.html         # Eisenhower Matrix interface
├── calendar.html           # Calendar and event manager
├── settings.html           # Settings and data management
├── icons/                  # App icons and graphics
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── *.svg
├── LICENSE                 # The Unlicense
└── README.md              # This documentation
```

## 🚀 Quick Start

1. **Access Online**: Visit the [live app](https://your-username.github.io/productivity-tools)

2. **Install as App**:
   - **Desktop**: Click the install button in your browser's address bar
   - **Mobile**: Use "Add to Home Screen" from your browser menu

3. **Local Development**:
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd productivity-tools
   
   # Start a local server
   python -m http.server 8000
   # or
   npx serve .
   
   # Open http://localhost:8000
   ```

4. **Start Being Productive**:
   - 📝 Create your first note in the Notes section
   - 🕒 Start a Pomodoro session to focus
   - ☑️ Add tasks to your checklist
   - 📊 Organize priorities in the Eisenhower Matrix

## 💾 Data Security & Storage

### Encrypted Storage
All your data is encrypted using AES-256-GCM encryption before being stored locally or synced to cloud:

```javascript
// Your data is automatically encrypted
const notes = await storage.loadEncrypted('notes');
await storage.saveEncrypted('notes', updatedNotes);

// Optional password protection for extra security
await storage.saveEncrypted('sensitive-note', data, 'your-password');

// Cloud sync with encryption
await cloudManager.syncToCloud(); // Automatically encrypts before sync
```

### Privacy First
- **Local Storage**: All data stays on your device
- **No Tracking**: No analytics or user tracking
- **Offline Capable**: Works completely offline
- **Export Control**: You own and control your data

### Backup & Restore
- **Full Export**: Download all your data as encrypted backup
- **Selective Export**: Export specific tools or date ranges
- **Easy Import**: Restore from backup files
- **Cross-Device**: Move your data between devices securely
- **Cloud Sync**: Automatic backup to Google Drive, OneDrive, or Dropbox
- **Auto-Sync**: Set up automatic synchronization every 5-60 minutes
- **Conflict Resolution**: Smart handling of data conflicts during sync

## 📱 Progressive Web App Features

✅ **Installable**: Add to home screen on any device  
✅ **Offline Support**: Works without internet connection  
✅ **Fast Loading**: Cached for instant startup  
✅ **Native Feel**: App-like experience and navigation  
✅ **Responsive**: Optimized for mobile, tablet, and desktop  
✅ **Secure**: HTTPS required, encrypted storage  

## 🎯 Usage Tips

### Getting Started
1. **Begin with Notes**: Start by creating some notes to get familiar
2. **Try Pomodoro**: Use the timer for focused work sessions
3. **Plan with Matrix**: Use Eisenhower Matrix for task prioritization
4. **Track with Checklists**: Manage daily tasks and projects
5. **Schedule with Calendar**: Add events and manage your schedule
6. **Set up Cloud Sync**: Connect to your cloud storage for backup and cross-device access

### Best Practices
- **Regular Backups**: Export your data weekly or enable cloud sync for automatic backups
- **Use Categories**: Organize notes, tasks, and events by project
- **Set Passwords**: Use password protection for sensitive data
- **Customize Settings**: Adjust themes, timer preferences, and sync frequency
- **Stay Focused**: Use Pomodoro technique for better concentration
- **Calendar Integration**: Sync your calendar with other productivity tools
- **Cloud Sync**: Enable automatic sync for seamless cross-device access

### Keyboard Shortcuts
- **Ctrl/Cmd + S**: Save current item
- **Ctrl/Cmd + N**: Create new item
- **Ctrl/Cmd + E**: Export data
- **Ctrl/Cmd + /**: Search/filter
- **Esc**: Close modals and return to main view

## 🛠️ Customization

### Themes
- **Light Mode**: Clean, minimal design
- **Dark Mode**: Easy on the eyes for long sessions
- **Auto Mode**: Follows system preference

### Pomodoro Settings
- **Work Duration**: Default 25 minutes (customizable)
- **Short Break**: Default 5 minutes (customizable)
- **Long Break**: Default 15 minutes (customizable)
- **Auto-Start**: Automatic session transitions

### Data Management
- **Storage Backend**: Automatically selects best available option
- **Encryption Level**: AES-256-GCM with fallbacks
- **Export Formats**: JSON, CSV, and encrypted backups
- **Cloud Providers**: Google Drive, OneDrive, Dropbox, and any cloud storage
- **Sync Frequency**: Configurable from 5 minutes to 1 hour
- **Calendar Views**: Monthly, weekly, and daily calendar layouts

## 🌐 Browser Support

- ✅ **Chrome/Chromium**: Full support with all features
- ✅ **Firefox**: Complete compatibility
- ✅ **Safari**: Full support including iOS
- ✅ **Edge**: Modern Edge with full PWA support
- ⚠️ **Older Browsers**: Basic functionality with encryption fallbacks

## 🚀 Deployment

The app is designed to work on any web server supporting HTTPS:

1. **GitHub Pages**: Automatic deployment from main branch
2. **Netlify/Vercel**: Drop the folder for instant deployment
3. **Your Server**: Upload files to any HTTPS-enabled web server

### Deploy to GitHub Pages
1. Fork or clone this repository
2. Enable GitHub Pages in repository settings
3. Select "Deploy from branch" and choose `main` branch
4. Your app will be available at `https://username.github.io/productivity-tools`

## 🔧 Development

### Adding New Tools
1. Create a new HTML file for your tool (e.g., `my-tool.html`)
2. Add navigation button in `index.html`
3. Update the routing in `app.js`
4. Add styles in `styles.css`
5. Update service worker cache list
6. Integrate with cloud sync in `cloud-auth.js` if needed

### Modifying Existing Tools
- Each tool is self-contained in its HTML file
- Shared functionality is in `app.js` and `encrypted-storage.js`
- Styles are organized by component in `styles.css`

### Testing
- Use browser DevTools Application tab for PWA debugging
- Test offline functionality by disabling network
- Run Lighthouse audit for performance and PWA compliance
- Test installation on various devices and browsers

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify, distribute, or sell this software for any purpose, provided that the original copyright and license notice are included.

## 🤝 Contributing

This productivity suite is designed to be simple and focused. If you'd like to contribute:

1. Keep tools simple and focused on core functionality
2. Maintain the encrypted storage pattern
3. Ensure mobile responsiveness
4. Follow the existing UI/UX patterns
5. Test across different browsers and devices

---

**Start boosting your productivity today!** 🚀