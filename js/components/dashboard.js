// dashboard.js - Panel Principal de FincaLimón
class Dashboard {
    constructor() {
        this.storage = new Storage();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboardData();
    }

    bindEvents() {
        // Eventos para botones de acción rápida
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quick-action-btn')) {
                this.handleQuickAction(e.target.dataset.action);
            }
            if (e.target.matches('.tree-card')) {
                this.viewTreeDetails(e.target.dataset.treeId);
            }
        });
    }

    render() {
        return `
            <div class="dashboard-container p-6">
                <!-- Header -->
                <div class="dashboard-header mb-8">
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">
                        <i class="lucide lucide-home mr-3"></i>
                        Dashboard - Finca Limón
                    </h1>
                    <p class="text-gray-600">Resumen general de tu finca</p>
                </div>

                <!-- Métricas Principales -->
                <div class="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    ${this.renderMetrics()}
                </div>

                <!-- Gráficos y Actividades Recientes -->
                <div class="dashboard-content grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <!-- Gráfico de Productividad -->
                    <div class="productivity-chart bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-xl font-semibold mb-4">
                            <i class="lucide lucide-trending-up mr-2"></i>
                            Productividad por Mes
                        </h3>
                        <div class="chart-container h-64">
                            ${this.renderProductivityChart()}
                        </div>
                    </div>

                    <!-- Actividades Recientes -->
                    <div class="recent-activities bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-xl font-semibold mb-4">
                            <i class="lucide lucide-clock mr-2"></i>
                            Actividades Recientes
                        </h3>
                        <div class="activities-list">
                            ${this.renderRecentActivities()}
                        </div>
                    </div>
                </div>

                <!-- Árboles que Necesitan Atención -->
                <div class="attention-trees bg-white rounded-lg shadow-md p-6 mb-8">
                    <h3 class="text-xl font-semibold mb-4">
                        <i class="lucide lucide-alert-triangle mr-2"></i>
                        Árboles que Necesitan Atención
                    </h3>
                    <div class="trees-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.renderAttentionTrees()}
                    </div>
                </div>

                <!-- Acciones Rápidas -->
                <div class="quick-actions bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-xl font-semibold mb-4">
                        <i class="lucide lucide-zap mr-2"></i>
                        Acciones Rápidas
                    </h3>
                    <div class="actions-grid grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${this.renderQuickActions()}
                    </div>
                </div>
            </div>
        `;
    }

    renderMetrics() {
        const trees = this.storage.getTrees();
        const activities = this.storage.getActivities();
        
        const totalTrees = trees.length;
        const healthyTrees = trees.filter(t => t.health === 'Excelente' || t.health === 'Bueno').length;
        const totalHarvest = activities
            .filter(a => a.type === 'cosecha')
            .reduce((sum, a) => sum + (a.quantity || 0), 0);
        const monthlyProduction = this.getMonthlyProduction();

        const metrics = [
            {
                title: 'Total Árboles',
                value: totalTrees,
                icon: 'tree-palm',
                color: 'green',
                trend: '+2 este mes'
            },
            {
                title: 'Árboles Saludables',
                value: `${healthyTrees}/${totalTrees}`,
                icon: 'heart',
                color: 'emerald',
                trend: `${Math.round((healthyTrees/totalTrees)*100)}%`
            },
            {
                title: 'Cosecha Total (kg)',
                value: totalHarvest.toLocaleString(),
                icon: 'package',
                color: 'yellow',
                trend: '+12% vs mes pasado'
            },
            {
                title: 'Producción Mensual',
                value: `${monthlyProduction} kg`,
                icon: 'trending-up',
                color: 'blue',
                trend: 'Objetivo: 5000kg'
            }
        ];

        return metrics.map(metric => `
            <div class="metric-card bg-white rounded-lg shadow-md p-6 border-l-4 border-${metric.color}-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">
                            ${metric.title}
                        </p>
                        <p class="text-2xl font-bold text-gray-900 mt-2">
                            ${metric.value}
                        </p>
                        <p class="text-sm text-${metric.color}-600 mt-1">
                            ${metric.trend}
                        </p>
                    </div>
                    <div class="bg-${metric.color}-100 rounded-full p-3">
                        <i class="lucide lucide-${metric.icon} h-6 w-6 text-${metric.color}-600"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderProductivityChart() {
        const monthlyData = this.getMonthlyProductivityData();
        const maxValue = Math.max(...monthlyData.map(d => d.value));
        
        return `
            <div class="chart-bars flex items-end justify-between h-full">
                ${monthlyData.map(data => `
                    <div class="bar-container flex flex-col items-center">
                        <div class="bar bg-green-500 w-8 rounded-t transition-all duration-300 hover:bg-green-600" 
                             style="height: ${(data.value / maxValue) * 200}px"
                             title="${data.value} kg">
                        </div>
                        <span class="text-xs text-gray-600 mt-2">${data.month}</span>
                        <span class="text-xs font-semibold text-gray-800">${data.value}kg</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderRecentActivities() {
        const activities = this.storage.getActivities()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (activities.length === 0) {
            return `
                <div class="text-center text-gray-500 py-8">
                    <i class="lucide lucide-calendar-x h-12 w-12 mx-auto mb-4 opacity-50"></i>
                    <p>No hay actividades recientes</p>
                </div>
            `;
        }

        return activities.map(activity => {
            const icons = {
                'cosecha': 'package',
                'abono': 'sprout',
                'fumigacion': 'spray-can',
                'riego': 'droplets',
                'poda': 'scissors'
            };

            const colors = {
                'cosecha': 'green',
                'abono': 'blue',
                'fumigacion': 'red',
                'riego': 'cyan',
                'poda': 'orange'
            };

            return `
                <div class="activity-item flex items-center p-3 rounded-lg bg-gray-50 mb-3 hover:bg-gray-100 transition-colors">
                    <div class="activity-icon bg-${colors[activity.type]}-100 rounded-full p-2 mr-4">
                        <i class="lucide lucide-${icons[activity.type]} h-5 w-5 text-${colors[activity.type]}-600"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-medium text-gray-800">${this.capitalizeFirst(activity.type)}</p>
                        <p class="text-sm text-gray-600">Árbol ${activity.treeId} - ${formatDate(activity.date)}</p>
                        ${activity.quantity ? `<p class="text-sm text-green-600">${activity.quantity} kg</p>` : ''}
                    </div>
                    <span class="text-xs text-gray-400">
                        ${this.getTimeAgo(activity.date)}
                    </span>
                </div>
            `;
        }).join('');
    }

    renderAttentionTrees() {
        const trees = this.storage.getTrees()
            .filter(tree => tree.health === 'Regular' || tree.health === 'Malo' || tree.nextHarvest <= 7)
            .slice(0, 6);

        if (trees.length === 0) {
            return `
                <div class="col-span-full text-center text-gray-500 py-8">
                    <i class="lucide lucide-check-circle h-12 w-12 mx-auto mb-4 text-green-500"></i>
                    <p>¡Todos los árboles están en buen estado!</p>
                </div>
            `;
        }

        return trees.map(tree => `
            <div class="tree-card bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                 data-tree-id="${tree.id}">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-800">${tree.id}</h4>
                    <span class="health-badge ${this.getHealthBadgeClass(tree.health)} px-2 py-1 rounded-full text-xs">
                        ${tree.health}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-2">${tree.variety}</p>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500">
                        <i class="lucide lucide-map-pin h-4 w-4 mr-1"></i>
                        ${tree.location.sector}
                    </span>
                    ${tree.nextHarvest <= 7 ? `
                        <span class="text-orange-600">
                            <i class="lucide lucide-clock h-4 w-4 mr-1"></i>
                            Cosecha en ${tree.nextHarvest} días
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderQuickActions() {
        const actions = [
            {
                title: 'Nueva Cosecha',
                icon: 'package',
                color: 'green',
                action: 'new-harvest'
            },
            {
                title: 'Aplicar Abono',
                icon: 'sprout',
                color: 'blue',
                action: 'new-fertilizer'
            },
            {
                title: 'Fumigación',
                icon: 'spray-can',
                color: 'red',
                action: 'new-fumigation'
            },
            {
                title: 'Ver Mapa',
                icon: 'map',
                color: 'purple',
                action: 'view-map'
            }
        ];

        return actions.map(action => `
            <button class="quick-action-btn bg-white border-2 border-${action.color}-200 rounded-lg p-4 text-center hover:border-${action.color}-400 hover:bg-${action.color}-50 transition-all"
                    data-action="${action.action}">
                <div class="bg-${action.color}-100 rounded-full p-3 mx-auto mb-3 w-fit">
                    <i class="lucide lucide-${action.icon} h-6 w-6 text-${action.color}-600"></i>
                </div>
                <p class="font-medium text-gray-800">${action.title}</p>
            </button>
        `).join('');
    }

    // Métodos auxiliares
    getMonthlyProduction() {
        const activities = this.storage.getActivities();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return activities
            .filter(a => {
                const activityDate = new Date(a.date);
                return a.type === 'cosecha' && 
                       activityDate.getMonth() === currentMonth && 
                       activityDate.getFullYear() === currentYear;
            })
            .reduce((sum, a) => sum + (a.quantity || 0), 0);
    }

    getMonthlyProductivityData() {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        return months.map(month => ({
            month,
            value: Math.floor(Math.random() * 3000) + 1000 // Datos simulados
        }));
    }

    getHealthBadgeClass(health) {
        const classes = {
            'Excelente': 'bg-green-100 text-green-800',
            'Bueno': 'bg-blue-100 text-blue-800',
            'Regular': 'bg-yellow-100 text-yellow-800',
            'Malo': 'bg-red-100 text-red-800'
        };
        return classes[health] || 'bg-gray-100 text-gray-800';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getTimeAgo(date) {
        const now = new Date();
        const activityDate = new Date(date);
        const diffTime = Math.abs(now - activityDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.ceil(diffDays/7)} semanas`;
        return `Hace ${Math.ceil(diffDays/30)} meses`;
    }

    handleQuickAction(action) {
        switch (action) {
            case 'new-harvest':
                window.app.showSection('activities');
                // Aquí puedes agregar lógica para abrir directamente el formulario de cosecha
                break;
            case 'new-fertilizer':
                window.app.showSection('activities');
                break;
            case 'new-fumigation':
                window.app.showSection('activities');
                break;
            case 'view-map':
                window.app.showSection('map');
                break;
        }
    }

    viewTreeDetails(treeId) {
        window.app.showSection('trees');
        // Aquí puedes agregar lógica para mostrar los detalles específicos del árbol
    }

    loadDashboardData() {
        // Cargar datos adicionales si es necesario
        console.log('Dashboard data loaded');
    }
}

// Hacer la clase disponible globalmente
window.Dashboard = Dashboard;