const ROUTES = window.ROUTES;

class Sidebar {
    constructor(options = {}) {
        this.container = options.container || '#sidebar';
        this.onNavigate = options.onNavigate || (() => {});
        this.activeRoute = 'dashboard';
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        console.log('📱 Sidebar inicializado');
    }

    render() {
        const container = document.querySelector(this.container);
        if (!container) {
            console.error('Contenedor del sidebar no encontrado');
            return;
        }

        container.innerHTML = this.getTemplate();
        this.updateActiveState();
    }

    getTemplate() {
        const menuItems = this.getMenuItems();
        
        return `
            <!-- Header del Sidebar -->
            <div class="sidebar-header">
                <div class="flex items-center">
                    <div class="sidebar-logo">
                        <span class="text-2xl">🌿</span>
                    </div>
                    <div class="sidebar-title">
                        <h1 class="text-xl font-bold text-gray-800">FincaLimón</h1>
                        <p class="text-sm text-gray-500">Gestión Agrícola</p>
                    </div>
                </div>
                
                <!-- Botón cerrar para móvil -->
                <button class="sidebar-close md:hidden" onclick="this.closest('#sidebar').classList.remove('sidebar-open')">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- Navegación Principal -->
            <nav class="sidebar-nav">
                <ul class="space-y-1">
                    ${menuItems.map(item => this.getMenuItemTemplate(item)).join('')}
                </ul>
            </nav>

            <!-- Sección de Usuario -->
            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="flex items-center space-x-3">
                        <div class="user-avatar">
                            <svg class="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="user-info">
                            <p class="text-sm font-medium text-gray-800">Administrador</p>
                            <p class="text-xs text-gray-500">Finca Limón</p>
                        </div>
                    </div>
                </div>

                <!-- Acciones rápidas -->
                <div class="quick-actions mt-4">
                    <div class="grid grid-cols-2 gap-2">
                        <button class="quick-action-btn" onclick="app.showNotification('Función en desarrollo', 'info')" title="Configuración">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                        </button>
                        <button class="quick-action-btn" onclick="app.components.sidebar.showHelpModal()" title="Ayuda">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getMenuItems() {
        return [
            {
                route: 'dashboard',
                icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"/>
                       </svg>`,
                label: 'Dashboard',
                description: 'Vista general'
            },
            {
                route: 'trees',
                icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                       </svg>`,
                label: 'Árboles',
                description: 'Gestión de cultivos'
            },
            {
                route: 'activities',
                icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                       </svg>`,
                label: 'Actividades',
                description: 'Tareas y cuidados'
            },
            {
                route: 'analytics',
                icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                       </svg>`,
                label: 'Análisis',
                description: 'Reportes y estadísticas'
            },
            {
                route: 'map',
                icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                       </svg>`,
                label: 'Mapa',
                description: 'Ubicación GPS'
            },
            {
                route: 'calendar',
                icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                       </svg>`,
                label: 'Calendario',
                description: 'Programación de tareas'
            }
        ];
    }

    getMenuItemTemplate(item) {
        const isActive = this.activeRoute === item.route;
        const activeClass = isActive ? 'nav-item-active' : '';
        
        return `
            <li>
                <a href="#${item.route}" 
                   class="nav-item ${activeClass}" 
                   data-route="${item.route}"
                   title="${item.description}">
                    <div class="nav-item-icon">
                        ${item.icon}
                    </div>
                    <div class="nav-item-content">
                        <span class="nav-item-label">${item.label}</span>
                        <span class="nav-item-description">${item.description}</span>
                    </div>
                    ${isActive ? '<div class="nav-item-indicator"></div>' : ''}
                </a>
            </li>
        `;
    }

    attachEventListeners() {
        const container = document.querySelector(this.container);
        if (!container) return;

        // Navegación por click
        container.addEventListener('click', (e) => {
            const navItem = e.target.closest('[data-route]');
            if (navItem) {
                e.preventDefault();
                const route = navItem.dataset.route;
                this.navigateToRoute(route);
            }
        });

        // Hover effects para mejor UX
        container.addEventListener('mouseenter', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && !navItem.classList.contains('nav-item-active')) {
                navItem.classList.add('nav-item-hover');
            }
        }, true);

        container.addEventListener('mouseleave', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                navItem.classList.remove('nav-item-hover');
            }
        }, true);
    }

    navigateToRoute(route) {
        if (route !== this.activeRoute) {
            this.setActiveRoute(route);
            this.onNavigate(route);
            
            // Cerrar sidebar en móvil después de navegación
            if (window.innerWidth < 768) {
                const sidebar = document.querySelector(this.container);
                sidebar.classList.remove('sidebar-open');
            }
        }
    }

    setActiveRoute(route) {
        this.activeRoute = route;
        this.updateActiveState();
    }

    updateActiveState() {
        const container = document.querySelector(this.container);
        if (!container) return;

        // Remover estado activo de todos los items
        container.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('nav-item-active');
            const indicator = item.querySelector('.nav-item-indicator');
            if (indicator) {
                indicator.remove();
            }
        });

        // Agregar estado activo al item actual
        const activeItem = container.querySelector(`[data-route="${this.activeRoute}"]`);
        if (activeItem) {
            activeItem.classList.add('nav-item-active');
            activeItem.insertAdjacentHTML('beforeend', '<div class="nav-item-indicator"></div>');
        }
    }

    showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Ayuda - FincaLimón</h3>
                        <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">🌿 Dashboard</h4>
                            <p class="text-sm text-gray-600">Vista general de tu finca con estadísticas principales y actividades recientes.</p>
                        </div>
                        
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">🌳 Árboles</h4>
                            <p class="text-sm text-gray-600">Registra y gestiona todos tus árboles de limón. Añade información sobre variedades, ubicación y estado.</p>
                        </div>
                        
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">📋 Actividades</h4>
                            <p class="text-sm text-gray-600">Programa y registra actividades como riego, poda, abonado y fumigación.</p>
                        </div>
                        
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">📊 Análisis</h4>
                            <p class="text-sm text-gray-600">Visualiza reportes y estadísticas sobre la productividad de tu finca.</p>
                        </div>
                        
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">🗺️ Mapa</h4>
                            <p class="text-sm text-gray-600">Visualiza la ubicación de tus árboles en un mapa interactivo.</p>
                        </div>
                        
                        <div>
                            <h4 class="font-medium text-gray-800 mb-2">📅 Calendario</h4>
                            <p class="text-sm text-gray-600">Planifica tus actividades agrícolas en un calendario visual.</p>
                        </div>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <p class="text-xs text-gray-500 text-center">
                            FincaLimón v1.0 - Sistema de Gestión Agrícola
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Cerrar modal al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Cerrar con ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    // Método para obtener estadísticas del menú (para analytics)
    getNavigationStats() {
        return {
            activeRoute: this.activeRoute,
            totalRoutes: Object.keys(ROUTES).length,
            availableRoutes: this.getMenuItems().map(item => item.route)
        };
    }

    // Método para destacar notificaciones en el menú
    showNotificationBadge(route, count = 1) {
        const container = document.querySelector(this.container);
        if (!container) return;

        const navItem = container.querySelector(`[data-route="${route}"]`);
        if (navItem) {
            // Remover badge existente
            const existingBadge = navItem.querySelector('.notification-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            // Agregar nuevo badge
            if (count > 0) {
                const badge = document.createElement('div');
                badge.className = 'notification-badge';
                badge.textContent = count > 99 ? '99+' : count.toString();
                navItem.appendChild(badge);
            }
        }
    }

    hideNotificationBadge(route) {
        this.showNotificationBadge(route, 0);
    }

    // Método para actualizar el perfil de usuario
    updateUserProfile(userData) {
        const container = document.querySelector(this.container);
        if (!container) return;

        const userInfo = container.querySelector('.user-info');
        if (userInfo && userData) {
            const nameElement = userInfo.querySelector('p:first-child');
            const roleElement = userInfo.querySelector('p:last-child');
            
            if (nameElement && userData.name) {
                nameElement.textContent = userData.name;
            }
            
            if (roleElement && userData.role) {
                roleElement.textContent = userData.role;
            }
        }
    }
}

export { Sidebar };