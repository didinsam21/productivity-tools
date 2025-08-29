// Productivity Suite Hub - Main Application Logic

class ProductivitySuite {
    constructor() {
        this.currentTool = 'notes-list';
        this.isMobile = window.innerWidth <= 768;
        this.storage = null;
        this.deferredPrompt = null;
        this.needsNotesRefresh = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
            this.init();
        }
    }

    async init() {
        try {
            await this.initStorage();
            this.initPWA();
            this.setupEventListeners();
            
            // Preload critical tools first
            this.preloadCriticalTools();
            
            // Then switch to the default tool
            this.switchTool(this.currentTool);
            this.updateStorageStatus();
            this.updateStatus('Productivity Suite loaded successfully!', 'success');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.updateStatus('Failed to initialize app: ' + error.message, 'error');
        }
    }

    async initStorage() {
        try {
            if (typeof EncryptedStorage !== 'undefined') {
                this.storage = new EncryptedStorage();
                console.log('Encrypted storage initialized');
            } else {
                this.storage = {
                    async saveEncrypted(key, data) {
                        localStorage.setItem(key, JSON.stringify(data));
                return true;
                    },
                    async loadEncrypted(key) {
                        const data = localStorage.getItem(key);
                        return data ? JSON.parse(data) : null;
                    },
                    async clearAll() {
                        localStorage.clear();
                        return true;
                    }
                };
                console.log('Fallback storage initialized');
            }
        } catch (error) {
            console.error('Storage initialization failed:', error);
            throw error;
        }
    }

    initPWA() {
        this.registerServiceWorker();
        this.setupPWAInstallPrompt();
        this.setupOnlineOfflineHandlers();
    }

    setupEventListeners() {
        // Navigation event listeners
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.switchTool(tool);
            });
        });

        // Window resize handler for mobile detection
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
        });

        // Listen for messages from iframes (settings tool install button, tool switching)
        window.addEventListener('message', (event) => {
            if (event.data && event.data.action === 'install-app') {
                this.installApp();
            } else if (event.data && event.data.action === 'switch-tool') {
                this.switchTool(event.data.tool);
                
                // If switching to note-editor with a specific note, forward the message
                if (event.data.tool === 'note-editor' && event.data.editNoteId) {
                    setTimeout(() => {
                        const editorIframe = document.getElementById('iframe-note-editor');
                        if (editorIframe && editorIframe.contentWindow) {
                            console.log('📤 Forwarding edit note message to editor:', event.data.editNoteId);
                            editorIframe.contentWindow.postMessage({
                                action: 'load-note',
                                noteId: event.data.editNoteId
                            }, '*');
                        }
                    }, 100); // Small delay to ensure iframe is visible
                }
                
                // If switching to notes-list, trigger refresh
                if (event.data.tool === 'notes-list') {
                    this.needsNotesRefresh = true;
                    setTimeout(() => {
                        if (this.needsNotesRefresh) {
                            const notesIframe = document.getElementById('iframe-notes-list');
                            if (notesIframe && notesIframe.contentWindow) {
                                console.log('🔄 Triggering notes list refresh');
                                notesIframe.contentWindow.postMessage({
                                    action: 'refresh-notes'
                                }, '*');
                                this.needsNotesRefresh = false;
                            }
                        }
                    }, 100);
                }
            } else if (event.data && event.data.action === 'note-modified') {
                // Mark that notes list needs refresh next time it's shown
                console.log('📝 Note modified, marking for refresh:', event.data.noteId);
                this.needsNotesRefresh = true;
            }
            // Global timer modal removed - using standard notifications now
        });
    }

    switchTool(toolName) {
        if (!toolName) return;
        
        this.currentTool = toolName;
        
        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tool === toolName) {
                item.classList.add('active');
            }
        });

        // Load tool in iframe
        this.loadToolInIframe(toolName);
        
        // If switching to notes-list and it needs refresh, trigger it
        if (toolName === 'notes-list' && this.needsNotesRefresh) {
            setTimeout(() => {
                const notesIframe = document.getElementById('iframe-notes-list');
                if (notesIframe && notesIframe.contentWindow) {
                    console.log('🔄 Auto-refreshing notes list on switch');
                    notesIframe.contentWindow.postMessage({
                        action: 'refresh-notes'
                    }, '*');
                    this.needsNotesRefresh = false;
                }
            }, 200); // Slightly longer delay for direct switches
        }
        
        this.updateStatus(`Loaded ${toolName} tool`, 'success');
    }

    loadToolInIframe(toolName) {
        const mainContent = document.getElementById('app-main');
        if (!mainContent) return;

        // Map tool names to HTML files
        const toolFiles = {
            'notes-list': 'notes-list.html',
            'note-editor': 'note-editor.html',
            'pomodoro': 'pomodoro.html',
            'checklist': 'checklist.html',
            'eisenhower': 'eisenhower.html',
            'calendar': 'calendar.html',
            'settings': 'settings.html'
        };

        const filename = toolFiles[toolName];
        if (!filename) {
            console.error(`Unknown tool: ${toolName}`);
            return;
        }
        
        // Always ensure critical tools (notes-list and note-editor) are preloaded
        this.preloadCriticalTools();
        
        // Check if iframe already exists
        const existingIframe = document.getElementById(`iframe-${toolName}`);
        
        if (existingIframe) {
            // Hide all iframes and show the requested one
            this.hideAllIframes();
            existingIframe.style.display = 'block';
            console.log(`Showing existing iframe for ${toolName}`);
        } else {
            // Create new iframe
            const iframe = document.createElement('iframe');
            iframe.id = `iframe-${toolName}`;
            iframe.src = filename;
            iframe.title = `${toolName} tool`;
            iframe.style.cssText = 'width: 100%; height: calc(100vh - 76px); border: none; display: block;';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups');
            
            // Hide all existing iframes and add the new one
            this.hideAllIframes();
            mainContent.appendChild(iframe);
            console.log(`Created new iframe for ${toolName}`);
        }
    }

    preloadCriticalTools() {
        const mainContent = document.getElementById('app-main');
        if (!mainContent) return;

        const criticalTools = ['notes-list', 'note-editor'];
        
        criticalTools.forEach(toolName => {
            const existingIframe = document.getElementById(`iframe-${toolName}`);
            if (!existingIframe) {
                console.log(`Preloading critical tool: ${toolName}`);
                
                const toolFiles = {
                    'notes-list': 'notes-list.html',
                    'note-editor': 'note-editor.html'
                };
                
                const iframe = document.createElement('iframe');
                iframe.id = `iframe-${toolName}`;
                iframe.src = toolFiles[toolName];
                iframe.title = `${toolName} tool`;
                iframe.style.cssText = 'width: 100%; height: calc(100vh - 76px); border: none; display: none;';
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups');
                
                mainContent.appendChild(iframe);
            }
        });
    }

    hideAllIframes() {
        const mainContent = document.getElementById('app-main');
        const iframes = mainContent.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            iframe.style.display = 'none';
        });
    }

    updateStorageStatus() {
        const statusElements = document.querySelectorAll('#storage-status');
        statusElements.forEach(element => {
            if (element) {
                element.textContent = 'Auto-saving enabled';
            }
        });
    }

    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'status';
            }, 3000);
        }
    }

    // PWA Functions
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./service-worker.js');
                console.log('Service Worker registered:', registration);
                this.updateStatus('App ready for offline use', 'success');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
                this.updateStatus('Offline features unavailable', 'warning');
            }
        }
    }

    setupPWAInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            const installBtns = document.querySelectorAll('#install-btn');
            installBtns.forEach(btn => {
                if (btn) {
                    btn.style.display = 'inline-flex';
                    btn.textContent = '📱 Install App';
                }
            });
        });

        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.updateStatus('App installed successfully!', 'success');
            
            const installBtns = document.querySelectorAll('#install-btn');
            installBtns.forEach(btn => {
                if (btn) btn.style.display = 'none';
            });
        });
    }

    async installApp() {
        if (!this.deferredPrompt) {
            this.updateStatus('App installation not available', 'warning');
        return;
    }
    
    try {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                this.updateStatus('App installation started...', 'info');
        } else {
                this.updateStatus('App installation cancelled', 'warning');
        }
            
            this.deferredPrompt = null;
    } catch (error) {
            console.error('Installation failed:', error);
            this.updateStatus('Installation failed: ' + error.message, 'error');
        }
    }

    setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => {
            this.updateStatus('Back online!', 'success');
        });

        window.addEventListener('offline', () => {
            this.updateStatus('Working offline', 'warning');
        });
    }

    // Global data management functions (for settings tool)
    async exportAllData() {
        try {
            const allData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                app: 'Productivity Suite',
                tools: {}
            };

            // Export data from all tools
            const toolKeys = [
                { key: 'notebook-data', name: 'notes' },
                { key: 'pomodoro-data', name: 'pomodoro' },
                { key: 'checklist-data', name: 'checklist' },
                { key: 'eisenhower-data', name: 'eisenhower' },
                { key: 'calendar-data', name: 'calendar' }
            ];

            for (const {key, name} of toolKeys) {
                try {
                    const data = await this.storage.loadEncrypted(key);
                    if (data) {
                        allData.tools[name] = data;
                    }
                } catch (error) {
                    console.error(`Error exporting ${name}:`, error);
                }
            }

            // Create and download file
            const blob = new Blob([JSON.stringify(allData, null, 2)], { 
            type: 'application/json' 
        });
            
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
            a.download = `productivity-suite-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
            this.updateStatus('All data exported successfully!', 'success');
    } catch (error) {
            console.error('Export failed:', error);
            this.updateStatus('Export failed: ' + error.message, 'error');
        }
    }

    async importAllData() {
        try {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
            
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    const data = JSON.parse(text);

                    if (!data.tools) {
                        throw new Error('Invalid backup file format');
                    }

                    // Import data to all tools
                    const toolKeys = [
                        { key: 'notebook-data', name: 'notes' },
                        { key: 'pomodoro-data', name: 'pomodoro' },
                        { key: 'checklist-data', name: 'checklist' },
                        { key: 'eisenhower-data', name: 'eisenhower' },
                        { key: 'calendar-data', name: 'calendar' }
                    ];

                let importedCount = 0;
                    for (const {key, name} of toolKeys) {
                        if (data.tools[name]) {
                            try {
                                await this.storage.saveEncrypted(key, data.tools[name]);
                            importedCount++;
                            } catch (error) {
                                console.error(`Error importing ${name}:`, error);
                            }
                        }
                    }

                    this.updateStatus(`Data imported successfully! ${importedCount} tools updated.`, 'success');
                    
                    // Reload current tool
                    setTimeout(() => {
                        this.loadToolInIframe(this.currentTool);
                    }, 1000);
            } catch (error) {
                    console.error('Import failed:', error);
                    this.updateStatus('Import failed: ' + error.message, 'error');
                }
            };

        fileInput.click();
    } catch (error) {
            console.error('Import setup failed:', error);
            this.updateStatus('Import setup failed: ' + error.message, 'error');
    }
}

    async clearAllData() {
        if (!confirm('⚠️ Are you sure you want to clear ALL data?\n\nThis will permanently delete:\n- All notebook notes\n- Pomodoro session history\n- All checklist tasks\n- Eisenhower matrix tasks\n\nThis action cannot be undone!')) {
        return;
    }
    
    try {
            // Clear data from all tools
            const toolKeys = ['notebook-data', 'pomodoro-data', 'checklist-data', 'eisenhower-data', 'calendar-data'];
            
            for (const key of toolKeys) {
                try {
                    localStorage.removeItem(key);
                } catch (error) {
                    console.error(`Error clearing ${key}:`, error);
                }
            }

            // Clear any additional storage
            if (this.storage && this.storage.clearAll) {
                await this.storage.clearAll();
            }

            this.updateStatus('All data cleared successfully!', 'success');
            
            // Reload current tool after delay
            setTimeout(() => {
                this.loadToolInIframe(this.currentTool);
            }, 1000);
    } catch (error) {
            console.error('Clear failed:', error);
            this.updateStatus('Clear failed: ' + error.message, 'error');
        }
    }

    // Global timer modal functions removed - using standard notifications now

    showAbout() {
        alert(`📝 Productivity Suite v1.0

A unified Progressive Web App combining:
• 📝 Rich text notebook with encryption
• 🍅 Pomodoro timer for focus sessions  
• ☑️ Project checklist management
• 📊 Eisenhower priority matrix
• 📅 Calendar with event management
• ⚙️ Comprehensive settings panel

Features:
✅ Offline storage with optional encryption
✅ Progressive Web App capabilities
✅ Mobile responsive design
✅ Modular tool architecture
✅ Export/Import functionality
✅ Auto-save and data persistence

Built with vanilla HTML, CSS, and JavaScript for maximum compatibility and performance.`);
    }

    showHelp() {
        alert(`🚀 Quick Help Guide

📝 NOTEBOOK:
• Create and edit rich text notes
• Organize with tags and search
• Toggle encryption for privacy

🍅 POMODORO TIMER:
• 25-minute focus sessions with breaks
• Customize session durations
• Track productivity statistics

☑️ CHECKLIST:
• Manage project tasks and subtasks
• Track completion progress
• Organize complex projects

📊 EISENHOWER MATRIX:
• Prioritize tasks by urgency/importance
• Four quadrants: Do, Schedule, Delegate, Eliminate
• Move tasks between priorities

💾 DATA MANAGEMENT:
• All data is stored locally on your device
• Use Export/Import for backups
• Optional encryption for sensitive data
• Works completely offline

📱 PWA FEATURES:
• Install app on any device
• Offline functionality
• Native app-like experience`);
    }
}

// Initialize the app
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new ProductivitySuite();
    
    // Listen for messages from background settings iframe
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'cloud-sync-status') {
            updateBackgroundSyncStatus(event.data);
        }
    });
    
    function updateBackgroundSyncStatus(data) {
        const statusElement = document.getElementById('status');
        if (data.connected) {
            statusElement.textContent = `☁️ Auto-sync: ${data.lastSync ? 'Last sync ' + new Date(data.lastSync).toLocaleTimeString() : 'Running...'}`;
            statusElement.className = 'status cloud-sync';
            statusElement.style.display = 'block';
        } else {
            statusElement.style.display = 'none';
        }
    }
});

// Make app globally available
window.app = app;
