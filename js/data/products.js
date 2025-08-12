// Usar dependencias del global
const PRODUCT_CATEGORIES = window.PRODUCT_CATEGORIES;
const formatCurrency = window.helpers.formatCurrency;
const StorageManager = window.StorageManager;
// ... otras dependencias

export class ProductsManager {
    constructor() {
        this.storageManager = new StorageManager();
        this.products = this.loadProducts();
        this.currentView = 'list'; // list, add, edit
        this.editingProduct = null;
        this.filters = {
            category: 'all',
            status: 'all',
            search: ''
        };
    }

    // Cargar productos desde storage
    loadProducts() {
        const stored = this.storageManager.getProducts();
        if (stored && stored.length > 0) {
            return stored;
        }
        
        // Productos por defecto si no hay datos
        const defaultProducts = [
            {
                id: 'prod-001',
                code: 'FERT-001',
                name: 'Fertilizante NPK 15-15-15',
                category: 'fertilizer',
                unit: 'kg',
                costPerUnit: 25.50,
                currentStock: 150,
                minStock: 50,
                maxStock: 500,
                supplier: 'AgroSupplies S.A.',
                description: 'Fertilizante granulado balanceado para cítricos',
                expiryDate: '2025-12-31',
                lastPurchase: '2024-11-15',
                status: 'active',
                usage: [
                    { date: '2024-11-20', quantity: 25, activity: 'Fertilización Cuadrante A' },
                    { date: '2024-11-10', quantity: 30, activity: 'Fertilización Cuadrante B' }
                ]
            },
            {
                id: 'prod-002',
                code: 'PEST-001',
                name: 'Aceite Mineral 83%',
                category: 'pesticide',
                unit: 'l',
                costPerUnit: 45.75,
                currentStock: 25,
                minStock: 10,
                maxStock: 100,
                supplier: 'CitrusProtect Ltda.',
                description: 'Insecticida para control de cochinilla y trips',
                expiryDate: '2025-08-30',
                lastPurchase: '2024-10-20',
                status: 'active',
                usage: [
                    { date: '2024-11-18', quantity: 5, activity: 'Fumigación preventiva' }
                ]
            },
            {
                id: 'prod-003',
                code: 'FUNG-001',
                name: 'Fungicida Cúprico',
                category: 'fungicide',
                unit: 'kg',
                costPerUnit: 35.20,
                currentStock: 8,
                minStock: 15,
                maxStock: 80,
                supplier: 'AgroSupplies S.A.',
                description: 'Fungicida preventivo contra gomosis y antracnosis',
                expiryDate: '2025-06-15',
                lastPurchase: '2024-09-30',
                status: 'low_stock',
                usage: [
                    { date: '2024-11-12', quantity: 7, activity: 'Tratamiento preventivo hongos' }
                ]
            },
            {
                id: 'prod-004',
                code: 'HERB-001',
                name: 'Herbicida Glifosato 48%',
                category: 'herbicide',
                unit: 'l',
                costPerUnit: 28.90,
                currentStock: 0,
                minStock: 20,
                maxStock: 60,
                supplier: 'CitrusProtect Ltda.',
                description: 'Herbicida sistémico para control de malezas',
                expiryDate: '2025-03-20',
                lastPurchase: '2024-08-15',
                status: 'out_of_stock',
                usage: [
                    { date: '2024-10-25', quantity: 15, activity: 'Control de malezas perimetrales' }
                ]
            },
            {
                id: 'prod-005',
                code: 'FERT-002',
                name: 'Abono Orgánico Compost',
                category: 'fertilizer',
                unit: 'ton',
                costPerUnit: 180.00,
                currentStock: 3.5,
                minStock: 2,
                maxStock: 10,
                supplier: 'EcoAbonos Verde',
                description: 'Compost orgánico certificado para mejoramiento del suelo',
                expiryDate: null,
                lastPurchase: '2024-11-01',
                status: 'active',
                usage: [
                    { date: '2024-11-15', quantity: 1.5, activity: 'Aplicación orgánica sector norte' }
                ]
            }
        ];

        this.storageManager.saveProducts(defaultProducts);
        return defaultProducts;
    }

    // Renderizar la vista principal
    render() {
        const container = document.getElementById('main-content');
        
        switch(this.currentView) {
            case 'add':
                container.innerHTML = this.renderAddProductForm();
                this.attachAddFormEvents();
                break;
            case 'edit':
                container.innerHTML = this.renderEditProductForm();
                this.attachEditFormEvents();
                break;
            default:
                container.innerHTML = this.renderProductsList();
                this.attachListEvents();
        }
    }

    // Renderizar lista de productos
    renderProductsList() {
        const filteredProducts = this.getFilteredProducts();
        const stockAlerts = this.getStockAlerts();

        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <i data-lucide="package" class="w-6 h-6"></i>
                            Gestión de Productos
                        </h1>
                        <p class="text-gray-600 mt-1">Administra fertilizantes, pesticidas y otros insumos</p>
                    </div>
                    <button id="add-product-btn" class="btn btn-primary flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        Nuevo Producto
                    </button>
                </div>

                <!-- Alertas de Stock -->
                ${stockAlerts.length > 0 ? this.renderStockAlerts(stockAlerts) : ''}

                <!-- Resumen de estadísticas -->
                ${this.renderStatsCards()}

                <!-- Filtros -->
                ${this.renderFilters()}

                <!-- Lista de Productos -->
                <div class="card">
                    <div class="card-header flex justify-between items-center">
                        <h2 class="text-lg font-semibold">Inventario de Productos</h2>
                        <span class="text-sm text-gray-500">${filteredProducts.length} productos</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="table-header">Código</th>
                                    <th class="table-header">Producto</th>
                                    <th class="table-header">Categoría</th>
                                    <th class="table-header">Stock</th>
                                    <th class="table-header">Estado</th>
                                    <th class="table-header">Costo/Unidad</th>
                                    <th class="table-header">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${filteredProducts.map(product => this.renderProductRow(product)).join('')}
                            </tbody>
                        </table>
                        ${filteredProducts.length === 0 ? `
                            <div class="text-center py-8 text-gray-500">
                                <i data-lucide="package-x" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                                <p>No se encontraron productos</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Renderizar alertas de stock
    renderStockAlerts(alerts) {
        const outOfStock = alerts.filter(p => p.status === 'out_of_stock');
        const lowStock = alerts.filter(p => p.status === 'low_stock');

        return `
            <div class="space-y-3">
                ${outOfStock.length > 0 ? `
                    <div class="alert alert-error">
                        <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                        <div>
                            <strong>Productos Agotados (${outOfStock.length})</strong>
                            <div class="text-sm mt-1">
                                ${outOfStock.map(p => p.name).join(', ')}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${lowStock.length > 0 ? `
                    <div class="alert alert-warning">
                        <i data-lucide="alert-circle" class="w-5 h-5"></i>
                        <div>
                            <strong>Stock Bajo (${lowStock.length})</strong>
                            <div class="text-sm mt-1">
                                ${lowStock.map(p => `${p.name} (${p.currentStock} ${p.unit})`).join(', ')}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Renderizar tarjetas de estadísticas
    renderStatsCards() {
        const stats = this.calculateStats();
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="stat-card">
                    <div class="stat-icon bg-blue-100 text-blue-600">
                        <i data-lucide="package" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="stat-value">${stats.totalProducts}</div>
                        <div class="stat-label">Total Productos</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon bg-green-100 text-green-600">
                        <i data-lucide="dollar-sign" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="stat-value">${formatCurrency(stats.totalValue)}</div>
                        <div class="stat-label">Valor Inventario</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon bg-yellow-100 text-yellow-600">
                        <i data-lucide="alert-triangle" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="stat-value">${stats.lowStockCount}</div>
                        <div class="stat-label">Stock Bajo</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon bg-red-100 text-red-600">
                        <i data-lucide="x-circle" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="stat-value">${stats.outOfStockCount}</div>
                        <div class="stat-label">Agotados</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Renderizar filtros
    renderFilters() {
        return `
            <div class="card">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex flex-col sm:flex-row gap-4">
                        <!-- Búsqueda -->
                        <div class="flex-1">
                            <div class="relative">
                                <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></i>
                                <input
                                    type="text"
                                    id="search-products"
                                    class="input pl-10"
                                    placeholder="Buscar productos..."
                                    value="${this.filters.search}"
                                >
                            </div>
                        </div>
                        
                        <!-- Filtro por Categoría -->
                        <select id="filter-category" class="input">
                            <option value="all">Todas las categorías</option>
                            <option value="fertilizer" ${this.filters.category === 'fertilizer' ? 'selected' : ''}>Fertilizantes</option>
                            <option value="pesticide" ${this.filters.category === 'pesticide' ? 'selected' : ''}>Pesticidas</option>
                            <option value="fungicide" ${this.filters.category === 'fungicide' ? 'selected' : ''}>Fungicidas</option>
                            <option value="herbicide" ${this.filters.category === 'herbicide' ? 'selected' : ''}>Herbicidas</option>
                        </select>
                        
                        <!-- Filtro por Estado -->
                        <select id="filter-status" class="input">
                            <option value="all">Todos los estados</option>
                            <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Stock Normal</option>
                            <option value="low_stock" ${this.filters.status === 'low_stock' ? 'selected' : ''}>Stock Bajo</option>
                            <option value="out_of_stock" ${this.filters.status === 'out_of_stock' ? 'selected' : ''}>Agotado</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    // Renderizar fila de producto
    renderProductRow(product) {
        const categoryInfo = PRODUCT_CATEGORIES[product.category];
        const statusInfo = this.getStatusInfo(product.status);
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="table-cell font-medium">${product.code}</td>
                <td class="table-cell">
                    <div>
                        <div class="font-medium">${product.name}</div>
                        <div class="text-sm text-gray-500">${product.description}</div>
                    </div>
                </td>
                <td class="table-cell">
                    <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-${categoryInfo.color}-100 text-${categoryInfo.color}-800 rounded-full">
                        <i data-lucide="${categoryInfo.icon}" class="w-3 h-3"></i>
                        ${categoryInfo.name}
                    </span>
                </td>
                <td class="table-cell">
                    <div>
                        <div class="font-medium">${product.currentStock} ${product.unit}</div>
                        <div class="text-xs text-gray-500">Mín: ${product.minStock} ${product.unit}</div>
                    </div>
                </td>
                <td class="table-cell">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800 rounded-full">
                        <i data-lucide="${statusInfo.icon}" class="w-3 h-3 mr-1"></i>
                        ${statusInfo.label}
                    </span>
                </td>
                <td class="table-cell font-medium">${formatCurrency(product.costPerUnit)}/${product.unit}</td>
                <td class="table-cell">
                    <div class="flex items-center gap-1">
                        <button class="btn-icon btn-icon-sm" onclick="productsManager.viewProduct('${product.id}')" title="Ver detalles">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="btn-icon btn-icon-sm" onclick="productsManager.editProduct('${product.id}')" title="Editar">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button class="btn-icon btn-icon-sm text-red-600 hover:bg-red-50" onclick="productsManager.deleteProduct('${product.id}')" title="Eliminar">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Renderizar formulario de agregar producto
    renderAddProductForm() {
        return `
            <div class="space-y-6">
                <div class="flex items-center gap-2">
                    <button id="back-to-list" class="btn-icon">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i>
                    </button>
                    <h1 class="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
                </div>

                <form id="add-product-form" class="space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Información Básica -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="text-lg font-semibold">Información Básica</h3>
                            </div>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="product-code" class="form-label required">Código del Producto</label>
                                    <input type="text" id="product-code" class="input" placeholder="Ej: FERT-003" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="product-name" class="form-label required">Nombre del Producto</label>
                                    <input type="text" id="product-name" class="input" placeholder="Nombre descriptivo" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="product-category" class="form-label required">Categoría</label>
                                    <select id="product-category" class="input" required>
                                        <option value="">Seleccionar categoría</option>
                                        <option value="fertilizer">Fertilizantes</option>
                                        <option value="pesticide">Pesticidas</option>
                                        <option value="fungicide">Fungicidas</option>
                                        <option value="herbicide">Herbicidas</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="product-description" class="form-label">Descripción</label>
                                    <textarea id="product-description" class="input" rows="3" placeholder="Descripción del producto"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Información de Stock -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="text-lg font-semibold">Información de Stock</h3>
                            </div>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="product-unit" class="form-label required">Unidad de Medida</label>
                                    <select id="product-unit" class="input" required>
                                        <option value="">Seleccionar unidad</option>
                                        <option value="kg">Kilogramos (kg)</option>
                                        <option value="l">Litros (l)</option>
                                        <option value="ton">Toneladas (ton)</option>
                                        <option value="ml">Mililitros (ml)</option>
                                        <option value="g">Gramos (g)</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="current-stock" class="form-label required">Stock Actual</label>
                                    <input type="number" id="current-stock" class="input" step="0.1" min="0" placeholder="0" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="min-stock" class="form-label required">Stock Mínimo</label>
                                    <input type="number" id="min-stock" class="input" step="0.1" min="0" placeholder="0" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="max-stock" class="form-label required">Stock Máximo</label>
                                    <input type="number" id="max-stock" class="input" step="0.1" min="0" placeholder="0" required>
                                </div>
                            </div>
                        </div>

                        <!-- Información Comercial -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="text-lg font-semibold">Información Comercial</h3>
                            </div>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="cost-per-unit" class="form-label required">Costo por Unidad</label>
                                    <input type="number" id="cost-per-unit" class="input" step="0.01" min="0" placeholder="0.00" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="product-supplier" class="form-label">Proveedor</label>
                                    <input type="text" id="product-supplier" class="input" placeholder="Nombre del proveedor">
                                </div>
                                
                                <div class="form-group">
                                    <label for="last-purchase" class="form-label">Última Compra</label>
                                    <input type="date" id="last-purchase" class="input">
                                </div>
                                
                                <div class="form-group">
                                    <label for="expiry-date" class="form-label">Fecha de Vencimiento</label>
                                    <input type="date" id="expiry-date" class="input">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3">
                        <button type="button" id="cancel-add" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Producto</button>
                    </div>
                </form>
            </div>
        `;
    }

    // Renderizar formulario de edición de producto
    renderEditProductForm() {
        if (!this.editingProduct) return this.renderProductsList();

        const product = this.editingProduct;

        return `
            <div class="space-y-6">
                <div class="flex items-center gap-2">
                    <button id="back-to-list" class="btn-icon">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i>
                    </button>
                    <h1 class="text-2xl font-bold text-gray-900">Editar Producto</h1>
                </div>

                <form id="edit-product-form" class="space-y-6">
                    <input type="hidden" id="product-id" value="${product.id}">
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Información Básica -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="text-lg font-semibold">Información Básica</h3>
                            </div>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="edit-product-code" class="form-label required">Código del Producto</label>
                                    <input type="text" id="edit-product-code" class="input" value="${product.code}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-product-name" class="form-label required">Nombre del Producto</label>
                                    <input type="text" id="edit-product-name" class="input" value="${product.name}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-product-category" class="form-label required">Categoría</label>
                                    <select id="edit-product-category" class="input" required>
                                        <option value="">Seleccionar categoría</option>
                                        <option value="fertilizer" ${product.category === 'fertilizer' ? 'selected' : ''}>Fertilizantes</option>
                                        <option value="pesticide" ${product.category === 'pesticide' ? 'selected' : ''}>Pesticidas</option>
                                        <option value="fungicide" ${product.category === 'fungicide' ? 'selected' : ''}>Fungicidas</option>
                                        <option value="herbicide" ${product.category === 'herbicide' ? 'selected' : ''}>Herbicidas</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-product-description" class="form-label">Descripción</label>
                                    <textarea id="edit-product-description" class="input" rows="3">${product.description || ''}</textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Información de Stock -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="text-lg font-semibold">Información de Stock</h3>
                            </div>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="edit-product-unit" class="form-label required">Unidad de Medida</label>
                                    <select id="edit-product-unit" class="input" required>
                                        <option value="">Seleccionar unidad</option>
                                        <option value="kg" ${product.unit === 'kg' ? 'selected' : ''}>Kilogramos (kg)</option>
                                        <option value="l" ${product.unit === 'l' ? 'selected' : ''}>Litros (l)</option>
                                        <option value="ton" ${product.unit === 'ton' ? 'selected' : ''}>Toneladas (ton)</option>
                                        <option value="ml" ${product.unit === 'ml' ? 'selected' : ''}>Mililitros (ml)</option>
                                        <option value="g" ${product.unit === 'g' ? 'selected' : ''}>Gramos (g)</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-current-stock" class="form-label required">Stock Actual</label>
                                    <input type="number" id="edit-current-stock" class="input" step="0.1" min="0" value="${product.currentStock}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-min-stock" class="form-label required">Stock Mínimo</label>
                                    <input type="number" id="edit-min-stock" class="input" step="0.1" min="0" value="${product.minStock}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-max-stock" class="form-label required">Stock Máximo</label>
                                    <input type="number" id="edit-max-stock" class="input" step="0.1" min="0" value="${product.maxStock}" required>
                                </div>
                            </div>
                        </div>

                        <!-- Información Comercial -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="text-lg font-semibold">Información Comercial</h3>
                            </div>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="edit-cost-per-unit" class="form-label required">Costo por Unidad</label>
                                    <input type="number" id="edit-cost-per-unit" class="input" step="0.01" min="0" value="${product.costPerUnit}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-product-supplier" class="form-label">Proveedor</label>
                                    <input type="text" id="edit-product-supplier" class="input" value="${product.supplier || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-last-purchase" class="form-label">Última Compra</label>
                                    <input type="date" id="edit-last-purchase" class="input" value="${product.lastPurchase || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-expiry-date" class="form-label">Fecha de Vencimiento</label>
                                    <input type="date" id="edit-expiry-date" class="input" value="${product.expiryDate || ''}">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3">
                        <button type="button" id="cancel-edit" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Actualizar Producto</button>
                    </div>
                </form>
            </div>
        `;
    }

    // Métodos de utilidad
    getFilteredProducts() {
        return this.products.filter(product => {
            const matchesSearch = this.filters.search === '' || 
                product.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                product.code.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                product.description.toLowerCase().includes(this.filters.search.toLowerCase());
            
            const matchesCategory = this.filters.category === 'all' || product.category === this.filters.category;
            const matchesStatus = this.filters.status === 'all' || product.status === this.filters.status;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }

    getStockAlerts() {
        return this.products.filter(product => 
            product.status === 'out_of_stock' || product.status === 'low_stock'
        );
    }

    calculateStats() {
        const totalProducts = this.products.length;
        const totalValue = this.products.reduce((sum, product) => 
            sum + (product.currentStock * product.costPerUnit), 0);
        const lowStockCount = this.products.filter(p => p.status === 'low_stock').length;
        const outOfStockCount = this.products.filter(p => p.status === 'out_of_stock').length;
        
        return { totalProducts, totalValue, lowStockCount, outOfStockCount };
    }

    getStatusInfo(status) {
        const statusMap = {
            'active': { label: 'Stock Normal', color: 'green', icon: 'check-circle' },
            'low_stock': { label: 'Stock Bajo', color: 'yellow', icon: 'alert-circle' },
            'out_of_stock': { label: 'Agotado', color: 'red', icon: 'x-circle' }
        };
        return statusMap[status] || statusMap['active'];
    }

    // Event listeners
    attachListEvents() {
        // Botón agregar producto
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.currentView = 'add';
                this.render();
            });
        }

        // Filtros
        const searchInput = document.getElementById('search-products');
        const categoryFilter = document.getElementById('filter-category');
        const statusFilter = document.getElementById('filter-status');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.render();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.render();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.render();
            });
        }

        // Inicializar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    attachAddFormEvents() {
        const form = document.getElementById('add-product-form');
        const backBtn = document.getElementById('back-to-list');
        const cancelBtn = document.getElementById('cancel-add');

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.render();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.render();
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddProduct(e);
            });
        }

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    attachEditFormEvents() {
        const form = document.getElementById('edit-product-form');
        const backBtn = document.getElementById('back-to-list');
        const cancelBtn = document.getElementById('cancel-edit');

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.editingProduct = null;
                this.render();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.editingProduct = null;
                this.render();
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditProduct(e);
            });
        }

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Manejar agregar producto
    handleAddProduct(e) {
        const formData = new FormData(e.target);
        const currentStock = parseFloat(document.getElementById('current-stock').value);
        const minStock = parseFloat(document.getElementById('min-stock').value);
        
        // Determinar estado basado en stock
        let status = 'active';
        if (currentStock === 0) {
            status = 'out_of_stock';
        } else if (currentStock <= minStock) {
            status = 'low_stock';
        }

        const newProduct = {
            id: generateId('prod'),
            code: document.getElementById('product-code').value,
            name: document.getElementById('product-name').value,
            category: document.getElementById('product-category').value,
            unit: document.getElementById('product-unit').value,
            costPerUnit: parseFloat(document.getElementById('cost-per-unit').value),
            currentStock: currentStock,
            minStock: minStock,
            maxStock: parseFloat(document.getElementById('max-stock').value),
            supplier: document.getElementById('product-supplier').value || '',
            description: document.getElementById('product-description').value || '',
            expiryDate: document.getElementById('expiry-date').value || null,
            lastPurchase: document.getElementById('last-purchase').value || null,
            status: status,
            usage: []
        };

        this.products.push(newProduct);
        this.storageManager.saveProducts(this.products);
        
        this.currentView = 'list';
        this.render();

        // Mostrar notificación de éxito
        this.showNotification('Producto agregado exitosamente', 'success');
    }

    // Manejar edición de producto
    handleEditProduct(e) {
        const productId = document.getElementById('product-id').value;
        const currentStock = parseFloat(document.getElementById('edit-current-stock').value);
        const minStock = parseFloat(document.getElementById('edit-min-stock').value);
        
        // Determinar estado basado en stock
        let status = 'active';
        if (currentStock === 0) {
            status = 'out_of_stock';
        } else if (currentStock <= minStock) {
            status = 'low_stock';
        }

        const updatedProduct = {
            id: productId,
            code: document.getElementById('edit-product-code').value,
            name: document.getElementById('edit-product-name').value,
            category: document.getElementById('edit-product-category').value,
            unit: document.getElementById('edit-product-unit').value,
            costPerUnit: parseFloat(document.getElementById('edit-cost-per-unit').value),
            currentStock: currentStock,
            minStock: minStock,
            maxStock: parseFloat(document.getElementById('edit-max-stock').value),
            supplier: document.getElementById('edit-product-supplier').
            value || '',
            description: document.getElementById('edit-product-description').value || '',

            status: status,
            usage: this.editingProduct.usage // Mantener el historial de uso
        };

        // Actualizar el producto en el array
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            this.products[index] = updatedProduct;
            this.storageManager.saveProducts(this.products);
        }

        this.currentView = 'list';
        this.editingProduct = null;
        this.render();

        // Mostrar notificación de éxito
        this.showNotification('Producto actualizado exitosamente', 'success');
    }

    // Ver detalles de producto
    viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const categoryInfo = PRODUCT_CATEGORIES[product.category];
        const statusInfo = this.getStatusInfo(product.status);

        // Crear modal con detalles del producto
        const modalContent = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">${product.name}</h2>
                    <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-${categoryInfo.color}-100 text-${categoryInfo.color}-800 rounded-full">
                        <i data-lucide="${categoryInfo.icon}" class="w-3 h-3"></i>
                        ${categoryInfo.name}
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <div>
                            <label class="text-sm font-medium text-gray-500">Código</label>
                            <p class="font-medium">${product.code}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-500">Descripción</label>
                            <p>${product.description || 'N/A'}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-500">Proveedor</label>
                            <p>${product.supplier || 'N/A'}</p>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div>
                            <label class="text-sm font-medium text-gray-500">Estado</label>
                            <p>
                                <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800 rounded-full">
                                    <i data-lucide="${statusInfo.icon}" class="w-3 h-3 mr-1"></i>
                                    ${statusInfo.label}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-500">Stock</label>
                            <p>${product.currentStock} ${product.unit} (Mín: ${product.minStock} / Máx: ${product.maxStock})</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-500">Costo por unidad</label>
                            <p>${formatCurrency(product.costPerUnit)}/${product.unit}</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm font-medium text-gray-500">Última compra</label>
                        <p>${product.lastPurchase ? formatDate(product.lastPurchase) : 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-500">Fecha de vencimiento</label>
                        <p>${product.expiryDate ? formatDate(product.expiryDate) : 'N/A'}</p>
                    </div>
                </div>

                ${product.usage && product.usage.length > 0 ? `
                    <div>
                        <h3 class="font-medium text-gray-900 mb-2">Historial de uso</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="table-header">Fecha</th>
                                        <th class="table-header">Cantidad</th>
                                        <th class="table-header">Actividad</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    ${product.usage.map(usage => `
                                        <tr>
                                            <td class="table-cell">${formatDate(usage.date)}</td>
                                            <td class="table-cell">${usage.quantity} ${product.unit}</td>
                                            <td class="table-cell">${usage.activity}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        this.showModal('Detalles del Producto', modalContent, 'Cerrar');
    }

    // Editar producto
    editProduct(productId) {
        this.editingProduct = this.products.find(p => p.id === productId);
        if (this.editingProduct) {
            this.currentView = 'edit';
            this.render();
        }
    }

    // Eliminar producto
    deleteProduct(productId) {
        this.showConfirmModal(
            'Eliminar Producto',
            '¿Estás seguro que deseas eliminar este producto? Esta acción no se puede deshacer.',
            'Eliminar',
            'Cancelar',
            () => {
                this.products = this.products.filter(p => p.id !== productId);
                this.storageManager.saveProducts(this.products);
                this.render();
                this.showNotification('Producto eliminado exitosamente', 'success');
            }
        );
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-md text-white ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`;
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="${
                    type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'x-circle' : 
                    type === 'warning' ? 'alert-triangle' : 'info'
                }" class="w-5 h-5"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Mostrar modal
    showModal(title, content, closeText = 'Cerrar', onClose = null) {
        const modalId = 'custom-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-50 overflow-y-auto hidden';
            modal.innerHTML = `
                <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start">
                                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">${title}</h3>
                                    <div class="mt-2">
                                        ${content}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="button" id="modal-close-btn" class="btn btn-primary">
                                ${closeText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.querySelector('h3').textContent = title;
            modal.querySelector('.mt-2').innerHTML = content;
            modal.querySelector('#modal-close-btn').textContent = closeText;
        }

        // Mostrar modal
        modal.classList.remove('hidden');

        // Configurar evento de cierre
        const closeBtn = modal.querySelector('#modal-close-btn');
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
            if (onClose) onClose();
        };

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Mostrar modal de confirmación
    showConfirmModal(title, message, confirmText, cancelText, onConfirm) {
        const modalId = 'confirm-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-50 overflow-y-auto hidden';
            modal.innerHTML = `
                <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start">
                                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <i data-lucide="alert-triangle" class="w-6 h-6 text-red-600"></i>
                                </div>
                                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900">${title}</h3>
                                    <div class="mt-2">
                                        <p class="text-sm text-gray-500">${message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="button" id="confirm-btn" class="btn btn-danger ml-2">
                                ${confirmText}
                            </button>
                            <button type="button" id="cancel-btn" class="btn btn-secondary">
                                ${cancelText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Mostrar modal
        modal.classList.remove('hidden');

        // Configurar eventos
        document.getElementById('confirm-btn').onclick = () => {
            modal.classList.add('hidden');
            onConfirm();
        };

        document.getElementById('cancel-btn').onclick = () => {
            modal.classList.add('hidden');
        };

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// Exportar instancia global
window.productsManager = new ProductsManager();