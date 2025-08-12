// js/components/analytics.js
import { formatDate, formatCurrency } from '../utils/helpers.js';
import { getFromStorage, saveToStorage } from '../utils/storage.js';
const TREE_VARIETIES = window.TREE_VARIETIES;

class Analytics {
    constructor() {
        this.trees = getFromStorage('trees') || [];
        this.activities = getFromStorage('activities') || [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Event listeners para filtros de analytics
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-analytics-filter]')) {
                this.handleFilterChange(e.target.dataset.analyticsFilter);
            }
            if (e.target.matches('[data-export-report]')) {
                this.exportReport(e.target.dataset.exportReport);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-date-filter]')) {
                this.updateDateFilter();
            }
        });
    }

    render() {
        const content = `
            <div class="analytics-container p-6 bg-white">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">📊 Analytics & Reportes</h2>
                    <p class="text-gray-600">Análisis detallado del rendimiento de tu finca</p>
                </div>

                <!-- Filtros -->
                <div class="bg-gray-50 p-4 rounded-lg mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Período</label>
                            <select data-date-filter="period" class="w-full p-2 border rounded-md">
                                <option value="last30">Últimos 30 días</option>
                                <option value="last90">Últimos 3 meses</option>
                                <option value="current_year">Año actual</option>
                                <option value="last_year">Año pasado</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Variedad</label>
                            <select data-analytics-filter="variety" class="w-full p-2 border rounded-md">
                                <option value="all">Todas las variedades</option>
                                ${TREE_VARIETIES.map(variety => 
                                    `<option value="${variety}">${variety}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Zona</label>
                            <select data-analytics-filter="zone" class="w-full p-2 border rounded-md">
                                <option value="all">Todas las zonas</option>
                                <option value="A">Zona A</option>
                                <option value="B">Zona B</option>
                                <option value="C">Zona C</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button data-export-report="pdf" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mr-2">
                                📄 Exportar PDF
                            </button>
                            <button data-export-report="excel" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                📊 Excel
                            </button>
                        </div>
                    </div>
                </div>

                <!-- KPIs Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    ${this.renderKPICards()}
                </div>

                <!-- Charts Section -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-lg font-semibold mb-4">🍋 Producción por Mes</h3>
                        <canvas id="productionChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-lg font-semibold mb-4">🌳 Rendimiento por Variedad</h3>
                        <canvas id="varietyChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-lg font-semibold mb-4">💰 Análisis de Costos</h3>
                        <canvas id="costsChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-lg font-semibold mb-4">📈 Tendencias</h3>
                        <canvas id="trendsChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Detailed Tables -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-lg font-semibold mb-4">🏆 Top 10 Árboles Productivos</h3>
                        <div class="overflow-x-auto">
                            ${this.renderTopTreesTable()}
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-lg font-semibold mb-4">⚡ Actividades Recientes</h3>
                        <div class="overflow-x-auto">
                            ${this.renderRecentActivitiesTable()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        return content;
    }

    renderKPICards() {
        const stats = this.calculateKPIs();
        
        return `
            <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                <div class="flex items-center">
                    <div class="text-3xl mr-4">🍋</div>
                    <div>
                        <p class="text-green-100">Producción Total</p>
                        <p class="text-2xl font-bold">${stats.totalProduction.toLocaleString()} kg</p>
                        <p class="text-sm text-green-100">+${stats.productionGrowth}% vs mes anterior</p>
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                <div class="flex items-center">
                    <div class="text-3xl mr-4">🌳</div>
                    <div>
                        <p class="text-blue-100">Árboles Activos</p>
                        <p class="text-2xl font-bold">${stats.activeTrees}</p>
                        <p class="text-sm text-blue-100">${stats.healthyTrees} saludables</p>
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-lg">
                <div class="flex items-center">
                    <div class="text-3xl mr-4">💰</div>
                    <div>
                        <p class="text-yellow-100">Ingresos Estimados</p>
                        <p class="text-2xl font-bold">${formatCurrency(stats.estimatedRevenue)}</p>
                        <p class="text-sm text-yellow-100">Precio: Q${stats.avgPrice}/kg</p>
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                <div class="flex items-center">
                    <div class="text-3xl mr-4">📊</div>
                    <div>
                        <p class="text-purple-100">Rendimiento Promedio</p>
                        <p class="text-2xl font-bold">${stats.avgYield} kg/árbol</p>
                        <p class="text-sm text-purple-100">Meta: 80 kg/árbol</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderTopTreesTable() {
        const topTrees = this.getTopProductiveTrees();
        
        return `
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="p-3 text-left">#</th>
                        <th class="p-3 text-left">Árbol</th>
                        <th class="p-3 text-left">Variedad</th>
                        <th class="p-3 text-left">Producción</th>
                        <th class="p-3 text-left">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${topTrees.map((tree, index) => `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-3 font-medium">${index + 1}</td>
                            <td class="p-3">${tree.code}</td>
                            <td class="p-3">${tree.variety}</td>
                            <td class="p-3 font-semibold text-green-600">${tree.totalProduction} kg</td>
                            <td class="p-3">
                                <span class="px-2 py-1 text-xs rounded-full ${this.getHealthStatusClass(tree.health)}">
                                    ${tree.health}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderRecentActivitiesTable() {
        const recentActivities = this.getRecentActivities();
        
        return `
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="p-3 text-left">Fecha</th>
                        <th class="p-3 text-left">Tipo</th>
                        <th class="p-3 text-left">Árbol</th>
                        <th class="p-3 text-left">Detalles</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentActivities.map(activity => `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-3">${formatDate(activity.date)}</td>
                            <td class="p-3">
                                <span class="px-2 py-1 text-xs rounded-full ${this.getActivityTypeClass(activity.type)}">
                                    ${this.getActivityTypeIcon(activity.type)} ${activity.type}
                                </span>
                            </td>
                            <td class="p-3 font-medium">${activity.treeCode}</td>
                            <td class="p-3 text-gray-600">${activity.details}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    calculateKPIs() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Filtrar actividades del mes actual
        const currentMonthActivities = this.activities.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate.getMonth() === currentMonth && 
                   activityDate.getFullYear() === currentYear;
        });

        // Calcular producción total
        const totalProduction = currentMonthActivities
            .filter(activity => activity.type === 'Cosecha')
            .reduce((sum, activity) => sum + (activity.quantity || 0), 0);

        // Árboles activos y saludables
        const activeTrees = this.trees.length;
        const healthyTrees = this.trees.filter(tree => tree.health === 'Saludable').length;

        // Ingresos estimados (precio promedio Q4.50/kg)
        const avgPrice = 4.50;
        const estimatedRevenue = totalProduction * avgPrice;

        // Rendimiento promedio
        const avgYield = activeTrees > 0 ? totalProduction / activeTrees : 0;

        return {
            totalProduction,
            productionGrowth: 12, // Mock data
            activeTrees,
            healthyTrees,
            estimatedRevenue,
            avgPrice,
            avgYield: parseFloat(avgYield.toFixed(1))
        };
    }

    getTopProductiveTrees() {
        // Calcular producción por árbol
        const treeProduction = {};
        
        this.activities
            .filter(activity => activity.type === 'Cosecha')
            .forEach(activity => {
                if (!treeProduction[activity.treeId]) {
                    treeProduction[activity.treeId] = 0;
                }
                treeProduction[activity.treeId] += activity.quantity || 0;
            });

        // Combinar con datos del árbol y ordenar
        return this.trees
            .map(tree => ({
                ...tree,
                totalProduction: treeProduction[tree.id] || 0
            }))
            .sort((a, b) => b.totalProduction - a.totalProduction)
            .slice(0, 10);
    }

    getRecentActivities() {
        return this.activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .map(activity => {
                const tree = this.trees.find(t => t.id === activity.treeId);
                return {
                    ...activity,
                    treeCode: tree ? tree.code : 'N/A',
                    details: this.getActivityDetails(activity)
                };
            });
    }

    getActivityDetails(activity) {
        switch(activity.type) {
            case 'Cosecha':
                return `${activity.quantity} kg - Calidad: ${activity.quality}`;
            case 'Fertilización':
                return `${activity.product} - ${activity.quantity} kg`;
            case 'Fumigación':
                return `${activity.product} - ${activity.dosage}`;
            case 'Riego':
                return `${activity.duration} min - ${activity.method}`;
            default:
                return activity.notes || 'Sin detalles';
        }
    }

    getHealthStatusClass(health) {
        const classes = {
            'Saludable': 'bg-green-100 text-green-800',
            'Advertencia': 'bg-yellow-100 text-yellow-800',
            'Enfermo': 'bg-red-100 text-red-800'
        };
        return classes[health] || 'bg-gray-100 text-gray-800';
    }

    getActivityTypeClass(type) {
        const classes = {
            'Cosecha': 'bg-green-100 text-green-800',
            'Fertilización': 'bg-blue-100 text-blue-800',
            'Fumigación': 'bg-purple-100 text-purple-800',
            'Riego': 'bg-cyan-100 text-cyan-800'
        };
        return classes[type] || 'bg-gray-100 text-gray-800';
    }

    getActivityTypeIcon(type) {
        const icons = {
            'Cosecha': '🍋',
            'Fertilización': '🌱',
            'Fumigación': '💨',
            'Riego': '💧'
        };
        return icons[type] || '📋';
    }

    handleFilterChange(filterType) {
        // Actualizar visualización según filtros
        this.updateCharts();
    }

    updateDateFilter() {
        // Actualizar datos según rango de fechas
        this.updateCharts();
    }

    updateCharts() {
        // Esta función se implementaría con una librería de charts como Chart.js
        console.log('Actualizando gráficos...');
        
        // Mock implementation - en producción usarías Chart.js
        this.renderProductionChart();
        this.renderVarietyChart();
        this.renderCostsChart();
        this.renderTrendsChart();
    }

    renderProductionChart() {
        // Mock chart rendering
        const canvas = document.getElementById('productionChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#10B981';
            ctx.fillRect(10, 10, 100, 100);
            ctx.fillStyle = '#000';
            ctx.fillText('Gráfico de Producción', 20, 130);
        }
    }

    renderVarietyChart() {
        // Mock chart rendering
        const canvas = document.getElementById('varietyChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#3B82F6';
            ctx.fillRect(10, 10, 100, 100);
            ctx.fillStyle = '#000';
            ctx.fillText('Gráfico por Variedad', 20, 130);
        }
    }

    renderCostsChart() {
        // Mock chart rendering
        const canvas = document.getElementById('costsChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#F59E0B';
            ctx.fillRect(10, 10, 100, 100);
            ctx.fillStyle = '#000';
            ctx.fillText('Análisis de Costos', 20, 130);
        }
    }

    renderTrendsChart() {
        // Mock chart rendering
        const canvas = document.getElementById('trendsChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#8B5CF6';
            ctx.fillRect(10, 10, 100, 100);
            ctx.fillStyle = '#000';
            ctx.fillText('Tendencias', 20, 130);
        }
    }

    exportReport(format) {
        const data = {
            kpis: this.calculateKPIs(),
            topTrees: this.getTopProductiveTrees(),
            recentActivities: this.getRecentActivities()
        };

        if (format === 'pdf') {
            this.exportToPDF(data);
        } else if (format === 'excel') {
            this.exportToExcel(data);
        }
    }

    exportToPDF(data) {
        // Mock PDF export
        console.log('Exportando a PDF...', data);
        alert('Funcionalidad de exportación a PDF en desarrollo.\nEn producción se usaría una librería como jsPDF.');
    }

    exportToExcel(data) {
        // Mock Excel export
        console.log('Exportando a Excel...', data);
        alert('Funcionalidad de exportación a Excel en desarrollo.\nEn producción se usaría una librería como SheetJS.');
    }

    // Método para actualizar datos
    refreshData() {
        this.trees = getFromStorage('trees') || [];
        this.activities = getFromStorage('activities') || [];
        this.updateCharts();
    }
}

export default Analytics;