// Unified Storage System for Productivity Tools
class ProductivityStorage {
    constructor() {
        this.storageKey = 'productivity-tools-data';
        this.autoSaveDelay = 1000; // 1 second delay for auto-save
        this.autoSaveTimers = new Map();
    }

    // Save data for a specific app
    saveAppData(appName, data) {
        try {
            const allData = this.getAllData();
            allData[appName] = {
                data: data,
                lastModified: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            console.log(`Auto-saved ${appName} data`);
        } catch (error) {
            console.error(`Error saving ${appName} data:`, error);
        }
    }

    // Load data for a specific app
    loadAppData(appName, defaultData = null) {
        try {
            const allData = this.getAllData();
            const appData = allData[appName];
            if (appData && appData.data) {
                console.log(`Loaded ${appName} data from storage`);
                return appData.data;
            }
        } catch (error) {
            console.error(`Error loading ${appName} data:`, error);
        }
        return defaultData;
    }

    // Get all stored data
    getAllData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error reading storage:', error);
            return {};
        }
    }

    // Clear data for a specific app
    clearAppData(appName) {
        try {
            const allData = this.getAllData();
            delete allData[appName];
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            console.log(`Cleared ${appName} data`);
        } catch (error) {
            console.error(`Error clearing ${appName} data:`, error);
        }
    }

    // Clear all data
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('Cleared all productivity tools data');
        } catch (error) {
            console.error('Error clearing all data:', error);
        }
    }

    // Auto-save with debouncing
    autoSave(appName, data) {
        // Clear existing timer for this app
        if (this.autoSaveTimers.has(appName)) {
            clearTimeout(this.autoSaveTimers.get(appName));
        }

        // Set new timer
        const timer = setTimeout(() => {
            this.saveAppData(appName, data);
            this.autoSaveTimers.delete(appName);
        }, this.autoSaveDelay);

        this.autoSaveTimers.set(appName, timer);
    }

    // Get storage info
    getStorageInfo() {
        const allData = this.getAllData();
        const info = {};
        for (const [appName, appData] of Object.entries(allData)) {
            info[appName] = {
                lastModified: new Date(appData.lastModified).toLocaleString(),
                dataSize: JSON.stringify(appData.data).length,
                hasData: !!appData.data
            };
        }
        return info;
    }

    // Export all data as JSON
    exportAllData() {
        return JSON.stringify(this.getAllData(), null, 2);
    }

    // Import data from JSON
    importAllData(jsonData) {
        try {
            const parsed = JSON.parse(jsonData);
            localStorage.setItem(this.storageKey, JSON.stringify(parsed));
            console.log('Imported all data successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Create global instance
window.productivityStorage = new ProductivityStorage();
