// activities.js - Gestión de Actividades FincaLimón
class Activities {
    constructor() {
        this.storage = new Storage();
        this.currentTab = 'all';
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.activity-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
            if (e.target.matches('.add-activity-btn')) {
                this.showActivityModal(e.target.dataset.type);
            }
            if (e.target.matches('.edit-activity-btn')) {
                this.editActivity(e.target.dataset.activityId);
            }
            if (e.target.matches('.delete-activity-btn')) {
                this.deleteActivity(e.target.dataset.activityId);
            }
            if (e.target.matches('.filter-period')) {
                this.setFilter(e.target.dataset.period);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('#activity-search')) {
                this.filterActivities(e.target.value);
            }
        });
    }

    render() {
        const activities = this.getFilteredActivities();
        
        return `
            <div class="activities-container p-6">
                <!-- Header -->
                <div class="activities-header mb-8">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                                <i class="lucide lucide-clipboard-list mr-3"></i>
                                Gestión de Actividades
                            </h1>
                            <p class="text-gray-600">Registra y monitorea todas las actividades de tu finca</p>
                        </div>
                        <div class="flex space-x-2 mt-4 md:mt-0">
                            <button class="add-activity-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                    data-type="cosecha">
                                <i class="lucide lucide-package mr-2"></i>
                                Nueva Cosecha
                            </button>
                            <button class="add-activity-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                    data-type="abono">
                                <i class="lucide lucide-sprout mr-2"></i>
                                Aplicar Abono
                            </button>
                            <button class="add-activity-btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                    data-type="fumigacion">
                                <i class="lucide lucide-spray-can mr-2"></i>
                                Fumigación
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas Rápidas -->
                <div class="stats-section mb-8">
                    ${this.renderQuickStats()}
                </div>

                <!-- Controles -->
                <div class="controls-section bg-white rounded-lg shadow-md p-6 mb-8">
                    <!-- Tabs de Actividades -->
                    <div class="activity-tabs mb-6">
                        <div class="flex flex-wrap gap-2">
                            <button class="activity-tab px-4 py-2 rounded-lg font-medium transition-colors ${this.currentTab === 'all' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                    data-tab="all">
                                <i class="lucide lucide-list mr-2"></i>Todas
                            </button>
                            <button class="activity-tab px-4 py-2 rounded-lg font-medium transition-colors ${this.currentTab === 'cosecha' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                    data-tab="cosecha">
                                <i class="lucide lucide-package mr-2"></i>Cosechas
                            </button>
                            <button class="activity-tab px-4 py-2 rounded-lg font-medium transition-colors ${this.currentTab === 'abono' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                    data-tab="abono">
                                <i class="lucide lucide-sprout mr-2"></i>Abonos
                            </button>
                            <button class="activity-tab px-4 py-2 rounded-lg font-medium transition-colors ${this.currentTab === 'fumigacion' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                    data-tab="fumigacion">
                                <i class="lucide lucide-spray-can mr-2"></i>Fumigaciones
                            </button>
                            <button class="activity-tab px-4 py-2 rounded-lg font-medium transition-colors ${this.currentTab === 'riego' ? 'bg-cyan-100 text-cyan-700 border border-cyan-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                    data-tab="riego">
                                <i class="lucide lucide-droplets mr-2"></i>Riego
                            </button>
                            <button class="activity-tab px-4 py-2 rounded-lg font-medium transition-colors ${this.currentTab === 'poda' ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                                    data-tab="poda">
                                <i class="lucide lucide-scissors mr-2"></i>Poda
                            </button>
                        </div>
                    </div>

                    <!-- Filtros y Búsqueda -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Búsqueda -->
                        <div class="search-control">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Actividad</label>
                            <div class="relative">
                                <input type="text" 
                                       id="activity-search" 
                                       placeholder="Buscar por árbol, producto, notas..."
                                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <i class="lucide lucide-search absolute left-3 top-2.5 h-5 w-5 text-gray-400"></i>
                            </div>
                        </div>

                        <!-- Filtro por Período -->
                        <div class="period-control">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Período</label>
                            <div class="flex flex-wrap gap-2">
                                <button class="filter-period px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'all' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-period="all">Todos</button>
                                <button class="filter-period px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'today' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-period="today">Hoy</button>
                                <button class="filter-period px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'week' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-period="week">Esta Semana</button>
                                <button class="filter-period px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'month' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-period="month">Este Mes</button>
                            </div>
                        </div>

                        <!-- Exportar -->
                        <div class="export-control">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Exportar Datos</label>
                            <button class="export-btn w-full bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                                <i class="lucide lucide-download mr-2"></i>
                                Exportar a CSV
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Lista de Actividades -->
                <div class="activities-list">
                    ${activities.length > 0 ? this.renderActivitiesList(activities) : this.renderEmptyState()}
                </div>

                <!-- Modal para Agregar/Editar Actividad -->
                <div id="activity-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="modal-content bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
                        ${this.renderActivityModal()}
                    </div>
                </div>
            </div>
        `;
    }

    renderQuickStats() {
        const activities = this.storage.getActivities();
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        const stats = {
            todayActivities: activities.filter(a => new Date(a.date).toDateString() === today).length,
            monthlyHarvest: activities
                .filter(a => {
                    const activityDate = new Date(a.date);
                    return a.type === 'cosecha' && 
                           activityDate.getMonth() === thisMonth && 
                           activityDate.getFullYear() === thisYear;
                })
                .reduce((sum, a) => sum + (a.quantity || 0), 0),
            pendingActivities: this.getPendingActivities().length,
            totalActivities: activities.length
        };

        return `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="stat-card bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">Actividades Hoy</p>
                            <p class="text-2xl font-bold text-gray-900 mt-2">${stats.todayActivities}</p>
                        </div>
                        <div class="bg-blue-100 rounded-full p-3">
                            <i class="lucide lucide-calendar-days h-6 w-6 text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">Cosecha Mensual</p>
                            <p class="text-2xl font-bold text-gray-900 mt-2">${stats.monthlyHarvest} kg</p>
                        </div>
                        <div class="bg-green-100 rounded-full p-3">
                            <i class="lucide lucide-package h-6 w-6 text-green-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">Pendientes</p>
                            <p class="text-2xl font-bold text-gray-900 mt-2">${stats.pendingActivities}</p>
                        </div>
                        <div class="bg-orange-100 rounded-full p-3">
                            <i class="lucide lucide-clock h-6 w-6 text-orange-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Actividades</p>
                            <p class="text-2xl font-bold text-gray-900 mt-2">${stats.totalActivities}</p>
                        </div>
                        <div class="bg-purple-100 rounded-full p-3">
                            <i class="lucide lucide-activity h-6 w-6 text-purple-600"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderActivitiesList(activities) {
        if (activities.length === 0) {
            return this.renderEmptyState();
        }

        // Agrupar actividades por fecha
        const groupedActivities = activities.reduce((groups, activity) => {
            const date = formatDate(activity.date);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
            return groups;
        }, {});

        const sortedDates = Object.keys(groupedActivities).sort((a, b) => new Date(b) - new Date(a));

        return `
            <div class="activities-timeline">
                ${sortedDates.map(date => `
                    <div class="date-group mb-8">
                        <div class="date-header sticky top-0 bg-gray-100 px-4 py-2 rounded-lg mb-4 z-10">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="lucide lucide-calendar mr-2"></i>
                                ${date}
                            </h3>
                            <span class="text-sm text-gray-600">
                                ${groupedActivities[date].length} actividad${groupedActivities[date].length > 1 ? 'es' : ''}
                            </span>
                        </div>
                        
                        <div class="activities-group space-y-4">
                            ${groupedActivities[date].map(activity => this.renderActivityCard(activity)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderActivityCard(activity) {
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

        const color = colors[activity.type] || 'gray';
        const icon = icons[activity.type] || 'activity';

        return `
            <div class="activity-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-${color}-500">
                <div class="p-6">
                    <div class="flex items-start justify-between">
                        <!-- Información Principal -->
                        <div class="flex items-start space-x-4">
                            <div class="bg-${color}-100 rounded-full p-3 flex-shrink-0">
                                <i class="lucide lucide-${icon} h-6 w-6 text-${color}-600"></i>
                            </div>
                            
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <h4 class="text-lg font-semibold text-gray-800 capitalize">
                                        ${activity.type}
                                    </h4>
                                    <span class="activity-type-badge bg-${color}-100 text-${color}-800 px-2 py-1 rounded-full text-xs font-medium">
                                        ${activity.type.toUpperCase()}
                                    </span>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div class="detail-item">
                                        <span class="text-sm text-gray-600">
                                            <i class="lucide lucide-tree-palm h-4 w-4 mr-1"></i>
                                            Árbol: <strong>${activity.treeId}</strong>
                                        </span>
                                    </div>
                                    
                                    <div class="detail-item">
                                        <span class="text-sm text-gray-600">
                                            <i class="lucide lucide-clock h-4 w-4 mr-1"></i>
                                            ${this.getTimeAgo(activity.date)}
                                        </span>
                                    </div>
                                    
                                    ${activity.quantity ? `
                                        <div class="detail-item">
                                            <span class="text-sm text-gray-600">
                                                <i class="lucide lucide-package h-4 w-4 mr-1"></i>
                                                Cantidad: <strong>${activity.quantity} ${activity.unit || 'kg'}</strong>
                                            </span>
                                        </div>
                                    ` : ''}
                                    
                                    ${activity.product ? `
                                        <div class="detail-item">
                                            <span class="text-sm text-gray-600">
                                                <i class="lucide lucide-tag h-4 w-4 mr-1"></i>
                                                Producto: <strong>${activity.product}</strong>
                                            </span>
                                        </div>
                                    ` : ''}
                                    
                                    ${activity.dosage ? `
                                        <div class="detail-item">
                                            <span class="text-sm text-gray-600">
                                                <i class="lucide lucide-beaker h-4 w-4 mr-1"></i>
                                                Dosis: <strong>${activity.dosage}</strong>
                                            </span>
                                        </div>
                                    ` : ''}
                                    
                                    ${activity.worker ? `
                                        <div class="detail-item">
                                            <span class="text-sm text-gray-600">
                                                <i class="lucide lucide-user h-4 w-4 mr-1"></i>
                                                Trabajador: <strong>${activity.worker}</strong>
                                            </span>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                ${activity.notes ? `
                                    <div class="activity-notes bg-gray-50 rounded-lg p-3">
                                        <p class="text-sm text-gray-700">
                                            <i class="lucide lucide-file-text h-4 w-4 mr-1"></i>
                                            ${activity.notes}
                                        </p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Acciones -->
                        <div class="flex space-x-2 flex-shrink-0">
                            <button class="edit-activity-btn bg-blue-50 text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                                    data-activity-id="${activity.id}"
                                    title="Editar">
                                <i class="lucide lucide-edit-2 h-4 w-4"></i>
                            </button>
                            <button class="delete-activity-btn bg-red-50 text-red-700 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                    data-activity-id="${activity.id}"
                                    title="Eliminar">
                                <i class="lucide lucide-trash-2 h-4 w-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        const emptyMessages = {
            'all': {
                icon: 'clipboard-x',
                title: 'No hay actividades registradas',
                message: 'Comienza registrando tu primera actividad en la finca.'
            },
            'cosecha': {
                icon: 'package-x',
                title: 'No hay cosechas registradas',
                message: 'Registra tu primera cosecha cuando esté lista.'
            },
            'abono': {
                icon: 'sprout',
                title: 'No hay aplicaciones de abono',
                message: 'Registra la aplicación de fertilizantes y abonos.'
            },
            'fumigacion': {
                icon: 'spray-can',
                title: 'No hay fumigaciones registradas',
                message: 'Registra las fumigaciones para control de plagas.'
            }
        };

        const empty = emptyMessages[this.currentTab] || emptyMessages['all'];

        return `
            <div class="empty-state text-center py-16">
                <div class="max-w-md mx-auto">
                    <i class="lucide lucide-${empty.icon} h-24 w-24 mx-auto text-gray-300 mb-6"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-4">${empty.title}</h3>
                    <p class="text-gray-500 mb-8">${empty.message}</p>
                    <div class="space-y-2">
                        <button class="add-activity-btn bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors block w-full"
                                data-type="cosecha">
                            <i class="lucide lucide-package mr-2"></i>
                            Registrar Primera Cosecha
                        </button>
                        <button class="add-activity-btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors block w-full"
                                data-type="abono">
                            <i class="lucide lucide-sprout mr-2"></i>
                            Registrar Aplicación de Abono
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderActivityModal() {
        return `
            <div class="modal-header flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i class="lucide lucide-plus-circle mr-3"></i>
                    <span id="modal-title">Nueva Actividad</span>
                </h2>
                <button class="modal-close text-gray-400 hover:text-gray-600">
                    <i class="lucide lucide-x h-6 w-6"></i>
                </button>
            </div>

            <form id="activity-form" class="space-y-6">
                <input type="hidden" id="activity-id">
                
                <!-- Información Básica -->
                <div class="form-section">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Información Básica</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Actividad *</label>
                            <select id="activity-type" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="">Seleccionar tipo</option>
                                <option value="cosecha">Cosecha</option>
                                <option value="abono">Aplicación de Abono</option>
                                <option value="fumigacion">Fumigación</option>
                                <option value="riego">Riego</option>
                                <option value="poda">Poda</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Árbol *</label>
                            <select id="activity-tree" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="">Seleccionar árbol</option>
                                ${this.renderTreeOptions()}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
                            <input type="date" id="activity-date" required
                                   value="${new Date().toISOString().split('T')[0]}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Trabajador</label>
                            <input type="text" id="activity-worker"
                                   placeholder="Nombre del trabajador"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                    </div>
                </div>

                <!-- Detalles Específicos -->
                <div id="specific-details" class="form-section">
                    <!-- Se llenará dinámicamente según el tipo de actividad -->
                </div>

                <!-- Notas -->
                <div class="form-section">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales</label>
                    <textarea id="activity-notes" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Observaciones, comentarios adicionales..."></textarea>
                </div>

                <!-- Botones -->
                <div class="modal-actions flex space-x-4 pt-6 border-t border-gray-200">
                    <button type="button" class="modal-close flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" class="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                        <span id="submit-text">Guardar Actividad</span>
                    </button>
                </div>
            </form>
        `;
    }

    renderTreeOptions() {
        const trees = this.storage.getTrees();
        return trees.map(tree => 
            `<option value="${tree.id}">${tree.id} - ${tree.variety}</option>`
        ).join('');
    }

    // Métodos de filtrado
    getFilteredActivities() {
        let activities = this.storage.getActivities();
        
        // Filtrar por tipo de actividad (tab)
        if (this.currentTab !== 'all') {
            activities = activities.filter(activity => activity.type === this.currentTab);
        }

        // Filtrar por búsqueda
        const searchTerm = document.getElementById('activity-search')?.value?.toLowerCase() || '';
        if (searchTerm) {
            activities = activities.filter(activity => 
                activity.treeId.toLowerCase().includes(searchTerm) ||
                (activity.product && activity.product.toLowerCase().includes(searchTerm)) ||
                (activity.notes && activity.notes.toLowerCase().includes(searchTerm)) ||
                activity.type.toLowerCase().includes(searchTerm)
            );
        }

        // Filtrar por período
        if (this.currentFilter !== 'all') {
            const now = new Date();
            activities = activities.filter(activity => {
                const activityDate = new Date(activity.date);
                
                switch (this.currentFilter) {
                    case 'today':
                        return activityDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return activityDate >= weekAgo;
                    case 'month':
                        return activityDate.getMonth() === now.getMonth() && 
                               activityDate.getFullYear() === now.getFullYear();
                    default:
                        return true;
                }
            });
        }

        // Ordenar por fecha (más reciente primero)
        return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getPendingActivities() {
        // Aquí podrías implementar lógica para actividades pendientes
        // Por ejemplo, árboles que necesitan cosecha pronto
        const trees = this.storage.getTrees();
        return trees.filter(tree => tree.nextHarvest <= 7);
    }

    // Métodos de navegación
    switchTab(tab) {
        this.currentTab = tab;
        this.refreshView();
    }

    setFilter(period) {
        this.currentFilter = period;
        this.refreshView();
    }

    filterActivities(searchTerm) {
        this.refreshView();
    }

    // Métodos CRUD
    showActivityModal(type = '') {
        const modal = document.getElementById('activity-modal');
        const form = document.getElementById('activity-form');
        
        form.reset();
        document.getElementById('activity-id').value = '';
        document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];
        
        if (type) {
            document.getElementById('activity-type').value = type;
            this.updateSpecificDetails(type);
        }
        
        modal.classList.remove('hidden');
        this.bindModalEvents();
    }

    updateSpecificDetails(type) {
        const detailsContainer = document.getElementById('specific-details');
        
        let html = '<h3 class="text-lg font-semibold text-gray-800 mb-4">Detalles Específicos</h3>';
        
        switch (type) {
            case 'cosecha':
                html += this.renderHarvestDetails();
                break;
            case 'abono':
                html += this.renderFertilizerDetails();
                break;
            case 'fumigacion':
                html += this.renderFumigationDetails();
                break;
            case 'riego':
                html += this.renderIrrigationDetails();
                break;
            case 'poda':
                html += this.renderPruningDetails();
                break;
            default:
                html = '';
        }
        
        detailsContainer.innerHTML = html;
    }

    renderHarvestDetails() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad (kg) *</label>
                    <input type="number" id="harvest-quantity" step="0.1" min="0" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Calidad</label>
                    <select id="harvest-quality"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="Excelente">Excelente</option>
                        <option value="Buena" selected>Buena</option>
                        <option value="Regular">Regular</option>
                        <option value="Mala">Mala</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderFertilizerDetails() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Producto *</label>
                    <input type="text" id="fertilizer-product" required
                           placeholder="Nombre del fertilizante"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Dosis *</label>
                    <input type="text" id="fertilizer-dosage" required
                           placeholder="Ej: 200g por árbol"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Método de Aplicación</label>
                    <select id="fertilizer-method"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="Al suelo">Al suelo</option>
                        <option value="Foliar">Foliar</option>
                        <option value="Fertiriego">Fertiriego</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Costo</label>
                    <input type="number" id="fertilizer-cost" step="0.01" min="0"
                           placeholder="0.00"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
            </div>
        `;
    }

    renderFumigationDetails() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Producto *</label>
                    <input type="text" id="fumigation-product" required
                           placeholder="Nombre del pesticida"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Dosis *</label>
                    <input type="text" id="fumigation-dosage" required
                           placeholder="Ej: 2ml por litro"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Objetivo</label>
                    <select id="fumigation-target"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="Plagas">Plagas</option>
                        <option value="Hongos">Hongos</option>
                        <option value="Preventivo">Preventivo</option>
                        <option value="Malezas">Malezas</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Período de Carencia (días)</label>
                    <input type="number" id="fumigation-waiting" min="0"
                           placeholder="0"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
            </div>
        `;
    }

    renderIrrigationDetails() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Duración (minutos)</label>
                    <input type="number" id="irrigation-duration" min="1"
                           placeholder="30"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Método</label>
                    <select id="irrigation-method"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="Goteo">Goteo</option>
                        <option value="Aspersión">Aspersión</option>
                        <option value="Manual">Manual</option>
                        <option value="Inundación">Inundación</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderPruningDetails() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Poda</label>
                    <select id="pruning-type"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="Formación">Formación</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Sanitaria">Sanitaria</option>
                        <option value="Producción">Producción</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Intensidad</label>
                    <select id="pruning-intensity"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="Ligera">Ligera</option>
                        <option value="Moderada">Moderada</option>
                        <option value="Severa">Severa</option>
                    </select>
                </div>
            </div>
        `;
    }

    bindModalEvents() {
        const modal = document.getElementById('activity-modal');
        const form = document.getElementById('activity-form');
        const typeSelect = document.getElementById('activity-type');
        
        // Cerrar modal
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = () => modal.classList.add('hidden');
        });
        
        // Cerrar al hacer clic fuera del modal
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        };
        
        // Actualizar detalles específicos cuando cambie el tipo
        typeSelect.onchange = (e) => {
            this.updateSpecificDetails(e.target.value);
        };
        
        // Manejar envío del formulario
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveActivity();
        };
    }

    saveActivity() {
        const form = document.getElementById('activity-form');
        const activityType = document.getElementById('activity-type').value;
        
        const baseData = {
            type: activityType,
            treeId: document.getElementById('activity-tree').value,
            date: document.getElementById('activity-date').value,
            worker: document.getElementById('activity-worker').value,
            notes: document.getElementById('activity-notes').value
        };
        
        // Agregar datos específicos según el tipo de actividad
        let specificData = {};
        
        switch (activityType) {
            case 'cosecha':
                specificData = {
                    quantity: parseFloat(document.getElementById('harvest-quantity').value),
                    unit: 'kg',
                    quality: document.getElementById('harvest-quality').value
                };
                break;
                
            case 'abono':
                specificData = {
                    product: document.getElementById('fertilizer-product').value,
                    dosage: document.getElementById('fertilizer-dosage').value,
                    method: document.getElementById('fertilizer-method').value,
                    cost: parseFloat(document.getElementById('fertilizer-cost').value) || 0
                };
                break;
                
            case 'fumigacion':
                specificData = {
                    product: document.getElementById('fumigation-product').value,
                    dosage: document.getElementById('fumigation-dosage').value,
                    target: document.getElementById('fumigation-target').value,
                    waitingPeriod: parseInt(document.getElementById('fumigation-waiting').value) || 0
                };
                break;
                
            case 'riego':
                specificData = {
                    duration: parseInt(document.getElementById('irrigation-duration').value),
                    method: document.getElementById('irrigation-method').value
                };
                break;
                
            case 'poda':
                specificData = {
                    pruningType: document.getElementById('pruning-type').value,
                    intensity: document.getElementById('pruning-intensity').value
                };
                break;
        }
        
        const activityData = { ...baseData, ...specificData };
        const existingId = document.getElementById('activity-id').value;
        
        if (existingId) {
            // Actualizando actividad existente
            activityData.id = existingId;
            this.storage.updateActivity(existingId, activityData);
            showNotification('Actividad actualizada correctamente', 'success');
        } else {
            // Agregando nueva actividad
            activityData.id = generateId();
            this.storage.addActivity(activityData);
            showNotification('Nueva actividad registrada correctamente', 'success');
        }
        
        document.getElementById('activity-modal').classList.add('hidden');
        this.refreshView();
    }

    editActivity(activityId) {
        const activity = this.storage.getActivities().find(a => a.id === activityId);
        if (!activity) return;
        
        const modal = document.getElementById('activity-modal');
        const form = document.getElementById('activity-form');
        
        // Llenar formulario con datos existentes
        document.getElementById('activity-id').value = activity.id;
        document.getElementById('activity-type').value = activity.type;
        document.getElementById('activity-tree').value = activity.treeId;
        document.getElementById('activity-date').value = activity.date;
        document.getElementById('activity-worker').value = activity.worker || '';
        document.getElementById('activity-notes').value = activity.notes || '';
        
        // Actualizar detalles específicos
        this.updateSpecificDetails(activity.type);
        
        // Llenar campos específicos después de que se rendericen
        setTimeout(() => {
            switch (activity.type) {
                case 'cosecha':
                    if (document.getElementById('harvest-quantity')) {
                        document.getElementById('harvest-quantity').value = activity.quantity || '';
                        document.getElementById('harvest-quality').value = activity.quality || 'Buena';
                    }
                    break;
                    
                case 'abono':
                    if (document.getElementById('fertilizer-product')) {
                        document.getElementById('fertilizer-product').value = activity.product || '';
                        document.getElementById('fertilizer-dosage').value = activity.dosage || '';
                        document.getElementById('fertilizer-method').value = activity.method || 'Al suelo';
                        document.getElementById('fertilizer-cost').value = activity.cost || '';
                    }
                    break;
                    
                case 'fumigacion':
                    if (document.getElementById('fumigation-product')) {
                        document.getElementById('fumigation-product').value = activity.product || '';
                        document.getElementById('fumigation-dosage').value = activity.dosage || '';
                        document.getElementById('fumigation-target').value = activity.target || 'Plagas';
                        document.getElementById('fumigation-waiting').value = activity.waitingPeriod || '';
                    }
                    break;
                    
                case 'riego':
                    if (document.getElementById('irrigation-duration')) {
                        document.getElementById('irrigation-duration').value = activity.duration || '';
                        document.getElementById('irrigation-method').value = activity.method || 'Goteo';
                    }
                    break;
                    
                case 'poda':
                    if (document.getElementById('pruning-type')) {
                        document.getElementById('pruning-type').value = activity.pruningType || 'Mantenimiento';
                        document.getElementById('pruning-intensity').value = activity.intensity || 'Moderada';
                    }
                    break;
            }
        }, 100);
        
        modal.classList.remove('hidden');
        this.bindModalEvents();
    }

    deleteActivity(activityId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta actividad? Esta acción no se puede deshacer.')) {
            this.storage.deleteActivity(activityId);
            showNotification('Actividad eliminada correctamente', 'success');
            this.refreshView();
        }
    }

    // Métodos auxiliares
    getTimeAgo(date) {
        const now = new Date();
        const activityDate = new Date(date);
        const diffTime = Math.abs(now - activityDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.ceil(diffDays/7)} semanas`;
        return `Hace ${Math.ceil(diffDays/30)} meses`;
    }

    exportToCSV() {
        const activities = this.getFilteredActivities();
        
        if (activities.length === 0) {
            showNotification('No hay datos para exportar', 'warning');
            return;
        }
        
        // Crear encabezados CSV
        const headers = [
            'Fecha',
            'Tipo',
            'Árbol',
            'Trabajador',
            'Producto',
            'Cantidad',
            'Unidad',
            'Calidad',
            'Dosis',
            'Método',
            'Costo',
            'Notas'
        ];
        
        // Convertir actividades a filas CSV
        const rows = activities.map(activity => [
            formatDate(activity.date),
            activity.type,
            activity.treeId,
            activity.worker || '',
            activity.product || '',
            activity.quantity || '',
            activity.unit || '',
            activity.quality || '',
            activity.dosage || '',
            activity.method || '',
            activity.cost || '',
            activity.notes || ''
        ]);
        
        // Crear contenido CSV
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `actividades_finca_limon_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showNotification('Datos exportados correctamente', 'success');
    }

    refreshView() {
        const content = document.getElementById('main-content');
        if (content && content.innerHTML.includes('activities-container')) {
            content.innerHTML = this.render();
            
            // Re-bindear evento de exportación
            document.querySelector('.export-btn')?.addEventListener('click', () => {
                this.exportToCSV();
            });
        }
    }
}

// Hacer la clase disponible globalmente
window.Activities = Activities;