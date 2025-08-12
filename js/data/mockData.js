// js/data/mockData.js
const mockData = {  // <-- Solo 'const'
  farm: {
    name: "Finca El Limón",
    owner: "María González",
    location: "Chimaltenango, Guatemala",
    totalArea: 15.5,
    plantedArea: 12.3,
    coordinates: {
      lat: 14.6349,
      lng: -90.5069
    }
  },

  // Datos de árboles
  trees: [
    {
      id: 1,
      variety: "Limón Tahití",
      plantingDate: "2020-03-15",
      location: { lat: 14.6350, lng: -90.5070 },
      sector: "A1",
      status: "Activo",
      health: "Excelente",
      lastInspection: "2024-01-15",
      production: {
        current: 45.2,
        expected: 50.0
      },
      age: calculateAge("2020-03-15")
    },
    {
      id: 2,
      variety: "Limón Criollo",
      plantingDate: "2019-08-22",
      location: { lat: 14.6351, lng: -90.5068 },
      sector: "B2",
      status: "Activo",
      health: "Buena",
      lastInspection: "2024-01-10",
      production: {
        current: 38.7,
        expected: 42.0
      },
      age: calculateAge("2019-08-22")
    },
    {
      id: 3,
      variety: "Limón Persa",
      plantingDate: "2021-01-10",
      location: { lat: 14.6348, lng: -90.5072 },
      sector: "C1",
      status: "Activo",
      health: "Regular",
      lastInspection: "2024-01-12",
      production: {
        current: 25.3,
        expected: 35.0
      },
      age: calculateAge("2021-01-10")
    },
    {
      id: 4,
      variety: "Limón Tahití",
      plantingDate: "2020-06-18",
      location: { lat: 14.6352, lng: -90.5069 },
      sector: "A2",
      status: "Activo",
      health: "Excelente",
      lastInspection: "2024-01-14",
      production: {
        current: 42.8,
        expected: 48.0
      },
      age: calculateAge("2020-06-18")
    },
    {
      id: 5,
      variety: "Limón Criollo",
      plantingDate: "2018-11-05",
      location: { lat: 14.6349, lng: -90.5071 },
      sector: "B1",
      status: "Mantenimiento",
      health: "Regular",
      lastInspection: "2024-01-08",
      production: {
        current: 32.1,
        expected: 45.0
      },
      age: calculateAge("2018-11-05")
    }
  ],

  // Actividades recientes
  activities: [
    {
      id: 1,
      type: "cosecha",
      date: "2024-01-15",
      treeId: 1,
      sector: "A1",
      quantity: 125.5,
      unit: "kg",
      quality: "Primera",
      notes: "Cosecha excelente, frutos de buen tamaño",
      weather: "Soleado"
    },
    {
      id: 2,
      type: "abono",
      date: "2024-01-12",
      treeId: 2,
      sector: "B2",
      product: "Compost Orgánico",
      quantity: 15.0,
      unit: "kg",
      notes: "Aplicación mensual programada"
    },
    {
      id: 3,
      type: "fumigacion",
      date: "2024-01-10",
      treeId: 3,
      sector: "C1",
      product: "Fungicida Natural",
      quantity: 2.5,
      unit: "L",
      target: "Hongos foliares",
      notes: "Tratamiento preventivo"
    },
    {
      id: 4,
      type: "cosecha",
      date: "2024-01-14",
      treeId: 4,
      sector: "A2",
      quantity: 98.3,
      unit: "kg",
      quality: "Primera",
      notes: "Buena calidad general",
      weather: "Parcialmente nublado"
    },
    {
      id: 5,
      type: "riego",
      date: "2024-01-13",
      treeId: 5,
      sector: "B1",
      duration: 45,
      unit: "min",
      method: "Goteo",
      notes: "Riego complementario por sequía"
    },
    {
      id: 6,
      type: "poda",
      date: "2024-01-11",
      treeId: 1,
      sector: "A1",
      type_detail: "Sanitaria",
      notes: "Eliminación de ramas secas y enfermas"
    }
  ],

  // Datos para analytics
  analytics: {
    production: {
      monthly: [
        { month: "Ene", harvest: 450.2, expected: 500.0 },
        { month: "Feb", harvest: 523.1, expected: 520.0 },
        { month: "Mar", harvest: 487.9, expected: 480.0 },
        { month: "Apr", harvest: 612.5, expected: 600.0 },
        { month: "May", harvest: 678.3, expected: 650.0 },
        { month: "Jun", harvest: 734.2, expected: 720.0 },
        { month: "Jul", harvest: 789.6, expected: 800.0 },
        { month: "Ago", harvest: 823.4, expected: 830.0 },
        { month: "Sep", harvest: 756.8, expected: 750.0 },
        { month: "Oct", harvest: 689.2, expected: 700.0 },
        { month: "Nov", harvest: 534.6, expected: 550.0 },
        { month: "Dec", harvest: 467.8, expected: 480.0 }
      ],
      byVariety: [
        { variety: "Limón Tahití", production: 3245.6, percentage: 45.2 },
        { variety: "Limón Criollo", production: 2876.3, percentage: 40.1 },
        { variety: "Limón Persa", production: 1056.7, percentage: 14.7 }
      ],
      bySector: [
        { sector: "A1", production: 1234.5, trees: 25 },
        { sector: "A2", production: 1156.8, trees: 23 },
        { sector: "B1", production: 2341.2, trees: 45 },
        { sector: "B2", production: 1987.6, trees: 38 },
        { sector: "C1", production: 458.5, trees: 12 }
      ]
    },
    
    costs: {
      monthly: [
        { month: "Ene", fertilizer: 1200, pesticides: 800, labor: 2500, others: 300 },
        { month: "Feb", fertilizer: 1350, pesticides: 650, labor: 2800, others: 250 },
        { month: "Mar", fertilizer: 1100, pesticides: 900, labor: 2600, others: 400 },
        { month: "Apr", fertilizer: 1500, pesticides: 750, labor: 3200, others: 350 },
        { month: "May", fertilizer: 1450, pesticides: 850, labor: 3500, others: 200 },
        { month: "Jun", fertilizer: 1600, pesticides: 700, labor: 4000, others: 300 }
      ],
      byCategory: [
        { category: "Fertilizantes", amount: 8200, percentage: 35.2 },
        { category: "Pesticidas", amount: 4650, percentage: 20.0 },
        { category: "Mano de obra", amount: 18600, percentage: 40.0 },
        { category: "Otros", amount: 1800, percentage: 4.8 }
      ]
    },

    health: {
      distribution: [
        { status: "Excelente", count: 45, percentage: 31.0 },
        { status: "Buena", count: 67, percentage: 46.2 },
        { status: "Regular", count: 28, percentage: 19.3 },
        { status: "Deficiente", count: 5, percentage: 3.5 }
      ],
      issues: [
        { issue: "Plagas", count: 12, severity: "Media" },
        { issue: "Hongos", count: 8, severity: "Baja" },
        { issue: "Deficiencias nutricionales", count: 15, severity: "Alta" },
        { issue: "Daño mecánico", count: 3, severity: "Baja" }
      ]
    }
  },

  // Productos disponibles
  products: [
    {
      id: 1,
      name: "Compost Orgánico",
      type: "fertilizer",
      category: "Orgánico",
      unit: "kg",
      stock: 500,
      cost: 2.50,
      supplier: "Abonos del Valle"
    },
    {
      id: 2,
      name: "NPK 20-20-20",
      type: "fertilizer",
      category: "Químico",
      unit: "kg",
      stock: 200,
      cost: 3.75,
      supplier: "AgroQuímicos SA"
    },
    {
      id: 3,
      name: "Aceite de Neem",
      type: "pesticide",
      category: "Orgánico",
      unit: "L",
      stock: 50,
      cost: 15.00,
      supplier: "BioControl"
    },
    {
      id: 4,
      name: "Fungicida Cúprico",
      type: "pesticide",
      category: "Orgánico",
      unit: "kg",
      stock: 25,
      cost: 8.50,
      supplier: "Protección Natural"
    }
  ],

  // Calendario de eventos
  calendar: [
    {
      id: 1,
      title: "Cosecha Sector A1",
      date: "2024-01-20",
      type: "cosecha",
      status: "programado",
      sector: "A1",
      notes: "Cosecha quincenal programada"
    },
    {
      id: 2,
      title: "Aplicación Fertilizante",
      date: "2024-01-25",
      type: "abono",
      status: "programado",
      sector: "B1-B2",
      notes: "Fertilización mensual"
    },
    {
      id: 3,
      title: "Inspección Fitosanitaria",
      date: "2024-01-28",
      type: "inspeccion",
      status: "programado",
      sector: "Todos",
      notes: "Revisión mensual de plagas y enfermedades"
    },
    {
      id: 4,
      title: "Poda de Formación",
      date: "2024-02-02",
      type: "poda",
      status: "programado",
      sector: "C1",
      notes: "Poda de árboles jóvenes"
    }
  ]
};

// Función auxiliar para calcular edad
function calculateAge(plantingDate) {
  const planted = new Date(plantingDate);
  const now = new Date();
  const diffTime = Math.abs(now - planted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  return `${years}a ${months}m`;
}

// Funciones para obtener datos específicos
export const getTreesByStatus = (status) => {
  return mockData.trees.filter(tree => tree.status === status);
};

export const getActivitiesByType = (type) => {
  return mockData.activities.filter(activity => activity.type === type);
};

export const getActivitiesByDate = (date) => {
  return mockData.activities.filter(activity => activity.date === date);
};

export const getTreeById = (id) => {
  return mockData.trees.find(tree => tree.id === parseInt(id));
};

export const getActivityById = (id) => {
  return mockData.activities.find(activity => activity.id === parseInt(id));
};

export const getProductsByType = (type) => {
  return mockData.products.filter(product => product.type === type);
};

// Funciones para estadísticas
export const getTotalProduction = () => {
  return mockData.analytics.production.monthly.reduce((total, month) => total + month.harvest, 0);
};

export const getAverageHealth = () => {
  const healthScores = {
    'Excelente': 4,
    'Buena': 3,
    'Regular': 2,
    'Deficiente': 1
  };
  
  const totalScore = mockData.trees.reduce((sum, tree) => sum + healthScores[tree.health], 0);
  return totalScore / mockData.trees.length;
};

export const getProductionEfficiency = () => {
  const totalActual = mockData.analytics.production.monthly.reduce((sum, month) => sum + month.harvest, 0);
  const totalExpected = mockData.analytics.production.monthly.reduce((sum, month) => sum + month.expected, 0);
  return ((totalActual / totalExpected) * 100).toFixed(1);
};

// Exponer datos globalmente
window.mockData = mockData;