// js/data/mockData.js
// === MOCK DATA ===
const mockData = {
    trees: [
        {
            id: 'L001',
            variety: 'Eureka',
            plantedDate: '2020-03-15',
            location: { 
                sector: 'A1',
                coordinates: { lat: 14.6349, lng: -90.5069 }
            },
            health: 'Excelente',
            productivity: 85,
            nextHarvest: 15,
            notes: 'Árbol joven con buen desarrollo'
        },
        {
            id: 'L002',
            variety: 'Lisbon',
            plantedDate: '2019-05-20',
            location: { 
                sector: 'A2',
                coordinates: { lat: 14.6350, lng: -90.5070 }
            },
            health: 'Bueno',
            productivity: 92,
            nextHarvest: 8,
            notes: 'Alta productividad, requiere poda'
        }
    ],
    activities: [
        {
            id: generateId(),
            type: 'cosecha',
            date: new Date().toISOString().split('T')[0],
            description: 'Cosecha matutina',
            quantity: 150,
            unit: 'kg'
        }
    ],
    harvests: [],
    userSettings: {
        theme: 'light',
        language: 'es',
        notifications: true
    }
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
