// js/utils/helpers.js

// Formateo de fechas
const formatDate = (dateString, format = 'dd/mm/yyyy') => {  // <-- Solo 'const'
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`;
    case 'mm/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'yyyy-mm-dd':
      return `${year}-${month}-${day}`;
    case 'long':
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return `${day} de ${months[date.getMonth()]} de ${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

// Formateo de números
export const formatNumber = (number, decimals = 2) => {
  return Number(number).toFixed(decimals);
};

// Formateo de moneda
export const formatCurrency = (amount, currency = 'GTQ') => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Formateo de peso
export const formatWeight = (weight, unit = 'kg') => {
  if (weight < 1000) {
    return `${formatNumber(weight)} ${unit}`;
  }
  return `${formatNumber(weight / 1000)} t`;
};

// Validación de email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validación de números
export const isValidNumber = (value) => {
  return !isNaN(value) && isFinite(value) && value !== '';
};

// Generar ID único
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Calcular edad de árbol
export const calculateTreeAge = (plantingDate) => {
  const planted = new Date(plantingDate);
  const now = new Date();
  const diffTime = Math.abs(now - planted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years === 0) {
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  }
  
  return months > 0 ? `${years} año${years !== 1 ? 's' : ''} ${months} mes${months !== 1 ? 'es' : ''}` : `${years} año${years !== 1 ? 's' : ''}`;
};

// Calcular días desde la última actividad
export const daysSinceLastActivity = (lastDate) => {
  const last = new Date(lastDate);
  const now = new Date();
  const diffTime = Math.abs(now - last);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Obtener color según el estado de salud
export const getHealthColor = (health) => {
  const colors = {
    'Excelente': 'text-green-600 bg-green-100',
    'Buena': 'text-blue-600 bg-blue-100',
    'Regular': 'text-yellow-600 bg-yellow-100',
    'Deficiente': 'text-red-600 bg-red-100'
  };
  return colors[health] || 'text-gray-600 bg-gray-100';
};

// Obtener color según el tipo de actividad
export const getActivityColor = (type) => {
  const colors = {
    'cosecha': 'text-green-600 bg-green-100',
    'abono': 'text-blue-600 bg-blue-100',
    'fumigacion': 'text-purple-600 bg-purple-100',
    'riego': 'text-cyan-600 bg-cyan-100',
    'poda': 'text-orange-600 bg-orange-100',
    'inspeccion': 'text-gray-600 bg-gray-100'
  };
  return colors[type] || 'text-gray-600 bg-gray-100';
};

// Obtener icono según el tipo de actividad
export const getActivityIcon = (type) => {
  const icons = {
    'cosecha': 'Scissors',
    'abono': 'Droplets',
    'fumigacion': 'Spray',
    'riego': 'CloudRain',
    'poda': 'TreePine',
    'inspeccion': 'Search'
  };
  return icons[type] || 'Activity';
};

// Limpiar y validar entrada de texto
export const sanitizeInput = (input) => {
  return input.toString().trim().replace(/[<>]/g, '');
};

// Capitalizar primera letra
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convertir a formato de título
export const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// Generar color aleatorio para gráficos
export const getRandomColor = (opacity = 1) => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Calcular porcentaje
export const calculatePercentage = (partial, total) => {
  if (total === 0) return 0;
  return ((partial / total) * 100).toFixed(1);
};

// Agrupar array por propiedad
export const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
};

// Filtrar objetos por múltiples criterios
export const multiFilter = (array, filters) => {
  return array.filter(item => {
    return Object.keys(filters).every(key => {
      if (!filters[key] || filters[key] === '') return true;
      return item[key].toString().toLowerCase().includes(filters[key].toLowerCase());
    });
  });
};

// Ordenar array por múltiples campos
export const multiSort = (array, sortBy) => {
  return array.sort((a, b) => {
    for (let { field, direction } of sortBy) {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// Debounce para optimizar búsquedas
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle para limitar ejecuciones
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// Crear notificación toast
export const showToast = (message, type = 'info', duration = 3000) => {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
  
  const colors = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white'
  };
  
  toast.className += ` ${colors[type]}`;
  toast.innerHTML = `
    <div class="flex items-center">
      <span>${message}</span>
      <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
        ×
      </button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Mostrar toast
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);
  
  // Auto ocultar
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Crear contenedor de toasts
const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-50 space-y-2';
  document.body.appendChild(container);
  return container;
};

// Exportar datos a CSV
export const exportToCSV = (data, filename = 'export.csv') => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Convertir array a CSV
const convertToCSV = (data) => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

// Validar coordenadas GPS
export const isValidCoordinate = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Calcular distancia entre dos puntos GPS
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
};

