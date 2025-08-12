// js/utils/constants.js - Configuraciones y constantes para FincaLimón

// Claves para localStorage
const STORAGE_KEYS = {
    TREES: 'fincalimon_trees',
    ACTIVITIES: 'fincalimon_activities',
    HARVESTS: 'fincalimon_harvests',
    USER_SETTINGS: 'fincalimon_settings',
    PRODUCTS: 'fincalimon_products',
    CALENDAR_EVENTS: 'fincalimon_calendar'
};


// Rutas de navegación
export const ROUTES = {
    dashboard: 'dashboard',
    trees: 'trees', 
    activities: 'activities',
    harvest: 'harvest',
    fertilizer: 'fertilizer',
    spray: 'spray',
    analytics: 'analytics',
    map: 'map',
    calendar: 'calendar'
};

// Configuración de la aplicación
export const APP_CONFIG = {
    name: 'FincaLimón',
    version: '1.0.0',
    description: 'Sistema de Gestión Agrícola',
    author: 'FincaLimón Team',
    apiUrl: 'https://api.fincalimon.com/v1',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    defaultLocation: {
        lat: 14.6349,
        lng: -90.5069,
        country: 'Guatemala',
        region: 'Chimaltenango'
    }
};

// Variedades de limón
export const LEMON_VARIETIES = [
    { id: 'eureka', name: 'Eureka', description: 'Variedad comercial común, frutos grandes' },
    { id: 'lisbon', name: 'Lisbon', description: 'Resistente al frío, alta productividad' },
    { id: 'meyer', name: 'Meyer', description: 'Híbrido dulce, ideal para climas cálidos' },
    { id: 'ponderosa', name: 'Ponderosa', description: 'Frutos muy grandes, ornamental' },
    { id: 'femminello', name: 'Femminello', description: 'Variedad italiana, múltiples cosechas' },
    { id: 'genova', name: 'Génova', description: 'Variedad argentina, resistente' },
    { id: 'tahiti', name: 'Tahití', description: 'Lima ácida, sin semillas' }
];

// Estados de salud de los árboles
export const HEALTH_STATUS = {
    EXCELLENT: { 
        id: 'excellent', 
        name: 'Excelente', 
        color: 'green', 
        icon: 'heart',
        description: 'Árbol completamente saludable'
    },
    GOOD: { 
        id: 'good', 
        name: 'Bueno', 
        color: 'blue', 
        icon: 'thumbs-up',
        description: 'Árbol en buen estado general'
    },
    REGULAR: { 
        id: 'regular', 
        name: 'Regular', 
        color: 'yellow', 
        icon: 'alert-circle',
        description: 'Árbol con problemas menores'
    },
    BAD: { 
        id: 'bad', 
        name: 'Malo', 
        color: 'red', 
        icon: 'alert-triangle',
        description: 'Árbol con problemas graves'
    }
};

// Tipos de actividades
export const ACTIVITY_TYPES = {
    HARVEST: {
        id: 'cosecha',
        name: 'Cosecha',
        icon: 'scissors',
        color: 'green',
        description: 'Recolección de frutos'
    },
    FERTILIZER: {
        id: 'abono',
        name: 'Abono',
        icon: 'droplets',
        color: 'blue',
        description: 'Aplicación de fertilizantes'
    },
    SPRAY: {
        id: 'fumigacion',
        name: 'Fumigación',
        icon: 'spray-can',
        color: 'purple',
        description: 'Control de plagas y enfermedades'
    },
    IRRIGATION: {
        id: 'riego',
        name: 'Riego',
        icon: 'cloud-rain',
        color: 'cyan',
        description: 'Sistema de riego'
    },
    PRUNING: {
        id: 'poda',
        name: 'Poda',
        icon: 'scissors',
        color: 'orange',
        description: 'Corte y formación del árbol'
    },
    INSPECTION: {
        id: 'inspeccion',
        name: 'Inspección',
        icon: 'search',
        color: 'gray',
        description: 'Revisión fitosanitaria'
    }
};

// Categorías de productos
export const PRODUCT_CATEGORIES = {
    FERTILIZERS: {
        id: 'fertilizers',
        name: 'Fertilizantes',
        icon: 'sprout',
        color: 'green'
    },
    PESTICIDES: {
        id: 'pesticides', 
        name: 'Pesticidas',
        icon: 'bug',
        color: 'red'
    },
    FUNGICIDES: {
        id: 'fungicides',
        name: 'Fungicidas',
        icon: 'shield',
        color: 'purple'
    },
    HERBICIDES: {
        id: 'herbicides',
        name: 'Herbicidas',
        icon: 'zap',
        color: 'yellow'
    },
    TOOLS: {
        id: 'tools',
        name: 'Herramientas',
        icon: 'wrench',
        color: 'gray'
    },
    SUPPLIES: {
        id: 'supplies',
        name: 'Insumos',
        icon: 'package',
        color: 'blue'
    }
};

// Unidades de medida
export const UNITS = {
    WEIGHT: {
        kg: { name: 'Kilogramos', symbol: 'kg', factor: 1 },
        g: { name: 'Gramos', symbol: 'g', factor: 0.001 },
        lb: { name: 'Libras', symbol: 'lb', factor: 0.453592 },
        ton: { name: 'Toneladas', symbol: 't', factor: 1000 }
    },
    VOLUME: {
        l: { name: 'Litros', symbol: 'L', factor: 1 },
        ml: { name: 'Mililitros', symbol: 'mL', factor: 0.001 },
        gal: { name: 'Galones', symbol: 'gal', factor: 3.78541 }
    },
    AREA: {
        m2: { name: 'Metro cuadrado', symbol: 'm²', factor: 1 },
        ha: { name: 'Hectáreas', symbol: 'ha', factor: 10000 },
        acre: { name: 'Acres', symbol: 'ac', factor: 4046.86 }
    },
    TIME: {
        min: { name: 'Minutos', symbol: 'min', factor: 1 },
        hr: { name: 'Horas', symbol: 'h', factor: 60 },
        day: { name: 'Días', symbol: 'd', factor: 1440 }
    }
};

// Calidades de cosecha
export const HARVEST_QUALITIES = [
    { id: 'primera', name: 'Primera', color: 'green', premium: 1.0 },
    { id: 'segunda', name: 'Segunda', color: 'yellow', premium: 0.8 },
    { id: 'tercera', name: 'Tercera', color: 'orange', premium: 0.6 },
    { id: 'industrial', name: 'Industrial', color: 'red', premium: 0.4 }
];

// Sectores predefinidos
export const SECTORS = [
    'A1', 'A2', 'A3', 'A4', 'A5',
    'B1', 'B2', 'B3', 'B4', 'B5',
    'C1', 'C2', 'C3', 'C4', 'C5',
    'D1', 'D2', 'D3', 'D4', 'D5'
];

// Configuración del mapa
export const MAP_CONFIG = {
    defaultZoom: 15,
    minZoom: 10,
    maxZoom: 20,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    markerColors: {
        excellent: '#10b981', // green-500
        good: '#3b82f6',      // blue-500  
        regular: '#f59e0b',   // yellow-500
        bad: '#ef4444'        // red-500
    }
};

// Configuración del calendario
export const CALENDAR_CONFIG = {
    firstDayOfWeek: 1, // Lunes
    weekDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    months: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    eventColors: {
        cosecha: '#10b981',
        abono: '#3b82f6', 
        fumigacion: '#8b5cf6',
        riego: '#06b6d4',
        poda: '#f97316',
        inspeccion: '#6b7280'
    }
};

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
    duration: 3000, // 3 segundos
    position: 'top-right',
    maxNotifications: 5,
    types: {
        success: { color: 'green', icon: 'check-circle' },
        error: { color: 'red', icon: 'x-circle' },
        warning: { color: 'yellow', icon: 'alert-triangle' },
        info: { color: 'blue', icon: 'info' }
    }
};

// Configuración de analytics
export const ANALYTICS_CONFIG = {
    chartColors: [
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#06b6d4', '#f97316', '#6b7280'
    ],
    defaultPeriod: 'monthly',
    periods: {
        weekly: { name: 'Semanal', days: 7 },
        monthly: { name: 'Mensual', days: 30 },
        quarterly: { name: 'Trimestral', days: 90 },
        yearly: { name: 'Anual', days: 365 }
    }
};

// Configuración de exportación
export const EXPORT_CONFIG = {
    formats: {
        csv: { name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
        json: { name: 'JSON', extension: '.json', mimeType: 'application/json' },
        pdf: { name: 'PDF', extension: '.pdf', mimeType: 'application/pdf' }
    },
    dateFormat: 'yyyy-mm-dd',
    encoding: 'utf-8'
};

// Límites y validaciones
export const VALIDATION_RULES = {
    treeId: {
        minLength: 3,
        maxLength: 10,
        pattern: /^[A-Z][0-9]{3,9}$/
    },
    coordinates: {
        lat: { min: -90, max: 90 },
        lng: { min: -180, max: 180 }
    },
    productivity: {
        min: 0,
        max: 100
    },
    harvest: {
        minWeight: 0.1,
        maxWeight: 1000
    },
    activity: {
        maxNotesLength: 500,
        maxQuantity: 10000
    }
};

// Mensajes del sistema
export const MESSAGES = {
    SUCCESS: {
        TREE_ADDED: 'Árbol agregado correctamente',
        TREE_UPDATED: 'Árbol actualizado correctamente',
        TREE_DELETED: 'Árbol eliminado correctamente',
        ACTIVITY_ADDED: 'Actividad registrada correctamente',
        ACTIVITY_UPDATED: 'Actividad actualizada correctamente',
        ACTIVITY_DELETED: 'Actividad eliminada correctamente',
        DATA_EXPORTED: 'Datos exportados correctamente',
        DATA_IMPORTED: 'Datos importados correctamente'
    },
    ERROR: {
        GENERIC: 'Ha ocurrido un error inesperado',
        NETWORK: 'Error de conexión a internet',
        VALIDATION: 'Por favor verifica los datos ingresados',
        NOT_FOUND: 'Elemento no encontrado',
        PERMISSION_DENIED: 'No tienes permisos para realizar esta acción',
        STORAGE_FULL: 'Espacio de almacenamiento lleno'
    },
    WARNING: {
        UNSAVED_CHANGES: 'Tienes cambios sin guardar',
        DELETE_CONFIRMATION: '¿Estás seguro de eliminar este elemento?',
        DATA_LOSS: 'Esta acción puede causar pérdida de datos',
        OLD_DATA: 'Algunos datos son antiguos y pueden no estar actualizados'
    }
};

// Configuración de temas
export const THEMES = {
    light: {
        name: 'Claro',
        primary: '#10b981',
        secondary: '#3b82f6',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#111827'
    },
    dark: {
        name: 'Oscuro', 
        primary: '#10b981',
        secondary: '#3b82f6',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb'
    }
};

// URLs de APIs externas
export const EXTERNAL_APIS = {
    weather: 'https://api.openweathermap.org/data/2.5',
    geocoding: 'https://api.openweathermap.org/geo/1.0',
    maps: 'https://nominatim.openstreetmap.org',
    exchange: 'https://api.exchangerate-api.com/v4/latest'
};

// Configuración regional
export const LOCALE_CONFIG = {
    language: 'es-GT',
    currency: 'GTQ',
    timezone: 'America/Guatemala',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    numberFormat: {
        decimal: '.',
        thousands: ','
    }
};

// Exponer al ámbito global
window.STORAGE_KEYS = STORAGE_KEYS;
window.ROUTES = ROUTES;
window.APP_CONFIG = APP_CONFIG;
// Añade aquí todas las constantes que necesites compartir