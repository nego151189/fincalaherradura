// trees.js - Gestión de Árboles FincaLimón (VERSIÓN CORREGIDA)
class Trees {
    constructor(options = {}) {
        this.container = options.container || '#content-area';
        this.storage = window.StorageManager || null;
        this.currentFilter = 'all';
        this.currentSort = 'id';
        this.selectedTrees = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Usar event delegation para manejar clicks dinámicamente
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-tree-btn')) {
                this.showAddTreeModal();
                return;
            }
            
            if (e.target.closest('.edit-tree-btn')) {
                const treeId = e.target.closest('.edit-tree-btn').dataset.treeId;
                this.showEditTreeModal(treeId);
                return;
            }
            
            if (e.target.closest('.delete-tree-btn')) {
                const treeId = e.target.closest('.delete-tree-btn').dataset.treeId;
                this.deleteTree(treeId);
                return;
            }
            
            if (e.target.closest('.filter-btn')) {
                const filter = e.target.closest('.filter-btn').dataset.filter;
                this.setFilter(filter);
                return;
            }
            
            if (e.target.closest('.tree-card')) {
                const treeId = e.target.closest('.tree-card').dataset.treeId;
                this.selectTree(treeId);
                return;
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('#search-trees')) {
                this.filterTrees(e.target.value);
            }
            
            if (e.target.matches('.sort-select')) {
                this.setSort(e.target.value);
            }
        });
    }

    async getTreesData() {
        try {
            if (this.storage) {
                return await this.storage.getTrees();
            }
            
            // Fallback a datos mock si no hay storage
            return window.mockData?.trees || [];
        } catch (error) {
            console.error('Error obteniendo árboles:', error);
            return [];
        }
    }

    async render() {
        const trees = await this.getTreesData();
        
        return `
            <div class="trees-container p-6">
                <!-- Header -->
                <div class="trees-header mb-8">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                                <i data-lucide="tree-pine" class="mr-3"></i>
                                Gestión de Árboles
                            </h1>
                            <p class="text-gray-600">Administra y monitorea todos tus árboles de limón</p>
                        </div>
                        <button class="add-tree-btn bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mt-4 md:mt-0">
                            <i data-lucide="plus" class="mr-2"></i>
                            Agregar Árbol
                        </button>
                    </div>
                </div>

                <!-- Controles y Filtros -->
                <div class="controls-section bg-white rounded-lg shadow-md p-6 mb-8">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Búsqueda -->
                        <div class="search-control">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Árbol</label>
                            <div class="relative">
                                <input type="text" 
                                       id="search-trees" 
                                       placeholder="Buscar por ID, variedad o sector..."
                                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <i data-lucide="search" class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"></i>
                            </div>
                        </div>

                        <!-- Filtros por Estado -->
                        <div class="filter-control">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Filtrar por Estado</label>
                            <div class="flex flex-wrap gap-2">
                                <button class="filter-btn px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'all' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-filter="all">Todos</button>
                                <button class="filter-btn px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'excellent' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-filter="excellent">Excelente</button>
                                <button class="filter-btn px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'good' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-filter="good">Bueno</button>
                                <button class="filter-btn px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'regular' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-filter="regular">Regular</button>
                                <button class="filter-btn px-3 py-1 rounded-full text-sm font-medium border transition-colors ${this.currentFilter === 'bad' ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}" 
                                        data-filter="bad">Malo</button>
                            </div>
                        </div>

                        <!-- Ordenar -->
                        <div class="sort-control">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                            <select class="sort-select w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="id">ID del Árbol</option>
                                <option value="variety">Variedad</option>
                                <option value="health">Estado de Salud</option>
                                <option value="productivity">Productividad</option>
                                <option value="location">Ubicación</option>
                                <option value="nextHarvest">Próxima Cosecha</option>
                            </select>
                        </div>
                    </div>

                    <!-- Estadísticas Rápidas -->
                    <div class="quick-stats mt-6 pt-6 border-t border-gray-200">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            ${this.renderQuickStats(trees)}
                        </div>
                    </div>
                </div>

                <!-- Lista de Árboles -->
                <div class="trees-grid">
                    ${trees.length > 0 ? this.renderTreesGrid(trees) : this.renderEmptyState()}
                </div>

                <!-- Modal para Agregar/Editar Árbol -->
                <div id="tree-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="modal-content bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
                        ${this.renderTreeModal()}
                    </div>
                </div>
            </div>
        `;
    }

    renderQuickStats(trees) {
        const stats = {
            total: trees.length,
            healthy: trees.filter(t => ['Excelente', 'Bueno'].includes(t.health)).length,
            needsAttention: trees.filter(t => ['Regular', 'Malo'].includes(t.health)).length,
            readyHarvest: trees.filter(t => t.nextHarvest <= 7).length
        };

        return `
            <div class="stat-item text-center">
                <p class="text-2xl font-bold text-green-600">${stats.total}</p>
                <p class="text-sm text-gray-600">Total Árboles</p>
            </div>
            <div class="stat-item text-center">
                <p class="text-2xl font-bold text-blue-600">${stats.healthy}</p>
                <p class="text-sm text-gray-600">Saludables</p>
            </div>
            <div class="stat-item text-center">
                <p class="text-2xl font-bold text-yellow-600">${stats.needsAttention}</p>
                <p class="text-sm text-gray-600">Necesitan Atención</p>
            </div>
            <div class="stat-item text-center">
                <p class="text-2xl font-bold text-orange-600">${stats.readyHarvest}</p>
                <p class="text-sm text-gray-600">Listos Cosecha</p>
            </div>
        `;
    }

    renderTreesGrid(trees) {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                ${trees.map(tree => this.renderTreeCard(tree)).join('')}
            </div>
        `;
    }

    renderTreeCard(tree) {
        const healthColor = this.getHealthColor(tree.health);
        const productivityPercentage = (tree.productivity / 100) * 100;
        
        return `
            <div class="tree-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-${healthColor}-500"
                 data-tree-id="${tree.id}">
                <div class="p-6">
                    <!-- Header del Árbol -->
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${tree.id}</h3>
                        <span class="health-badge bg-${healthColor}-100 text-${healthColor}-800 px-2 py-1 rounded-full text-xs font-medium">
                            ${tree.health}
                        </span>
                    </div>

                    <!-- Información Básica -->
                    <div class="space-y-3 mb-4">
                        <div class="flex items-center text-sm text-gray-600">
                            <i data-lucide="sprout" class="h-4 w-4 mr-2"></i>
                            <span>${tree.variety}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <i data-lucide="map-pin" class="h-4 w-4 mr-2"></i>
                            <span>Sector ${tree.location.sector}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <i data-lucide="calendar" class="h-4 w-4 mr-2"></i>
                            <span>Plantado: ${this.formatDate(tree.plantedDate)}</span>
                        </div>
                    </div>

                    <!-- Barra de Productividad -->
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-gray-700">Productividad</span>
                            <span class="text-sm text-gray-600">${tree.productivity}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-${healthColor}-500 h-2 rounded-full transition-all duration-300" 
                                 style="width: ${productivityPercentage}%"></div>
                        </div>
                    </div>

                    <!-- Próxima Cosecha -->
                    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-gray-700">Próxima Cosecha</span>
                            <span class="text-sm font-semibold ${tree.nextHarvest <= 7 ? 'text-orange-600' : 'text-gray-600'}">
                                ${tree.nextHarvest} días
                            </span>
                        </div>
                    </div>

                    <!-- Coordenadas GPS -->
                    <div class="mb-4 text-xs text-gray-500">
                        <i data-lucide="map" class="h-3 w-3 mr-1"></i>
                        GPS: ${tree.location.coordinates.lat.toFixed(6)}, ${tree.location.coordinates.lng.toFixed(6)}
                    </div>

                    <!-- Acciones -->
                    <div class="flex space-x-2">
                        <button class="edit-tree-btn flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                data-tree-id="${tree.id}">
                            <i data-lucide="edit-2" class="h-4 w-4 mr-1"></i>
                            Editar
                        </button>
                        <button class="delete-tree-btn bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                data-tree-id="${tree.id}">
                            <i data-lucide="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state text-center py-16">
                <div class="max-w-md mx-auto">
                    <i data-lucide="tree-pine" class="h-24 w-24 mx-auto text-gray-300 mb-6"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-4">No se encontraron árboles</h3>
                    <p class="text-gray-500 mb-8">Comienza agregando tu primer árbol de limón para gestionar tu finca.</p>
                    <button class="add-tree-btn bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                        <i data-lucide="plus" class="mr-2"></i>
                        Agregar Primer Árbol
                    </button>
                </div>
            </div>
        `;
    }

    renderTreeModal() {
        return `
            <div class="modal-header flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800">
                    <i data-lucide="tree-pine" class="mr-3"></i>
                    <span id="modal-title">Agregar Nuevo Árbol</span>
                </h2>
                <button class="modal-close text-gray-400 hover:text-gray-600">
                    <i data-lucide="x" class="h-6 w-6"></i>
                </button>
            </div>

            <form id="tree-form" class="space-y-6">
                <input type="hidden" id="tree-id">
                
                <!-- Información Básica -->
                <div class="form-section">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Información Básica</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">ID del Árbol *</label>
                            <input type="text" id="tree-code" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                   placeholder="Ej: L001">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Variedad *</label>
                            <select id="tree-variety" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="">Seleccionar variedad</option>
                                <option value="Eureka">Eureka</option>
                                <option value="Lisbon">Lisbon</option>
                                <option value="Meyer">Meyer</option>
                                <option value="Ponderosa">Ponderosa</option>
                                <option value="Femminello">Femminello</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Plantado *</label>
                            <input type="date" id="planted-date" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Estado de Salud *</label>
                            <select id="tree-health" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="">Seleccionar estado</option>
                                <option value="Excelente">Excelente</option>
                                <option value="Bueno">Bueno</option>
                                <option value="Regular">Regular</option>
                                <option value="Malo">Malo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Ubicación -->
                <div class="form-section">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Ubicación</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Sector *</label>
                            <input type="text" id="tree-sector" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                   placeholder="Ej: A, B, C...">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Latitud</label>
                            <input type="number" id="tree-lat" step="any"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                   placeholder="14.123456">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Longitud</label>
                            <input type="number" id="tree-lng" step="any"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                   placeholder="-90.123456">
                        </div>
                    </div>
                </div>

                <!-- Productividad y Cosecha -->
                <div class="form-section">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Productividad</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Productividad (%)</label>
                            <input type="number" id="tree-productivity" min="0" max="100" value="75"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            <p class="text-xs text-gray-500 mt-1">Porcentaje de productividad esperada</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Próxima Cosecha (días)</label>
                            <input type="number" id="next-harvest" min="1" value="30"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            <p class="text-xs text-gray-500 mt-1">Días estimados para la próxima cosecha</p>
                        </div>
                    </div>
                </div>

                <!-- Notas -->
                <div class="form-section">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales</label>
                    <textarea id="tree-notes" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Observaciones especiales sobre el árbol..."></textarea>
                </div>

                <!-- Botones -->
                <div class="modal-actions flex space-x-4 pt-6 border-t border-gray-200">
                    <button type="button" class="modal-close flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" class="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                        <span id="submit-text">Guardar Árbol</span>
                    </button>
                </div>
            </form>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-GT');
    }

    // Métodos de filtrado y ordenamiento
    async getFilteredTrees() {
        let trees = await this.getTreesData();
        
        // Aplicar filtro de búsqueda
        const searchTerm = document.getElementById('search-trees')?.value?.toLowerCase() || '';
        if (searchTerm) {
            trees = trees.filter(tree => 
                tree.id.toLowerCase().includes(searchTerm) ||
                tree.variety.toLowerCase().includes(searchTerm) ||
                tree.location.sector.toLowerCase().includes(searchTerm)
            );
        }

        // Aplicar filtro de estado
        if (this.currentFilter !== 'all') {
            const healthMap = {
                'excellent': 'Excelente',
                'good': 'Bueno',
                'regular': 'Regular',
                'bad': 'Malo'
            };
            trees = trees.filter(tree => tree.health === healthMap[this.currentFilter]);
        }

        // Aplicar ordenamiento
        trees.sort((a, b) => {
            switch (this.currentSort) {
                case 'id':
                    return a.id.localeCompare(b.id);
                case 'variety':
                    return a.variety.localeCompare(b.variety);
                case 'health':
                    const healthOrder = ['Malo', 'Regular', 'Bueno', 'Excelente'];
                    return healthOrder.indexOf(a.health) - healthOrder.indexOf(b.health);
                case 'productivity':
                    return b.productivity - a.productivity;
                case 'location':
                    return a.location.sector.localeCompare(b.location.sector);
                case 'nextHarvest':
                    return a.nextHarvest - b.nextHarvest;
                default:
                    return 0;
            }
        });

        return trees;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.refreshView();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.refreshView();
    }

    filterTrees(searchTerm) {
        this.refreshView();
    }

    // Métodos CRUD
    showAddTreeModal() {
        console.log('Mostrando modal para agregar árbol');
        
        const modal = document.getElementById('tree-modal');
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }
        
        const form = document.getElementById('tree-form');
        const title = document.getElementById('modal-title');
        const submitText = document.getElementById('submit-text');
        
        title.textContent = 'Agregar Nuevo Árbol';
        submitText.textContent = 'Guardar Árbol';
        
        if (form) form.reset();
        document.getElementById('tree-id').value = '';
        
        // Generar próximo ID automáticamente
        this.generateNextTreeId().then(nextId => {
            document.getElementById('tree-code').value = nextId;
        });
        
        modal.classList.remove('hidden');
        this.bindModalEvents();
        
        // Inicializar iconos de Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async generateNextTreeId() {
        try {
            const trees = await this.getTreesData();
            if (trees.length === 0) return 'L001';
            
            const numbers = trees
                .filter(t => t.id && t.id.startsWith('L'))
                .map(t => {
                    const numStr = t.id.substring(1);
                    return parseInt(numStr) || 0;
                })
                .filter(n => !isNaN(n));
                
            const maxNumber = Math.max(0, ...numbers);
            return `L${(maxNumber + 1).toString().padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generando ID:', error);
            return 'L001';
        }
    }

    async showEditTreeModal(treeId) {
        const modal = document.getElementById('tree-modal');
        const form = document.getElementById('tree-form');
        const title = document.getElementById('modal-title');
        const submitText = document.getElementById('submit-text');
        
        const trees = await this.getTreesData();
        const tree = trees.find(t => t.id === treeId);
        
        if (!tree) {
            console.error('Árbol no encontrado:', treeId);
            return;
        }
        
        title.textContent = 'Editar Árbol';
        submitText.textContent = 'Actualizar Árbol';
        
        // Llenar formulario con datos existentes
        document.getElementById('tree-id').value = tree.id;
        document.getElementById('tree-code').value = tree.id;
        document.getElementById('tree-variety').value = tree.variety;
        document.getElementById('planted-date').value = tree.plantedDate;
        document.getElementById('tree-health').value = tree.health;
        document.getElementById('tree-sector').value = tree.location.sector;
        document.getElementById('tree-lat').value = tree.location.coordinates.lat;
        document.getElementById('tree-lng').value = tree.location.coordinates.lng;
        document.getElementById('tree-productivity').value = tree.productivity;
        document.getElementById('next-harvest').value = tree.nextHarvest;
        document.getElementById('tree-notes').value = tree.notes || '';
        
        modal.classList.remove('hidden');
        this.bindModalEvents();
        
        // Inicializar iconos de Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    bindModalEvents() {
        const modal = document.getElementById('tree-modal');
        const form = document.getElementById('tree-form');
        
        if (!modal || !form) return;
        
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
        
        // Manejar envío del formulario
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveTree();
        };
    }

    async saveTree() {
        const formData = {
            id: document.getElementById('tree-code').value,
            variety: document.getElementById('tree-variety').value,
            plantedDate: document.getElementById('planted-date').value,
            health: document.getElementById('tree-health').value,
            location: {
                sector: document.getElementById('tree-sector').value,
                coordinates: {
                    lat: parseFloat(document.getElementById('tree-lat').value) || 14.6349,
                    lng: parseFloat(document.getElementById('tree-lng').value) || -90.5069
                }
            },
            productivity: parseInt(document.getElementById('tree-productivity').value) || 75,
            nextHarvest: parseInt(document.getElementById('next-harvest').value) || 30,
            notes: document.getElementById('tree-notes').value
        };
        
        const existingId = document.getElementById('tree-id').value;
        
        try {
            if (this.storage) {
                if (existingId && existingId !== formData.id) {
                    // Actualizando árbol existente
                    await this.storage.updateTree(existingId, formData);
                    this.showNotification('Árbol actualizado correctamente', 'success');
                } else if (!existingId) {
                    // Agregando nuevo árbol
                    await this.storage.addTree(formData);
                    this.showNotification('Nuevo árbol agregado correctamente', 'success');
                }
            } else {
                console.log('Datos del árbol (simulación):', formData);
                this.showNotification('Árbol guardado (modo simulación)', 'info');
            }
            
            document.getElementById('tree-modal').classList.add('hidden');
            this.refreshView();
            
        } catch (error) {
            console.error('Error guardando árbol:', error);
            this.showNotification('Error al guardar el árbol', 'error');
        }
    }

    async deleteTree(treeId) {
        if (confirm('¿Estás seguro de que quieres eliminar este árbol? Esta acción no se puede deshacer.')) {
            try {
                if (this.storage) {
                    await this.storage.deleteTree(treeId);
                    this.showNotification('Árbol eliminado correctamente', 'success');
                } else {
                    console.log('Eliminando árbol (simulación):', treeId);
                    this.showNotification('Árbol eliminado (modo simulación)', 'info');
                }
                this.refreshView();
            } catch (error) {
                console.error('Error eliminando árbol:', error);
                this.showNotification('Error al eliminar el árbol', 'error');
            }
        }
    }

    // Métodos auxiliares
    getHealthColor(health) {
        const colors = {
            'Excelente': 'green',
            'Bueno': 'blue',
            'Regular': 'yellow',
            'Malo': 'red'
        };
        return colors[health] || 'gray';
    }

    selectTree(treeId) {
        if (this.selectedTrees.has(treeId)) {
            this.selectedTrees.delete(treeId);
        } else {
            this.selectedTrees.add(treeId);
        }
    }

    showNotification(message, type = 'info') {
        // Usar la función showToast global si existe
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            // Implementación de fallback
            console.log(`${type.toUpperCase()}: ${message}`);
            alert(message);
        }
    }

    async refreshView() {
        const container = document.querySelector(this.container);
        if (container) {
            container.innerHTML = await this.render();
            // Volver a vincular eventos después de renderizar
            this.bindEvents();
            
            // Inicializar iconos de Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
}

// Hacer la clase disponible globalmente
window.Trees = Trees;
