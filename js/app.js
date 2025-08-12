// Obtener dependencias del global
const StorageManager = window.StorageManager;
const mockData = window.mockData;
const helpers = window.helpers;

class FincaLimonApp {
    constructor() {
        this.currentRoute = 'dashboard';
        this.components = {};
        this.data = {
            trees: [],
            activities: [],
            harvests: [],
            user: null
        };
        
        this.init();
    }

    async init() {
        try {
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Inicializar componentes
            this.initializeComponents();
            
            // Configurar navegación
            this.setupNavigation();
            
            // Configurar eventos globales
            this.setupGlobalEvents();
            
            // Cargar ruta inicial
            this.navigateToRoute(this.getCurrentRoute());
            
            console.log('✅ FincaLimón App iniciada correctamente');
        } catch (error) {
            console.error('❌ Error iniciando la aplicación:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    async loadInitialData() {
        // Intentar cargar datos del localStorage primero
        const savedData = StorageManager.getAllData();
        
        if (savedData.trees && savedData.trees.length > 0) {
            this.data = savedData;
        } else {
            // Si no hay datos guardados, cargar datos mock
            this.data = await loadMockData();
            // Guardar datos mock en localStorage
            StorageManager.saveAllData(this.data);
        }
    }

    initializeComponents() {
        // Inicializar sidebar
        this.components.sidebar = new Sidebar({
            container: '#sidebar',
            onNavigate: (route) => this.navigateToRoute(route)
        });

        // Inicializar componentes de contenido
        this.components.dashboard = new Dashboard({
            container: '#content',
            data: this.data
        });

        this.components.trees = new Trees({
            container: '#content',
            data: this.data,
            onDataUpdate: (newData) => this.updateData(newData)
        });

        this.components.activities = new Activities({
            container: '#content',
            data: this.data,
            onDataUpdate: (newData) => this.updateData(newData)
        });

        this.components.analytics = new Analytics({
            container: '#content',
            data: this.data
        });

        this.components.map = new MapView({
            container: '#content',
            data: this.data
        });

        this.components.calendar = new Calendar({
            container: '#content',
            data: this.data
        });
    }

    setupNavigation() {
        // Navegación por hash
        window.addEventListener('hashchange', () => {
            const route = this.getCurrentRoute();
            this.navigateToRoute(route);
        });

        // Navegación por botones del sidebar
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('[data-route]');
            if (navItem) {
                e.preventDefault();
                const route = navItem.dataset.route;
                this.navigateToRoute(route);
            }
        });
    }

    setupGlobalEvents() {
        // Manejo de errores globales
        window.addEventListener('error', (e) => {
            console.error('Error global:', e.error);
            this.showError('Ha ocurrido un error inesperado');
        });

        // Guardar datos antes de cerrar
        window.addEventListener('beforeunload', () => {
            StorageManager.saveAllData(this.data);
        });

        // Responsive sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Cerrar sidebar en móvil al hacer click fuera
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            
            if (window.innerWidth < 768 && 
                !sidebar.contains(e.target) && 
                e.target !== sidebarToggle) {
                sidebar.classList.remove('sidebar-open');
            }
        });
    }

    getCurrentRoute() {
        const hash = window.location.hash.slice(1);
        return hash || 'dashboard';
    }

    navigateToRoute(route) {
        // Validar que la ruta existe
        if (!ROUTES[route]) {
            console.warn(`Ruta no encontrada: ${route}`);
            route = 'dashboard';
        }

        // Actualizar hash si es necesario
        if (window.location.hash.slice(1) !== route) {
            window.location.hash = route;
        }

        // Actualizar estado actual
        this.currentRoute = route;

        // Actualizar sidebar
        this.components.sidebar.setActiveRoute(route);

        // Renderizar componente correspondiente
        this.renderCurrentComponent();

        // Actualizar título de la página
        document.title = `FincaLimón - ${ROUTES[route].title}`;

        console.log(`📍 Navegando a: ${route}`);
    }

    renderCurrentComponent() {
        const contentContainer = document.getElementById('content');
        if (!contentContainer) {
            console.error('Contenedor de contenido no encontrado');
            return;
        }

        // Limpiar contenido anterior
        contentContainer.innerHTML = '';

        // Renderizar componente actual
        const component = this.components[this.currentRoute];
        if (component && typeof component.render === 'function') {
            component.render();
        } else {
            console.error(`Componente no encontrado para la ruta: ${this.currentRoute}`);
            this.renderNotFound();
        }
    }

    renderNotFound() {
        const contentContainer = document.getElementById('content');
        contentContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-center">
                <div class="text-6xl mb-4">🌿</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Página no encontrada</h2>
                <p class="text-gray-600 mb-4">La página que buscas no existe.</p>
                <button onclick="app.navigateToRoute('dashboard')" 
                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Ir al Dashboard
                </button>
            </div>
        `;
    }

    updateData(newData) {
        // Actualizar datos en memoria
        this.data = { ...this.data, ...newData };
        
        // Guardar en localStorage
        StorageManager.saveAllData(this.data);
        
        // Notificar a componentes que dependen de los datos
        this.notifyDataUpdate();
        
        console.log('📊 Datos actualizados:', Object.keys(newData));
    }

    notifyDataUpdate() {
        // Actualizar componentes que muestran estadísticas
        if (this.components.dashboard) {
            this.components.dashboard.updateData(this.data);
        }
        if (this.components.analytics) {
            this.components.analytics.updateData(this.data);
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('sidebar-open');
    }

    showError(message) {
        // Crear notification toast
        const notification = document.createElement('div');
        notification.className = `
            fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50
            transform transition-transform duration-300 translate-x-full
        `;
        notification.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    showSuccess(message) {
        // Similar al showError pero con estilo de éxito
        const notification = document.createElement('div');
        notification.className = `
            fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50
            transform transition-transform duration-300 translate-x-full
        `;
        notification.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Métodos públicos para interactuar con la app
    getData() {
        return { ...this.data };
    }

    getCurrentComponent() {
        return this.components[this.currentRoute];
    }

    refresh() {
        this.renderCurrentComponent();
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FincaLimonApp();
});

// Exportar para uso en otros módulos
export { FincaLimonApp };