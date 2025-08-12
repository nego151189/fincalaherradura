// js/components/map.js
class MapComponent {
    constructor() {
        this.currentView = 'satellite';
        this.selectedTree = null;
        this.mapCenter = { lat: 14.6349, lng: -90.5069 }; // Guatemala City default
        this.fincaBounds = {
            north: 14.6379,
            south: 14.6319,
            east: -90.5039,
            west: -90.5099
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.getUserLocation();
    }

    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.mapCenter = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.updateMapBounds();
                },
                (error) => {
                    console.log('Geolocation error:', error);
                    // Usar ubicación por defecto de Guatemala
                }
            );
        }
    }

    updateMapBounds() {
        // Ajustar bounds basado en la ubicación actual
        const offset = 0.003; // ~300 metros aproximadamente
        this.fincaBounds = {
            north: this.mapCenter.lat + offset,
            south: this.mapCenter.lat - offset,
            east: this.mapCenter.lng + offset,
            west: this.mapCenter.lng - offset
        };
    }

    render() {
        const trees = StorageManager.getTrees();
        const totalArea = this.calculateTotalArea();
        
        return `
            <div class="map-container">
                <!-- Header del Mapa -->
                <div class="bg-white rounded-lg shadow-md mb-6">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-2xl font-bold text-gray-800">
                                <i data-lucide="map-pin" class="inline-block w-6 h-6 mr-2"></i>
                                Mapa de la Finca
                            </h2>
                            <div class="flex gap-2">
                                <button onclick="mapComponent.toggleView()" 
                                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                    <i data-lucide="satellite" class="w-4 h-4 mr-2 inline-block"></i>
                                    ${this.currentView === 'satellite' ? 'Vista Normal' : 'Vista Satélite'}
                                </button>
                                <button onclick="mapComponent.centerMap()" 
                                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    <i data-lucide="navigation" class="w-4 h-4 mr-2 inline-block"></i>
                                    Centrar
                                </button>
                                <button onclick="mapComponent.exportCoordinates()" 
                                        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                    <i data-lucide="download" class="w-4 h-4 mr-2 inline-block"></i>
                                    Exportar GPS
                                </button>
                            </div>
                        </div>
                        
                        <!-- Stats del Mapa -->
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="bg-green-50 p-4 rounded-lg">
                                <div class="text-green-600 font-semibold">Área Total</div>
                                <div class="text-2xl font-bold text-green-800">${totalArea.toFixed(2)} Ha</div>
                            </div>
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <div class="text-blue-600 font-semibold">Árboles Mapeados</div>
                                <div class="text-2xl font-bold text-blue-800">${trees.length}</div>
                            </div>
                            <div class="bg-yellow-50 p-4 rounded-lg">
                                <div class="text-yellow-600 font-semibold">Densidad</div>
                                <div class="text-2xl font-bold text-yellow-800">${Math.round(trees.length / totalArea)}/Ha</div>
                            </div>
                            <div class="bg-purple-50 p-4 rounded-lg">
                                <div class="text-purple-600 font-semibold">Cobertura GPS</div>
                                <div class="text-2xl font-bold text-purple-800">${this.calculateCoverage()}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <!-- Mapa Principal -->
                    <div class="lg:col-span-3">
                        <div class="bg-white rounded-lg shadow-md overflow-hidden">
                            <div class="relative">
                                ${this.renderMap(trees)}
                                ${this.renderMapLegend()}
                            </div>
                        </div>
                    </div>

                    <!-- Panel Lateral -->
                    <div class="lg:col-span-1 space-y-6">
                        <!-- Información del Árbol Seleccionado -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i data-lucide="info" class="w-5 h-5 mr-2 inline-block"></i>
                                Información del Árbol
                            </h3>
                            <div id="selected-tree-info">
                                ${this.selectedTree ? this.renderTreeInfo(this.selectedTree) : 
                                  '<p class="text-gray-500 text-center py-8">Selecciona un árbol en el mapa</p>'}
                            </div>
                        </div>

                        <!-- Filtros del Mapa -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i data-lucide="filter" class="w-5 h-5 mr-2 inline-block"></i>
                                Filtros
                            </h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Estado de Salud</label>
                                    <select onchange="mapComponent.filterByHealth(this.value)" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                        <option value="all">Todos</option>
                                        <option value="excellent">Excelente</option>
                                        <option value="good">Bueno</option>
                                        <option value="regular">Regular</option>
                                        <option value="poor">Deficiente</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Variedad</label>
                                    <select onchange="mapComponent.filterByVariety(this.value)" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                        <option value="all">Todas</option>
                                        <option value="Eureka">Eureka</option>
                                        <option value="Lisbon">Lisbon</option>
                                        <option value="Meyer">Meyer</option>
                                        <option value="Persian">Persian</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Productividad</label>
                                    <select onchange="mapComponent.filterByProductivity(this.value)" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                        <option value="all">Todos</option>
                                        <option value="high">Alta (>80%)</option>
                                        <option value="medium">Media (50-80%)</option>
                                        <option value="low">Baja (<50%)</option>
                                    </select>
                                </div>
                                <button onclick="mapComponent.clearFilters()" 
                                        class="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                                    Limpiar Filtros
                                </button>
                            </div>
                        </div>

                        <!-- Herramientas GPS -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i data-lucide="compass" class="w-5 h-5 mr-2 inline-block"></i>
                                Herramientas GPS
                            </h3>
                            <div class="space-y-3">
                                <button onclick="mapComponent.addNewTreeGPS()" 
                                        class="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4 mr-2 inline-block"></i>
                                    Agregar Árbol GPS
                                </button>
                                <button onclick="mapComponent.measureDistance()" 
                                        class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    <i data-lucide="ruler" class="w-4 h-4 mr-2 inline-block"></i>
                                    Medir Distancia
                                </button>
                                <button onclick="mapComponent.calculateArea()" 
                                        class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                    <i data-lucide="square" class="w-4 h-4 mr-2 inline-block"></i>
                                    Calcular Área
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMap(trees) {
        const mapClass = this.currentView === 'satellite' ? 'satellite-map' : 'normal-map';
        
        return `
            <div class="relative ${mapClass}" style="height: 600px; background: ${this.currentView === 'satellite' ? 
                'linear-gradient(45deg, #2d5016, #4a7c59, #6b8e4e)' : 
                'linear-gradient(45deg, #e6f3ff, #b3d9ff, #80bfff)'}; position: relative;">
                
                <!-- Grid de coordenadas -->
                <div class="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
                        <defs>
                            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" stroke-width="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <!-- Brújula -->
                <div class="absolute top-4 left-4 bg-white bg-opacity-90 rounded-full p-3 shadow-lg">
                    <div class="relative w-16 h-16">
                        <i data-lucide="navigation" class="w-16 h-16 text-green-600"></i>
                        <div class="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600">N</div>
                    </div>
                </div>

                <!-- Escala -->
                <div class="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow-lg">
                    <div class="text-xs text-gray-700">
                        <div class="border-b border-gray-400 w-20 mb-1"></div>
                        <div>100 metros</div>
                    </div>
                </div>

                <!-- Coordenadas actuales -->
                <div class="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow-lg text-sm">
                    <div class="text-gray-700">
                        <div>Lat: ${this.mapCenter.lat.toFixed(6)}</div>
                        <div>Lng: ${this.mapCenter.lng.toFixed(6)}</div>
                    </div>
                </div>

                <!-- Árboles en el mapa -->
                <div class="absolute inset-0">
                    ${trees.map(tree => this.renderTreeMarker(tree)).join('')}
                </div>
            </div>
        `;
    }

    renderTreeMarker(tree) {
        const position = this.calculateTreePosition(tree);
        const healthColor = this.getHealthColor(tree.health);
        const isSelected = this.selectedTree?.id === tree.id;
        
        return `
            <div class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                 style="left: ${position.x}%; top: ${position.y}%;"
                 onclick="mapComponent.selectTree('${tree.id}')">
                
                <!-- Marcador del árbol -->
                <div class="relative">
                    <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg ${healthColor} 
                                ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse' : ''}"
                         style="background: ${this.getHealthBgColor(tree.health)};">
                    </div>
                    
                    <!-- Etiqueta del árbol -->
                    <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 
                                bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        ${tree.code}
                        <div class="absolute top-full left-1/2 transform -translate-x-1/2 
                                    border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>

                <!-- Área de influencia del árbol (visible solo si está seleccionado) -->
                ${isSelected ? `
                    <div class="absolute inset-0 w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 
                                border-2 border-dashed border-yellow-400 rounded-full animate-spin-slow opacity-50"></div>
                ` : ''}
            </div>
        `;
    }

    calculateTreePosition(tree) {
        // Simular posición basada en coordenadas GPS
        const latRange = this.fincaBounds.north - this.fincaBounds.south;
        const lngRange = this.fincaBounds.east - this.fincaBounds.west;
        
        // Si el árbol tiene coordenadas GPS reales, usarlas
        if (tree.gps && tree.gps.lat && tree.gps.lng) {
            const x = ((tree.gps.lng - this.fincaBounds.west) / lngRange) * 100;
            const y = ((this.fincaBounds.north - tree.gps.lat) / latRange) * 100;
            return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
        }
        
        // Si no, generar posición pseudo-aleatoria basada en el ID
        const hash = this.hashCode(tree.id);
        const x = (Math.abs(hash) % 80) + 10; // Entre 10% y 90%
        const y = (Math.abs(hash * 2) % 80) + 10;
        
        return { x, y };
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    getHealthColor(health) {
        const colors = {
            'excellent': 'border-green-500',
            'good': 'border-green-400',
            'regular': 'border-yellow-500',
            'poor': 'border-red-500'
        };
        return colors[health] || 'border-gray-400';
    }

    getHealthBgColor(health) {
        const colors = {
            'excellent': '#10b981',
            'good': '#34d399',
            'regular': '#f59e0b',
            'poor': '#ef4444'
        };
        return colors[health] || '#6b7280';
    }

    renderMapLegend() {
        return `
            <div class="absolute bottom-4 right-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg">
                <h4 class="text-sm font-semibold text-gray-800 mb-3">Leyenda</h4>
                <div class="space-y-2 text-xs">
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                        <span>Excelente</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full bg-green-400 border-2 border-white"></div>
                        <span>Bueno</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
                        <span>Regular</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                        <span>Deficiente</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderTreeInfo(treeId) {
        const tree = StorageManager.getTrees().find(t => t.id === treeId);
        if (!tree) return '<p class="text-gray-500">Árbol no encontrado</p>';

        return `
            <div class="space-y-4">
                <div class="text-center">
                    <div class="text-lg font-bold text-green-800">${tree.code}</div>
                    <div class="text-sm text-gray-600">${tree.variety}</div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div class="text-gray-500">Estado</div>
                        <div class="font-semibold capitalize">${tree.health}</div>
                    </div>
                    <div>
                        <div class="text-gray-500">Productividad</div>
                        <div class="font-semibold">${tree.productivity}%</div>
                    </div>
                </div>

                ${tree.gps && tree.gps.lat ? `
                    <div class="bg-gray-50 p-3 rounded">
                        <div class="text-xs text-gray-500 mb-1">Coordenadas GPS</div>
                        <div class="text-sm font-mono">
                            <div>Lat: ${tree.gps.lat.toFixed(6)}</div>
                            <div>Lng: ${tree.gps.lng.toFixed(6)}</div>
                            <div class="text-xs text-gray-500 mt-1">
                                Alt: ${tree.gps.altitude || 'N/A'}m
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="space-y-2 text-sm">
                    <button onclick="navigationManager.showSection('trees')" 
                            class="w-full bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors">
                        Ver Detalles
                    </button>
                    <button onclick="mapComponent.navigateToTree('${tree.id}')" 
                            class="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">
                        Navegar GPS
                    </button>
                </div>
            </div>
        `;
    }

    // Métodos de interacción
    selectTree(treeId) {
        this.selectedTree = this.selectedTree === treeId ? null : treeId;
        this.updateSelectedTreeInfo();
        HelpersManager.showToast(
            this.selectedTree ? 'Árbol seleccionado' : 'Selección limpiada', 
            'success'
        );
    }

    updateSelectedTreeInfo() {
        const infoContainer = document.getElementById('selected-tree-info');
        if (infoContainer) {
            infoContainer.innerHTML = this.selectedTree ? 
                this.renderTreeInfo(this.selectedTree) : 
                '<p class="text-gray-500 text-center py-8">Selecciona un árbol en el mapa</p>';
        }
    }

    toggleView() {
        this.currentView = this.currentView === 'satellite' ? 'normal' : 'satellite';
        this.refreshMap();
        HelpersManager.showToast(`Vista cambiada a ${this.currentView}`, 'info');
    }

    centerMap() {
        this.getUserLocation();
        setTimeout(() => {
            this.refreshMap();
            HelpersManager.showToast('Mapa centrado en tu ubicación', 'success');
        }, 500);
    }

    refreshMap() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = this.render();
            lucide.createIcons();
        }
    }

    // Métodos de filtrado
    filterByHealth(health) {
        this.currentFilter = { type: 'health', value: health };
        this.refreshMap();
        HelpersManager.showToast(`Filtrado por salud: ${health}`, 'info');
    }

    filterByVariety(variety) {
        this.currentFilter = { type: 'variety', value: variety };
        this.refreshMap();
        HelpersManager.showToast(`Filtrado por variedad: ${variety}`, 'info');
    }

    filterByProductivity(productivity) {
        this.currentFilter = { type: 'productivity', value: productivity };
        this.refreshMap();
        HelpersManager.showToast(`Filtrado por productividad: ${productivity}`, 'info');
    }

    clearFilters() {
        this.currentFilter = null;
        this.refreshMap();
        HelpersManager.showToast('Filtros limpiados', 'success');
    }

    // Herramientas GPS
    addNewTreeGPS() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const newTree = {
                    id: Date.now().toString(),
                    code: `L${String(StorageManager.getTrees().length + 1).padStart(3, '0')}`,
                    variety: 'Eureka',
                    age: 1,
                    health: 'good',
                    productivity: 50,
                    gps: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        altitude: position.coords.altitude,
                        accuracy: position.coords.accuracy
                    },
                    createdAt: new Date().toISOString()
                };

                const trees = StorageManager.getTrees();
                trees.push(newTree);
                StorageManager.saveTrees(trees);
                
                this.refreshMap();
                HelpersManager.showToast('Árbol agregado con GPS actual', 'success');
            }, (error) => {
                HelpersManager.showToast('Error al obtener ubicación GPS', 'error');
            });
        } else {
            HelpersManager.showToast('GPS no disponible en este dispositivo', 'error');
        }
    }

    measureDistance() {
        HelpersManager.showToast('Función de medición en desarrollo', 'info');
    }

    calculateArea() {
        const area = this.calculateTotalArea();
        HelpersManager.showToast(`Área calculada: ${area.toFixed(2)} hectáreas`, 'success');
    }

    calculateTotalArea() {
        // Cálculo aproximado basado en los bounds de la finca
        const latDiff = this.fincaBounds.north - this.fincaBounds.south;
        const lngDiff = this.fincaBounds.east - this.fincaBounds.west;
        
        // Conversión aproximada de grados a metros en Guatemala
        const latMeters = latDiff * 111000; // 1 grado lat ≈ 111 km
        const lngMeters = lngDiff * 111000 * Math.cos(this.mapCenter.lat * Math.PI / 180);
        
        return (latMeters * lngMeters) / 10000; // Convertir a hectáreas
    }

    calculateCoverage() {
        const trees = StorageManager.getTrees();
        const treesWithGPS = trees.filter(tree => tree.gps && tree.gps.lat);
        return trees.length > 0 ? Math.round((treesWithGPS.length / trees.length) * 100) : 0;
    }

    navigateToTree(treeId) {
        const tree = StorageManager.getTrees().find(t => t.id === treeId);
        if (tree && tree.gps) {
            const url = `https://maps.google.com/maps?q=${tree.gps.lat},${tree.gps.lng}`;
            window.open(url, '_blank');
            HelpersManager.showToast('Abriendo navegación GPS...', 'success');
        } else {
            HelpersManager.showToast('No hay coordenadas GPS para este árbol', 'error');
        }
    }

    exportCoordinates() {
        const trees = StorageManager.getTrees().filter(tree => tree.gps && tree.gps.lat);
        
        if (trees.length === 0) {
            HelpersManager.showToast('No hay árboles con coordenadas GPS', 'error');
            return;
        }

        const csvContent = "data:text/csv;charset=utf-8," + 
            "Código,Variedad,Latitud,Longitud,Altitud,Salud,Productividad\n" +
            trees.map(tree => 
                `${tree.code},${tree.variety},${tree.gps.lat},${tree.gps.lng},${tree.gps.altitude || 'N/A'},${tree.health},${tree.productivity}%`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `finca_limon_gps_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        HelpersManager.showToast(`Exportadas ${trees.length} coordenadas GPS`, 'success');
    }

    bindEvents() {
        // Eventos de teclado para navegación
        document.addEventListener('keydown', (e) => {
            if (navigationManager.currentSection !== 'map') return;
            
            switch(e.key) {
                case 'Escape':
                    this.selectedTree = null;
                    this.updateSelectedTreeInfo();
                    break;
                case 'c':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.centerMap();
                    }
                    break;
                case 'v':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.toggleView();
                    }
                    break;
            }
        });
    }
}

// Instancia global
const mapComponent = new MapComponent();