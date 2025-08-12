// storage.js - Manejo de localStorage para FincaLimón
// Usar STORAGE_KEYS del global
const STORAGE_KEYS = window.STORAGE_KEYS;

class StorageManager {
    constructor() {
        this.isAvailable = this.checkStorageAvailable();
        if (!this.isAvailable) {
            console.warn('⚠️ localStorage no disponible, los datos no se guardarán');
        }
    }

    checkStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Métodos genéricos
    setItem(key, value) {
        if (!this.isAvailable) return false;
        
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error(`Error guardando ${key}:`, error);
            return false;
        }
    }

    getItem(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error cargando ${key}:`, error);
            return defaultValue;
        }
    }

    removeItem(key) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error eliminando ${key}:`, error);
            return false;
        }
    }

    clear() {
        if (!this.isAvailable) return false;
        
        try {
            // Solo eliminar las claves de nuestra aplicación
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error limpiando storage:', error);
            return false;
        }
    }

    // Métodos específicos para árboles
    saveTrees(trees) {
        const success = this.setItem(STORAGE_KEYS.TREES, trees);
        if (success) {
            console.log(`💾 Guardados ${trees.length} árboles`);
        }
        return success;
    }

    getTrees() {
        return this.getItem(STORAGE_KEYS.TREES, []);
    }

    addTree(tree) {
        const trees = this.getTrees();
        const newTree = {
            ...tree,
            id: tree.id || this.generateId(),
            createdAt: tree.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        trees.push(newTree);
        this.saveTrees(trees);
        return newTree;
    }

    updateTree(treeId, updates) {
        const trees = this.getTrees();
        const index = trees.findIndex(tree => tree.id === treeId);
        
        if (index !== -1) {
            trees[index] = {
                ...trees[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveTrees(trees);
            return trees[index];
        }
        return null;
    }

    deleteTree(treeId) {
        const trees = this.getTrees();
        const filteredTrees = trees.filter(tree => tree.id !== treeId);
        
        if (filteredTrees.length !== trees.length) {
            this.saveTrees(filteredTrees);
            return true;
        }
        return false;
    }

    // Métodos específicos para actividades
    saveActivities(activities) {
        const success = this.setItem(STORAGE_KEYS.ACTIVITIES, activities);
        if (success) {
            console.log(`💾 Guardadas ${activities.length} actividades`);
        }
        return success;
    }

    getActivities() {
        return this.getItem(STORAGE_KEYS.ACTIVITIES, []);
    }

    addActivity(activity) {
        const activities = this.getActivities();
        const newActivity = {
            ...activity,
            id: activity.id || this.generateId(),
            createdAt: activity.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        activities.push(newActivity);
        this.saveActivities(activities);
        return newActivity;
    }

    updateActivity(activityId, updates) {
        const activities = this.getActivities();
        const index = activities.findIndex(activity => activity.id === activityId);
        
        if (index !== -1) {
            activities[index] = {
                ...activities[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveActivities(activities);
            return activities[index];
        }
        return null;
    }

    deleteActivity(activityId) {
        const activities = this.getActivities();
        const filteredActivities = activities.filter(activity => activity.id !== activityId);
        
        if (filteredActivities.length !== activities.length) {
            this.saveActivities(filteredActivities);
            return true;
        }
        return false;
    }

    // Métodos específicos para cosechas
    saveHarvests(harvests) {
        const success = this.setItem(STORAGE_KEYS.HARVESTS, harvests);
        if (success) {
            console.log(`💾 Guardadas ${harvests.length} cosechas`);
        }
        return success;
    }

    getHarvests() {
        return this.getItem(STORAGE_KEYS.HARVESTS, []);
    }

    addHarvest(harvest) {
        const harvests = this.getHarvests();
        const newHarvest = {
            ...harvest,
            id: harvest.id || this.generateId(),
            createdAt: harvest.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        harvests.push(newHarvest);
        this.saveHarvests(harvests);
        return newHarvest;
    }

    // Métodos para configuración de usuario
    saveUserSettings(settings) {
        return this.setItem(STORAGE_KEYS.USER_SETTINGS, settings);
    }

    getUserSettings() {
        return this.getItem(STORAGE_KEYS.USER_SETTINGS, {
            theme: 'light',
            language: 'es',
            notifications: true,
            autoBackup: true,
            measurementUnit: 'metric'
        });
    }

    updateUserSettings(updates) {
        const currentSettings = this.getUserSettings();
        const newSettings = { ...currentSettings, ...updates };
        this.saveUserSettings(newSettings);
        return newSettings;
    }

    // Métodos para backup y restore
    exportData() {
        if (!this.isAvailable) {
            throw new Error('LocalStorage no disponible para exportación');
        }

        const data = {
            trees: this.getTrees(),
            activities: this.getActivities(),
            harvests: this.getHarvests(),
            userSettings: this.getUserSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        return data;
    }

    importData(data, options = { merge: false }) {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Datos de importación inválidos');
            }

            if (options.merge) {
                // Fusionar con datos existentes
                const currentTrees = this.getTrees();
                const currentActivities = this.getActivities();
                const currentHarvests = this.getHarvests();

                if (data.trees) {
                    const mergedTrees = this.mergeArrays(currentTrees, data.trees);
                    this.saveTrees(mergedTrees);
                }

                if (data.activities) {
                    const mergedActivities = this.mergeArrays(currentActivities, data.activities);
                    this.saveActivities(mergedActivities);
                }

                if (data.harvests) {
                    const mergedHarvests = this.mergeArrays(currentHarvests, data.harvests);
                    this.saveHarvests(mergedHarvests);
                }
            } else {
                // Reemplazar datos existentes
                if (data.trees) this.saveTrees(data.trees);
                if (data.activities) this.saveActivities(data.activities);
                if (data.harvests) this.saveHarvests(data.harvests);
            }

            if (data.userSettings) {
                this.saveUserSettings(data.userSettings);
            }

            console.log('✅ Datos importados correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error importando datos:', error);
            throw error;
        }
    }

    mergeArrays(current, imported) {
        const merged = [...current];
        
        imported.forEach(importedItem => {
            const exists = merged.find(item => item.id === importedItem.id);
            if (!exists) {
                merged.push(importedItem);
            } else {
                // Actualizar si el importado es más reciente
                const importedDate = new Date(importedItem.updatedAt || importedItem.createdAt);
                const existingDate = new Date(exists.updatedAt || exists.createdAt);
                
                if (importedDate > existingDate) {
                    Object.assign(exists, importedItem);
                }
            }
        });

        return merged;
    }

    // Métodos para obtener todos los datos
    getAllData() {
        return {
            trees: this.getTrees(),
            activities: this.getActivities(),
            harvests: this.getHarvests(),
            userSettings: this.getUserSettings()
        };
    }

    saveAllData(data) {
        const results = {};
        
        if (data.trees) {
            results.trees = this.saveTrees(data.trees);
        }
        
        if (data.activities) {
            results.activities = this.saveActivities(data.activities);
        }
        
        if (data.harvests) {
            results.harvests = this.saveHarvests(data.harvests);
        }
        
        if (data.userSettings) {
            results.userSettings = this.saveUserSettings(data.userSettings);
        }

        return results;
    }

    // Utilidades
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getStorageUsage() {
        if (!this.isAvailable) return { used: 0, total: 0, percentage: 0 };

        let used = 0;
        Object.values(STORAGE_KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                used += item.length;
            }
        });

        // Aproximación del límite de localStorage (usualmente 5-10MB)
        const total = 5 * 1024 * 1024; // 5MB
        const percentage = (used / total) * 100;

        return {
            used: used,
            total: total,
            percentage: Math.round(percentage * 100) / 100,
            usedMB: Math.round((used / (1024 * 1024)) * 100) / 100,
            totalMB: Math.round((total / (1024 * 1024)) * 100) / 100
        };
    }

    // Métodos de limpieza y mantenimiento
    cleanupOldData(daysOld = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        let cleanedCount = 0;

        // Limpiar actividades viejas
        const activities = this.getActivities();
        const filteredActivities = activities.filter(activity => {
            const activityDate = new Date(activity.date || activity.createdAt);
            return activityDate >= cutoffDate;
        });

        if (filteredActivities.length !== activities.length) {
            cleanedCount += activities.length - filteredActivities.length;
            this.saveActivities(filteredActivities);
        }

        // Limpiar cosechas viejas
        const harvests = this.getHarvests();
        const filteredHarvests = harvests.filter(harvest => {
            const harvestDate = new Date(harvest.date || harvest.createdAt);
            return harvestDate >= cutoffDate;
        });

        if (filteredHarvests.length !== harvests.length) {
            cleanedCount += harvests.length - filteredHarvests.length;
            this.saveHarvests(filteredHarvests);
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Limpiados ${cleanedCount} registros antiguos`);
        }

        return cleanedCount;
    }

    // Validación de integridad
    validateData() {
        const errors = [];
        const warnings = [];

        try {
            const trees = this.getTrees();
            const activities = this.getActivities();
            const harvests = this.getHarvests();

            // Validar árboles
            trees.forEach(tree => {
                if (!tree.id || !tree.variety || !tree.plantedDate) {
                    errors.push(`Árbol inválido: ${tree.id || 'sin ID'}`);
                }
            });

            // Validar referencias en actividades
            activities.forEach(activity => {
                if (activity.treeId && !trees.find(tree => tree.id === activity.treeId)) {
                    warnings.push(`Actividad ${activity.id} referencia árbol inexistente: ${activity.treeId}`);
                }
            });

            // Validar referencias en cosechas
            harvests.forEach(harvest => {
                if (harvest.treeId && !trees.find(tree => tree.id === harvest.treeId)) {
                    warnings.push(`Cosecha ${harvest.id} referencia árbol inexistente: ${harvest.treeId}`);
                }
            });

        } catch (error) {
            errors.push(`Error validando datos: ${error.message}`);
        }

        return { errors, warnings };
    }
}

// Crear instancia singleton
const storageManager = new StorageManager();

// Exponer al global
window.StorageManager = storageManager;