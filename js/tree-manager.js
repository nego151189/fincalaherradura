/* ========================================
   FINCA LA HERRADURA - TREE MANAGER
   Gestor completo de árboles con Firebase Firestore
   Versión corregida con mejor manejo de errores
   ======================================== */

// ==========================================
// VARIABLES GLOBALES
// ==========================================

let treesMap = new Map();
let sectorsMap = new Map();
let isTreeManagerInitialized = false;
let firebaseDb = null;
let firebaseAuth = null;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// ==========================================
// INICIALIZACIÓN MEJORADA
// ==========================================

async function waitForFirebaseTreeManager() {
    return new Promise((resolve, reject) => {
        const maxAttempts = 30; // Reducido de 50 a 30
        let attempts = 0;
        
        const checkFirebase = () => {
            attempts++;
            
            if (window.firebase && window.db && window.auth) {
                firebaseDb = window.db;
                firebaseAuth = window.auth;
                console.log('✅ Firebase disponible para TreeManager');
                resolve(true);
            } else if (attempts < maxAttempts) {
                setTimeout(checkFirebase, 100);
            } else {
                console.warn('⚠️ Firebase timeout - continuando sin Firebase');
                resolve(false); // No rechazar, solo resolver como false
            }
        };
        
        checkFirebase();
    });
}

async function initializeTreeManager() {
    try {
        console.log(`🌳 Inicializando TreeManager (intento ${initializationAttempts + 1}/${MAX_INIT_ATTEMPTS})...`);
        
        // Intentar esperar Firebase con timeout corto
        const firebaseAvailable = await waitForFirebaseTreeManager();
        
        if (firebaseAvailable) {
            console.log('🔥 Firebase disponible, cargando desde Firestore...');
        } else {
            console.log('📱 Firebase no disponible, usando modo offline...');
        }
        
        // Cargar sectores (siempre desde localStorage como fallback)
        await loadSectorsTreeManager();
        
        // Cargar árboles solo si Firebase está disponible
        if (firebaseAvailable) {
            try {
                await loadAllTreesFromFirebase();
            } catch (error) {
                console.warn('⚠️ Error cargando desde Firebase, continuando sin árboles:', error);
            }
        }
        
        isTreeManagerInitialized = true;
        console.log('✅ TreeManager inicializado correctamente');
        
        // Notificar que está listo
        window.dispatchEvent(new CustomEvent('treeManagerReady'));
        
    } catch (error) {
        console.error('❌ Error inicializando TreeManager:', error);
        initializationAttempts++;
        
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            console.log(`🔄 Reintentando inicialización en 2 segundos...`);
            setTimeout(() => initializeTreeManager(), 2000);
        } else {
            console.log('📱 Inicializando TreeManager en modo básico...');
            await initializeBasicMode();
        }
    }
}

async function initializeBasicMode() {
    try {
        console.log('🔧 Modo básico activado para TreeManager');
        
        // Cargar sectores desde localStorage
        await loadSectorsTreeManager();
        
        // Crear algunos árboles de ejemplo si no hay ninguno
        if (treesMap.size === 0) {
            createSampleTrees();
        }
        
        isTreeManagerInitialized = true;
        console.log('✅ TreeManager inicializado en modo básico');
        
        // Notificar que está listo
        window.dispatchEvent(new CustomEvent('treeManagerReady'));
        
    } catch (error) {
        console.error('❌ Error en modo básico:', error);
        isTreeManagerInitialized = true; // Marcar como inicializado anyway
        window.dispatchEvent(new CustomEvent('treeManagerReady'));
    }
}

function createSampleTrees() {
    const sampleTrees = [
        {
            id: 'TREE_001',
            correlative: '00001',
            variety: 'Lima Persa',
            blockId: 'SECTOR_NORTE',
            age: 5,
            health: { overall: 85, leaves: 90, trunk: 80 },
            production: { currentSeason: 45, totalLifetime: 250 },
            location: { latitude: 14.6359, longitude: -90.5069 },
            measurements: { height: 2.5, diameter: 15 },
            active: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'TREE_002',
            correlative: '00002',
            variety: 'Limón Eureka',
            blockId: 'SECTOR_SUR',
            age: 3,
            health: { overall: 92, leaves: 95, trunk: 89 },
            production: { currentSeason: 38, totalLifetime: 180 },
            location: { latitude: 14.6339, longitude: -90.5069 },
            measurements: { height: 2.2, diameter: 12 },
            active: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'TREE_003',
            correlative: '00003',
            variety: 'Limón Meyer',
            blockId: 'SECTOR_ESTE',
            age: 7,
            health: { overall: 78, leaves: 75, trunk: 82 },
            production: { currentSeason: 52, totalLifetime: 420 },
            location: { latitude: 14.6349, longitude: -90.5059 },
            measurements: { height: 3.1, diameter: 18 },
            active: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    sampleTrees.forEach(tree => {
        treesMap.set(tree.id, tree);
    });
    
    // Actualizar localStorage también
    localStorage.setItem('lastTreeCorrelative', '3');
    
    console.log(`🌳 Creados ${sampleTrees.length} árboles de ejemplo`);
}

// ==========================================
// GESTIÓN DE SECTORES (MEJORADA)
// ==========================================

async function loadSectorsTreeManager() {
    try {
        // Siempre intentar cargar desde localStorage primero
        const savedSectors = localStorage.getItem('finca_sectores');
        if (savedSectors) {
            const sectorsData = JSON.parse(savedSectors);
            sectorsData.forEach(sector => {
                sectorsMap.set(sector.id, sector);
            });
            console.log(`📦 ${sectorsMap.size} sectores cargados desde localStorage`);
        }
        
        // Si no hay sectores, crear los por defecto
        if (sectorsMap.size === 0) {
            createDefaultSectorsTreeManager();
        }
        
        // Intentar sincronizar con Firebase si está disponible
        if (firebaseDb) {
            try {
                await syncSectorsWithFirebase();
            } catch (error) {
                console.warn('⚠️ Error sincronizando sectores con Firebase:', error);
            }
        }
        
    } catch (error) {
        console.error('❌ Error cargando sectores:', error);
        createDefaultSectorsTreeManager();
    }
}

async function syncSectorsWithFirebase() {
    try {
        const snapshot = await firebaseDb.collection('sectores')
            .where('active', '==', true)
            .get();
        
        const firebaseSectors = new Map();
        snapshot.forEach(doc => {
            const sectorData = {
                id: doc.id,
                ...doc.data(),
                firebaseRef: doc.ref
            };
            firebaseSectors.set(doc.id, sectorData);
        });
        
        // Fusionar con sectores locales
        firebaseSectors.forEach((sector, id) => {
            sectorsMap.set(id, sector);
        });
        
        console.log(`🔥 Sectores sincronizados con Firebase: ${firebaseSectors.size} sectores`);
        
    } catch (error) {
        console.warn('⚠️ Error sincronizando con Firebase:', error);
    }
}

function createDefaultSectorsTreeManager() {
    const defaultSectors = [
        {
            id: 'SECTOR_NORTE',
            name: 'Sector Norte',
            coordinates: {
                center: [14.6359, -90.5069],
                bounds: [[14.6354, -90.5074], [14.6364, -90.5064]]
            },
            capacity: 100,
            currentTrees: 0,
            soilType: 'Franco arcilloso',
            irrigationSystem: 'Goteo',
            active: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'SECTOR_SUR',
            name: 'Sector Sur',
            coordinates: {
                center: [14.6339, -90.5069],
                bounds: [[14.6334, -90.5074], [14.6344, -90.5064]]
            },
            capacity: 100,
            currentTrees: 0,
            soilType: 'Franco arenoso',
            irrigationSystem: 'Aspersión',
            active: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'SECTOR_ESTE',
            name: 'Sector Este',
            coordinates: {
                center: [14.6349, -90.5059],
                bounds: [[14.6344, -90.5064], [14.6354, -90.5054]]
            },
            capacity: 100,
            currentTrees: 0,
            soilType: 'Arcilloso',
            irrigationSystem: 'Manual',
            active: true,
            createdAt: new Date().toISOString()
        }
    ];

    defaultSectors.forEach(sector => sectorsMap.set(sector.id, sector));
    saveSectorsToLocalStorageTreeManager();
    
    console.log('📦 Sectores por defecto creados');
}

function saveSectorsToLocalStorageTreeManager() {
    try {
        const sectorsArray = Array.from(sectorsMap.values());
        localStorage.setItem('finca_sectores', JSON.stringify(sectorsArray));
    } catch (error) {
        console.error('❌ Error guardando sectores:', error);
    }
}

// ==========================================
// OPERACIONES CRUD MEJORADAS
// ==========================================

async function createTreeFirebase(treeData) {
    try {
        // Generar ID y correlativo
        const treeId = `TREE_${Date.now().toString(36).toUpperCase()}`;
        const correlative = treeData.correlative || generateTreeNumberTreeManager();
        
        const newTree = {
            id: treeId,
            correlative: correlative,
            variety: treeData.variety,
            blockId: treeData.blockId,
            plantingDate: treeData.plantingDate,
            location: {
                latitude: treeData.latitude,
                longitude: treeData.longitude,
                elevation: treeData.elevation || null
            },
            measurements: {
                height: treeData.height || 0,
                diameter: treeData.diameter || 0,
                canopyWidth: treeData.canopyWidth || 0
            },
            health: {
                overall: treeData.health?.overall || 100,
                leaves: treeData.health?.leaves || 100,
                trunk: treeData.health?.trunk || 100,
                lastInspection: new Date().toISOString()
            },
            production: {
                currentSeason: 0,
                totalLifetime: 0,
                averageYield: 0,
                lastHarvest: null
            },
            notes: treeData.notes || '',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Calcular edad
        if (newTree.plantingDate) {
            const plantDate = new Date(newTree.plantingDate);
            const now = new Date();
            newTree.age = Math.floor((now - plantDate) / (365.25 * 24 * 60 * 60 * 1000));
        }
        
        // Guardar en memoria local
        treesMap.set(treeId, newTree);
        
        // Intentar guardar en Firebase si está disponible
        if (firebaseDb) {
            try {
                const docRef = await firebaseDb.collection('arboles').add({
                    ...newTree,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Actualizar con referencia de Firebase
                newTree.firebaseRef = docRef;
                treesMap.set(treeId, newTree);
                
                console.log('🔥 Árbol guardado en Firebase:', treeId);
            } catch (error) {
                console.warn('⚠️ Error guardando en Firebase, mantenido localmente:', error);
            }
        }
        
        // Actualizar contador de correlativo
        const numCorrelative = parseInt(correlative);
        if (!isNaN(numCorrelative)) {
            const currentMax = parseInt(localStorage.getItem('lastTreeCorrelative') || '0');
            if (numCorrelative > currentMax) {
                localStorage.setItem('lastTreeCorrelative', numCorrelative.toString());
            }
        }
        
        console.log('✅ Árbol creado:', treeId, 'Correlativo:', correlative);
        
        // Notificar actualización
        window.dispatchEvent(new CustomEvent('treeUpdate', {
            detail: { action: 'create', tree: newTree }
        }));
        
        return newTree;
        
    } catch (error) {
        console.error('❌ Error creando árbol:', error);
        throw error;
    }
}

async function loadAllTreesFromFirebase() {
    if (!firebaseDb) {
        console.log('📱 Firebase no disponible para cargar árboles');
        return;
    }
    
    try {
        const snapshot = await firebaseDb.collection('arboles')
            .where('active', '==', true)
            .get();
        
        let loadedCount = 0;
        snapshot.forEach(doc => {
            const treeData = {
                id: doc.id,
                ...doc.data(),
                firebaseRef: doc.ref
            };
            treesMap.set(doc.id, treeData);
            loadedCount++;
        });
        
        console.log(`🔥 ${loadedCount} árboles cargados desde Firebase`);
        
        // Si no hay árboles en Firebase, crear algunos de ejemplo
        if (loadedCount === 0) {
            createSampleTrees();
        }
        
    } catch (error) {
        console.warn('⚠️ Error cargando árboles desde Firebase:', error);
        createSampleTrees();
    }
}

// ==========================================
// API PÚBLICA MEJORADA
// ==========================================

function getSectoresParaFormulario() {
    return Array.from(sectorsMap.values()).map(sector => ({
        value: sector.id,
        label: sector.name,
        type: 'block',
        data: sector
    }));
}

function getArbolesParaFormulario() {
    const arboles = Array.from(treesMap.values())
        .filter(tree => tree.active)
        .map(tree => ({
            value: tree.id,
            label: `Árbol #${tree.correlative || '00000'} - ${tree.blockId || 'Sin sector'}`,
            type: 'tree',
            data: tree
        }));

    const sectores = Array.from(sectorsMap.values()).map(sector => ({
        value: sector.id,
        label: `${sector.name} (Sector completo)`,
        type: 'block',
        data: sector
    }));

    return [...arboles, ...sectores];
}

function obtenerListaCompleta() {
    const items = [];
    
    Array.from(treesMap.values())
        .filter(tree => tree.active)
        .forEach(tree => {
            items.push({
                id: tree.id,
                label: `Árbol #${tree.correlative || '00000'}`,
                type: 'tree',
                blockId: tree.blockId,
                data: tree
            });
        });

    Array.from(sectorsMap.values())
        .filter(sector => sector.active !== false)
        .forEach(sector => {
            items.push({
                id: sector.id,
                label: sector.name,
                type: 'block',
                data: sector
            });
        });

    return items;
}

async function getAllTreesTreeManager(filters = {}) {
    try {
        let trees = Array.from(treesMap.values()).filter(tree => tree.active);
        
        if (filters.blockId) {
            trees = trees.filter(tree => tree.blockId === filters.blockId);
        }
        
        if (filters.ageMin) {
            trees = trees.filter(tree => (tree.age || 0) >= filters.ageMin);
        }
        
        if (filters.ageMax) {
            trees = trees.filter(tree => (tree.age || 0) <= filters.ageMax);
        }
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            trees = trees.filter(tree => 
                tree.id.toLowerCase().includes(searchLower) ||
                (tree.notes && tree.notes.toLowerCase().includes(searchLower)) ||
                (tree.correlative && tree.correlative.includes(filters.search)) ||
                (tree.blockId && tree.blockId.toLowerCase().includes(searchLower))
            );
        }
        
        return trees;
        
    } catch (error) {
        console.error('❌ Error obteniendo árboles:', error);
        return [];
    }
}

async function getTreeTreeManager(treeId) {
    try {
        return treesMap.get(treeId) || null;
    } catch (error) {
        console.error('❌ Error obteniendo árbol:', error);
        return null;
    }
}

function getAllSectorsTreeManager() {
    return Array.from(sectorsMap.values()).filter(sector => sector.active !== false);
}

async function getStatisticsTreeManager() {
    try {
        const trees = Array.from(treesMap.values()).filter(tree => tree.active);
        
        const stats = {
            totalTrees: trees.length,
            healthyTrees: 0,
            sickTrees: 0,
            treatmentTrees: 0,
            totalProduction: 0,
            averageProduction: 0
        };
        
        trees.forEach(tree => {
            const health = tree.health?.overall || 0;
            const production = tree.production?.currentSeason || 0;
            
            if (health >= 80) {
                stats.healthyTrees++;
            } else if (health >= 60) {
                stats.treatmentTrees++;
            } else {
                stats.sickTrees++;
            }
            
            stats.totalProduction += production;
        });
        
        if (trees.length > 0) {
            stats.averageProduction = Math.round(stats.totalProduction / trees.length);
        }
        
        return stats;
        
    } catch (error) {
        console.error('❌ Error calculando estadísticas:', error);
        return {
            totalTrees: 0,
            healthyTrees: 0,
            sickTrees: 0,
            treatmentTrees: 0,
            totalProduction: 0,
            averageProduction: 0
        };
    }
}

function generateTreeNumberTreeManager() {
    const existingNumbers = Array.from(treesMap.values())
        .map(tree => {
            if (tree.correlative) {
                return parseInt(tree.correlative);
            }
            const match = tree.id.match(/\d+$/);
            return match ? parseInt(match[0]) : 0;
        })
        .filter(num => !isNaN(num));
    
    const maxFromMemory = Math.max(0, ...existingNumbers);
    const maxFromStorage = parseInt(localStorage.getItem('lastTreeCorrelative') || '0');
    const maxNumber = Math.max(maxFromMemory, maxFromStorage);
    
    return (maxNumber + 1).toString().padStart(5, '0');
}

// ==========================================
// VALIDACIONES
// ==========================================

function validateTreeDataTreeManager(treeData) {
    const errors = [];
    
    if (!treeData.variety) errors.push('La variedad es obligatoria');
    if (!treeData.blockId) errors.push('El sector es obligatorio');
    if (!treeData.plantingDate) errors.push('La fecha de plantación es obligatoria');
    if (!treeData.latitude || !treeData.longitude) errors.push('Las coordenadas GPS son obligatorias');
    
    if (treeData.latitude && treeData.longitude) {
        if (Math.abs(treeData.latitude) > 90) errors.push('Latitud inválida');
        if (Math.abs(treeData.longitude) > 180) errors.push('Longitud inválida');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ==========================================
// OBJETO TREEMANAGER GLOBAL MEJORADO
// ==========================================

const treeManager = {
    // Propiedades
    get trees() { return treesMap; },
    get sectors() { return sectorsMap; },
    get isInitialized() { return isTreeManagerInitialized; },
    
    // Métodos principales
    init: initializeTreeManager,
    createTree: createTreeFirebase,
    getTree: getTreeTreeManager,
    getAllTrees: getAllTreesTreeManager,
    getAllSectors: getAllSectorsTreeManager,
    getStatistics: getStatisticsTreeManager,
    
    // Validaciones
    validateTreeData: validateTreeDataTreeManager,
    
    // Utilidades
    generateTreeNumber: generateTreeNumberTreeManager,
    
    // Métodos para integración
    getSectoresParaFormulario,
    getArbolesParaFormulario,
    obtenerListaCompleta,
    
    // Métodos básicos para compatibilidad
    updateTree: async (id, data) => {
        const tree = treesMap.get(id);
        if (tree) {
            const updatedTree = { ...tree, ...data, updatedAt: new Date().toISOString() };
            treesMap.set(id, updatedTree);
            return updatedTree;
        }
        return null;
    },
    
    deleteTree: async (id) => {
        const tree = treesMap.get(id);
        if (tree) {
            tree.active = false;
            tree.deletedAt = new Date().toISOString();
            treesMap.set(id, tree);
        }
    },
    
    getSector: (id) => sectorsMap.get(id),
    
    exportData: () => ({
        trees: Array.from(treesMap.values()),
        sectors: Array.from(sectorsMap.values()),
        exportDate: new Date().toISOString()
    })
};

// ==========================================
// INICIALIZACIÓN GLOBAL MEJORADA
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🌳 Inicializando TreeManager...');
        
        // Hacer disponible globalmente inmediatamente
        window.treeManager = treeManager;
        
        // Inicializar en background
        initializeTreeManager().catch(error => {
            console.error('❌ Error en inicialización:', error);
        });
        
    } catch (error) {
        console.error('❌ Error en setup inicial:', error);
        // Asegurar que el objeto esté disponible
        window.treeManager = treeManager;
        isTreeManagerInitialized = true;
    }
});

console.log('🌳 Tree Manager cargado - Versión mejorada');
