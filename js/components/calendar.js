class CalendarComponent {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.viewMode = 'month'; // month, week, day
        this.eventTypes = {
            'harvest': { color: 'bg-yellow-500', icon: 'scissors', label: 'Cosecha' },
            'fertilize': { color: 'bg-green-500', icon: 'droplets', label: 'Abono' },
            'spray': { color: 'bg-blue-500', icon: 'spray-can', label: 'Fumigación' },
            'prune': { color: 'bg-purple-500', icon: 'cut', label: 'Poda' },
            'maintenance': { color: 'bg-gray-500', icon: 'wrench', label: 'Mantenimiento' },
            'inspection': { color: 'bg-orange-500', icon: 'search', label: 'Inspección' }
        };
        this.showEventModal = false;
        this.currentEvent = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    // Métodos de navegación
    previousPeriod() {
        switch(this.viewMode) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
        }
        this.refreshCalendar();
    }

    nextPeriod() {
        switch(this.viewMode) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
        }
        this.refreshCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.refreshCalendar();
        HelpersManager.showToast('Calendario actualizado a hoy', 'success');
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.refreshCalendar();
        HelpersManager.showToast(`Vista cambiada a ${mode}`, 'info');
    }

    selectDate(dateString) {
        this.selectedDate = new Date(dateString);
        this.refreshCalendar();
    }

    refreshCalendar() {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = this.render();
            lucide.createIcons();
        }
    }

    // Métodos de eventos
    getEventsForDate(date, activities) {
        return activities.filter(activity => {
            const activityDate = new Date(activity.scheduledDate || activity.date);
            return this.isSameDay(date, activityDate);
        });
    }

    getUpcomingEvents(activities) {
        const today = new Date();
        const upcoming = activities
            .filter(activity => {
                const activityDate = new Date(activity.scheduledDate || activity.date);
                return activityDate >= today;
            })
            .sort((a, b) => new Date(a.scheduledDate || a.date) - new Date(b.scheduledDate || b.date));
        
        return upcoming;
    }

    showAddEventModal() {
        this.currentEvent = null;
        this.showEventModal = true;
        this.refreshCalendar();
    }

    showEventDetails(eventId) {
        const activities = StorageManager.getActivities();
        this.currentEvent = activities.find(a => a.id === eventId);
        this.showEventModal = true;
        this.refreshCalendar();
    }

    closeEventModal() {
        this.showEventModal = false;
        this.currentEvent = null;
        this.refreshCalendar();
    }

    saveEvent(event) {
        event.preventDefault();
        
        const formData = {
            type: document.getElementById('event-type').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            treeId: document.getElementById('event-tree').value,
            description: document.getElementById('event-description').value,
            reminder: document.getElementById('event-reminder').checked
        };

        // Combinar fecha y hora
        const scheduledDate = new Date(formData.date + 'T' + formData.time);
        
        const newActivity = {
            id: this.currentEvent?.id || Date.now().toString(),
            type: formData.type,
            scheduledDate: scheduledDate.toISOString(),
            date: scheduledDate.toISOString(),
            description: formData.description,
            treeId: formData.treeId,
            treeCode: formData.treeId ? StorageManager.getTrees().find(t => t.id === formData.treeId)?.code : null,
            reminder: formData.reminder,
            status: 'planned',
            createdAt: this.currentEvent?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const activities = StorageManager.getActivities();
        
        if (this.currentEvent) {
            // Actualizar actividad existente
            const index = activities.findIndex(a => a.id === this.currentEvent.id);
            if (index !== -1) {
                activities[index] = { ...activities[index], ...newActivity };
                HelpersManager.showToast('Actividad actualizada', 'success');
            }
        } else {
            // Nueva actividad
            activities.push(newActivity);
            HelpersManager.showToast('Actividad creada', 'success');
        }

        StorageManager.saveActivities(activities);
        this.closeEventModal();

        // Programar recordatorio si está habilitado
        if (formData.reminder) {
            this.scheduleReminder(newActivity);
        }
    }

    deleteEvent(eventId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
            const activities = StorageManager.getActivities();
            const filteredActivities = activities.filter(a => a.id !== eventId);
            StorageManager.saveActivities(filteredActivities);
            
            this.closeEventModal();
            HelpersManager.showToast('Actividad eliminada', 'success');
        }
    }

    // Acciones rápidas
    quickAddHarvest() {
        this.selectedDate = new Date();
        this.currentEvent = {
            type: 'harvest',
            scheduledDate: new Date().toISOString(),
            description: 'Cosecha programada'
        };
        this.showEventModal = true;
        this.refreshCalendar();
    }

    quickAddFertilize() {
        this.selectedDate = new Date();
        this.currentEvent = {
            type: 'fertilize',
            scheduledDate: new Date().toISOString(),
            description: 'Aplicación de abono programada'
        };
        this.showEventModal = true;
        this.refreshCalendar();
    }

    quickAddSpray() {
        this.selectedDate = new Date();
        this.currentEvent = {
            type: 'spray',
            scheduledDate: new Date().toISOString(),
            description: 'Fumigación programada'
        };
        this.showEventModal = true;
        this.refreshCalendar();
    }

    exportCalendar() {
        const activities = StorageManager.getActivities();
        const periodStart = this.getPeriodStart();
        const periodEnd = this.getPeriodEnd();
        
        const periodActivities = activities.filter(activity => {
            const activityDate = new Date(activity.scheduledDate || activity.date);
            return activityDate >= periodStart && activityDate <= periodEnd;
        });

        if (periodActivities.length === 0) {
            HelpersManager.showToast('No hay actividades para exportar en este período', 'error');
            return;
        }

        const csvContent = "data:text/csv;charset=utf-8," + 
            "Fecha,Hora,Tipo,Descripción,Árbol,Estado\n" +
            periodActivities.map(activity => {
                const date = new Date(activity.scheduledDate || activity.date);
                const eventType = this.eventTypes[activity.type] || this.eventTypes.maintenance;
                return `${date.toLocaleDateString('es-ES')},${date.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})},${eventType.label},"${activity.description || ''}",${activity.treeCode || 'Todos'},${activity.status || 'Planificado'}`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `calendario_finca_limon_${this.getFormattedPeriod().replace(/\s/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        HelpersManager.showToast(`Exportadas ${periodActivities.length} actividades`, 'success');
    }

    showAllUpcoming() {
        const activities = StorageManager.getActivities();
        const upcomingEvents = this.getUpcomingEvents(activities);
        
        // Crear modal para mostrar todas las actividades próximas
        const modalContent = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="this.remove()">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-96 overflow-y-auto" onclick="event.stopPropagation()">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-semibold text-gray-800">Todas las Actividades Próximas</h3>
                            <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <div class="space-y-3">
                            ${upcomingEvents.map(event => this.renderUpcomingEvent(event)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalContent);
        lucide.createIcons();
    }

    scheduleReminder(activity) {
        // En una implementación real, aquí se programaría una notificación
        // Por ahora, solo guardamos la información del recordatorio
        const reminderDate = new Date(activity.scheduledDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        
        console.log(`Recordatorio programado para ${reminderDate.toLocaleString()} sobre: ${activity.description}`);
        
        // Simular notificación si la fecha del recordatorio es hoy
        if (this.isToday(reminderDate)) {
            setTimeout(() => {
                HelpersManager.showToast(`Recordatorio: ${activity.description} programado para mañana`, 'warning');
            }, 2000);
        }
    }

    // Métodos auxiliares
    getFormattedPeriod() {
        switch(this.viewMode) {
            case 'month':
                return this.currentDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
            case 'week':
                const startOfWeek = new Date(this.currentDate);
                startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('es-ES')} - ${endOfWeek.toLocaleDateString('es-ES')}`;
            case 'day':
                return this.currentDate.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            default:
                return '';
        }
    }

    getPeriodStart() {
        switch(this.viewMode) {
            case 'month':
                return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            case 'week':
                const startOfWeek = new Date(this.currentDate);
                startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
                return startOfWeek;
            case 'day':
                return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate());
            default:
                return new Date();
        }
    }

    getPeriodEnd() {
        switch(this.viewMode) {
            case 'month':
                return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            case 'week':
                const endOfWeek = new Date(this.currentDate);
                endOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay() + 6);
                return endOfWeek;
            case 'day':
                const endOfDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate());
                endOfDay.setHours(23, 59, 59, 999);
                return endOfDay;
            default:
                return new Date();
        }
    }

    isToday(date) {
        const today = new Date();
        return this.isSameDay(date, today);
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    bindEvents() {
        // Eventos de teclado para navegación rápida
        document.addEventListener('keydown', (e) => {
            if (navigationManager.currentSection !== 'calendar') return;
            if (this.showEventModal) return; // No interceptar si hay modal abierto
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousPeriod();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextPeriod();
                    break;
                case 't':
                    e.preventDefault();
                    this.goToToday();
                    break;
                case 'm':
                    e.preventDefault();
                    this.setViewMode('month');
                    break;
                case 'w':
                    e.preventDefault();
                    this.setViewMode('week');
                    break;
                case 'd':
                    e.preventDefault();
                    this.setViewMode('day');
                    break;
                case 'n':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.showAddEventModal();
                    }
                    break;
                case 'Escape':
                    if (this.showEventModal) {
                        this.closeEventModal();
                    }
                    break;
            }
        });

        // Eventos de notificaciones automáticas
        this.checkDailyReminders();
        setInterval(() => {
            this.checkDailyReminders();
        }, 60000 * 60); // Revisar cada hora
    }

    checkDailyReminders() {
        const activities = StorageManager.getActivities();
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Buscar actividades para mañana que tengan recordatorio
        const tomorrowActivities = activities.filter(activity => {
            if (!activity.reminder) return false;
            const activityDate = new Date(activity.scheduledDate || activity.date);
            return this.isSameDay(activityDate, tomorrow);
        });

        // Mostrar recordatorios
        tomorrowActivities.forEach(activity => {
            const eventType = this.eventTypes[activity.type] || this.eventTypes.maintenance;
            setTimeout(() => {
                HelpersManager.showToast(
                    `Recordatorio: ${eventType.label} programado para mañana${activity.treeCode ? ` (${activity.treeCode})` : ''}`, 
                    'warning',
                    5000
                );
            }, Math.random() * 3000); // Espaciar los recordatorios
        });

        // Buscar actividades de hoy que aún no se han completado
        const todayActivities = activities.filter(activity => {
            const activityDate = new Date(activity.scheduledDate || activity.date);
            return this.isSameDay(activityDate, today) && activity.status !== 'completed';
        });

        if (todayActivities.length > 0) {
            setTimeout(() => {
                HelpersManager.showToast(
                    `Tienes ${todayActivities.length} actividad${todayActivities.length === 1 ? '' : 'es'} programada${todayActivities.length === 1 ? '' : 's'} para hoy`, 
                    'info',
                    4000
                );
            }, 5000);
        }
    }

    render() {
        const activities = StorageManager.getActivities();
        const upcomingEvents = this.getUpcomingEvents(activities);
        
        return `
            <div class="calendar-container">
                <!-- Header del Calendario -->
                <div class="bg-white rounded-lg shadow-md mb-6">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-2xl font-bold text-gray-800">
                                <i data-lucide="calendar" class="inline-block w-6 h-6 mr-2"></i>
                                Calendario de Actividades
                            </h2>
                            <div class="flex gap-2">
                                <button onclick="calendarComponent.previousPeriod()" 
                                        class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                                </button>
                                <button onclick="calendarComponent.goToToday()" 
                                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                    Hoy
                                </button>
                                <button onclick="calendarComponent.nextPeriod()" 
                                        class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Controles de Vista y Fecha Actual -->
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div class="flex items-center gap-4">
                                <h3 class="text-xl font-semibold text-gray-700">
                                    ${this.getFormattedPeriod()}
                                </h3>
                                <div class="flex bg-gray-100 rounded-lg p-1">
                                    <button onclick="calendarComponent.setViewMode('month')" 
                                            class="px-3 py-1 rounded ${this.viewMode === 'month' ? 'bg-white shadow' : ''} text-sm">
                                        Mes
                                    </button>
                                    <button onclick="calendarComponent.setViewMode('week')" 
                                            class="px-3 py-1 rounded ${this.viewMode === 'week' ? 'bg-white shadow' : ''} text-sm">
                                        Semana
                                    </button>
                                    <button onclick="calendarComponent.setViewMode('day')" 
                                            class="px-3 py-1 rounded ${this.viewMode === 'day' ? 'bg-white shadow' : ''} text-sm">
                                        Día
                                    </button>
                                </div>
                            </div>
                            <button onclick="calendarComponent.showAddEventModal()" 
                                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <i data-lucide="plus" class="w-4 h-4 mr-2 inline-block"></i>
                                Nueva Actividad
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <!-- Calendario Principal -->
                    <div class="lg:col-span-3">
                        <div class="bg-white rounded-lg shadow-md overflow-hidden">
                            ${this.renderCalendarView()}
                        </div>
                    </div>

                    <!-- Panel Lateral -->
                    <div class="lg:col-span-1 space-y-6">
                        <!-- Próximas Actividades -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i data-lucide="clock" class="w-5 h-5 mr-2 inline-block"></i>
                                Próximas Actividades
                            </h3>
                            <div class="space-y-3">
                                ${upcomingEvents.length > 0 ? 
                                    upcomingEvents.slice(0, 5).map(event => this.renderUpcomingEvent(event)).join('') :
                                    '<p class="text-gray-500 text-center py-4">No hay actividades próximas</p>'
                                }
                                ${upcomingEvents.length > 5 ? 
                                    `<button onclick="calendarComponent.showAllUpcoming()" 
                                             class="w-full text-blue-600 hover:text-blue-800 text-sm">
                                        Ver ${upcomingEvents.length - 5} más...
                                     </button>` : ''
                                }
                            </div>
                        </div>

                        <!-- Leyenda de Colores -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i data-lucide="palette" class="w-5 h-5 mr-2 inline-block"></i>
                                Tipos de Actividad
                            </h3>
                            <div class="space-y-2">
                                ${Object.entries(this.eventTypes).map(([key, type]) => `
                                    <div class="flex items-center gap-3 text-sm">
                                        <div class="w-4 h-4 ${type.color} rounded"></div>
                                        <i data-lucide="${type.icon}" class="w-4 h-4 text-gray-600"></i>
                                        <span>${type.label}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Resumen del Período -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i data-lucide="bar-chart" class="w-5 h-5 mr-2 inline-block"></i>
                                Resumen del Período
                            </h3>
                            ${this.renderPeriodSummary(activities)}
                        </div>

                        <!-- Acciones Rápidas -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i data-lucide="zap" class="w-5 h-5 mr-2 inline-block"></i>
                                Acciones Rápidas
                            </h3>
                            <div class="space-y-2">
                                <button onclick="calendarComponent.quickAddHarvest()" 
                                        class="w-full bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 transition-colors">
                                    <i data-lucide="scissors" class="w-4 h-4 mr-2 inline-block"></i>
                                    Programar Cosecha
                                </button>
                                <button onclick="calendarComponent.quickAddFertilize()" 
                                        class="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                                    <i data-lucide="droplets" class="w-4 h-4 mr-2 inline-block"></i>
                                    Programar Abono
                                </button>
                                <button onclick="calendarComponent.quickAddSpray()" 
                                        class="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                                    <i data-lucide="spray-can" class="w-4 h-4 mr-2 inline-block"></i>
                                    Programar Fumigación
                                </button>
                                <button onclick="calendarComponent.exportCalendar()" 
                                        class="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors">
                                    <i data-lucide="download" class="w-4 h-4 mr-2 inline-block"></i>
                                    Exportar Calendario
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal para Eventos -->
                ${this.showEventModal ? this.renderEventModal() : ''}
            </div>
        `;
    }

    renderCalendarView() {
        switch(this.viewMode) {
            case 'month':
                return this.renderMonthView();
            case 'week':
                return this.renderWeekView();
            case 'day':
                return this.renderDayView();
            default:
                return this.renderMonthView();
        }
    }

    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const activities = StorageManager.getActivities();
        const weeks = [];
        let currentWeek = [];
        
        for (let d = new Date(startDate); d <= lastDay || currentWeek.length < 7; d.setDate(d.getDate() + 1)) {
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            
            const dayEvents = this.getEventsForDate(d, activities);
            currentWeek.push({
                date: new Date(d),
                isCurrentMonth: d.getMonth() === month,
                isToday: this.isToday(d),
                isSelected: this.selectedDate && this.isSameDay(d, this.selectedDate),
                events: dayEvents
            });
        }
        
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return `
            <div class="p-6">
                <!-- Días de la semana -->
                <div class="grid grid-cols-7 gap-1 mb-4">
                    ${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => `
                        <div class="text-center text-sm font-semibold text-gray-600 py-2">
                            ${day}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Calendar Grid -->
                <div class="grid grid-cols-7 gap-1">
                    ${weeks.map(week => 
                        week.map(day => this.renderDayCell(day)).join('')
                    ).join('')}
                </div>
            </div>
        `;
    }

    renderDayCell(day) {
        const dayClass = `
            border border-gray-200 min-h-24 p-1 cursor-pointer hover:bg-gray-50 transition-colors
            ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
            ${day.isToday ? 'bg-blue-50 border-blue-300' : ''}
            ${day.isSelected ? 'ring-2 ring-blue-500' : ''}
        `;

        return `
            <div class="${dayClass}" onclick="calendarComponent.selectDate('${day.date.toISOString()}')">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-sm font-medium ${day.isToday ? 'text-blue-600' : ''}">
                        ${day.date.getDate()}
                    </span>
                    ${day.events.length > 0 ? `
                        <span class="text-xs bg-red-500 text-white rounded-full px-1 min-w-4 h-4 flex items-center justify-center">
                            ${day.events.length}
                        </span>
                    ` : ''}
                </div>
                
                <div class="space-y-1">
                    ${day.events.slice(0, 2).map(event => {
                        const eventType = this.eventTypes[event.type] || this.eventTypes.maintenance;
                        return `
                            <div class="text-xs ${eventType.color} text-white px-1 py-0.5 rounded truncate"
                                 title="${event.description || eventType.label}">
                                ${eventType.label}
                            </div>
                        `;
                    }).join('')}
                    ${day.events.length > 2 ? `
                        <div class="text-xs text-gray-500">+${day.events.length - 2} más</div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderWeekView() {
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
        
        const weekDays = [];
        const activities = StorageManager.getActivities();
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dayEvents = this.getEventsForDate(day, activities);
            weekDays.push({
                date: day,
                events: dayEvents,
                isToday: this.isToday(day)
            });
        }

        return `
            <div class="p-6">
                <div class="grid grid-cols-7 gap-4">
                    ${weekDays.map(day => `
                        <div class="text-center">
                            <div class="text-sm font-semibold text-gray-600 mb-2">
                                ${day.date.toLocaleDateString('es-ES', { weekday: 'short' })}
                            </div>
                            <div class="text-lg font-bold mb-4 ${day.isToday ? 'text-blue-600' : 'text-gray-800'}">
                                ${day.date.getDate()}
                            </div>
                            <div class="space-y-2">
                                ${day.events.map(event => {
                                    const eventType = this.eventTypes[event.type] || this.eventTypes.maintenance;
                                    return `
                                        <div class="text-xs ${eventType.color} text-white px-2 py-1 rounded cursor-pointer hover:opacity-80"
                                             onclick="calendarComponent.showEventDetails('${event.id}')"
                                             title="${event.description || eventType.label}">
                                            <i data-lucide="${eventType.icon}" class="w-3 h-3 mr-1 inline-block"></i>
                                            ${eventType.label}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDayView() {
        const activities = StorageManager.getActivities();
        const dayEvents = this.getEventsForDate(this.currentDate, activities);
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return `
            <div class="p-6">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">
                        ${this.currentDate.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </h3>
                </div>
                
                <div class="space-y-2">
                    ${hours.map(hour => `
                        <div class="flex border-b border-gray-100 py-2">
                            <div class="w-16 text-sm text-gray-500 text-right pr-4">
                                ${hour.toString().padStart(2, '0')}:00
                            </div>
                            <div class="flex-1">
                                ${dayEvents
                                    .filter(event => {
                                        const eventHour = new Date(event.scheduledDate).getHours();
                                        return eventHour === hour;
                                    })
                                    .map(event => {
                                        const eventType = this.eventTypes[event.type] || this.eventTypes.maintenance;
                                        return `
                                            <div class="mb-1">
                                                <div class="${eventType.color} text-white px-3 py-2 rounded cursor-pointer hover:opacity-80"
                                                     onclick="calendarComponent.showEventDetails('${event.id}')">
                                                    <div class="flex items-center">
                                                        <i data-lucide="${eventType.icon}" class="w-4 h-4 mr-2"></i>
                                                        <span class="font-medium">${eventType.label}</span>
                                                    </div>
                                                    ${event.description ? `<div class="text-sm opacity-90 mt-1">${event.description}</div>` : ''}
                                                    ${event.treeCode ? `<div class="text-xs opacity-75 mt-1">Árbol: ${event.treeCode}</div>` : ''}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderUpcomingEvent(event) {
        const eventType = this.eventTypes[event.type] || this.eventTypes.maintenance;
        const eventDate = new Date(event.scheduledDate);
        const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                 onclick="calendarComponent.showEventDetails('${event.id}')">
                <div class="w-3 h-3 ${eventType.color} rounded-full mt-1 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-800 truncate">
                        ${eventType.label}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${eventDate.toLocaleDateString('es-ES')}
                        ${daysUntil === 0 ? '(Hoy)' : daysUntil === 1 ? '(Mañana)' : `(${daysUntil} días)`}
                    </div>
                    ${event.treeCode ? `
                        <div class="text-xs text-gray-400 mt-1">${event.treeCode}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderPeriodSummary(activities) {
        const periodStart = this.getPeriodStart();
        const periodEnd = this.getPeriodEnd();
        
        const periodActivities = activities.filter(activity => {
            const activityDate = new Date(activity.scheduledDate || activity.date);
            return activityDate >= periodStart && activityDate <= periodEnd;
        });

        const summary = {};
        periodActivities.forEach(activity => {
            summary[activity.type] = (summary[activity.type] || 0) + 1;
        });

        return `
            <div class="space-y-3">
                ${Object.entries(summary).length > 0 ? 
                    Object.entries(summary).map(([type, count]) => {
                        const eventType = this.eventTypes[type] || this.eventTypes.maintenance;
                        return `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 ${eventType.color} rounded"></div>
                                    <span class="text-sm text-gray-700">${eventType.label}</span>
                                </div>
                                <span class="text-sm font-semibold text-gray-800">${count}</span>
                            </div>
                        `;
                    }).join('') :
                    '<p class="text-gray-500 text-center py-4 text-sm">No hay actividades en este período</p>'
                }
                
                <div class="border-t border-gray-200 pt-3 mt-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700">Total</span>
                        <span class="text-sm font-bold text-gray-800">${periodActivities.length}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderEventModal() {
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="calendarComponent.closeEventModal()">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-md m-4" onclick="event.stopPropagation()">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-semibold text-gray-800">
                                ${this.currentEvent ? 'Editar Actividad' : 'Nueva Actividad'}
                            </h3>
                            <button onclick="calendarComponent.closeEventModal()" 
                                    class="text-gray-400 hover:text-gray-600">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                        
                        <form onsubmit="calendarComponent.saveEvent(event)">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Actividad</label>
                                    <select id="event-type" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                        ${Object.entries(this.eventTypes).map(([key, type]) => `
                                            <option value="${key}" ${this.currentEvent?.type === key ? 'selected' : ''}>
                                                ${type.label}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input type="date" id="event-date" required 
                                           value="${this.currentEvent?.scheduledDate ? 
                                               new Date(this.currentEvent.scheduledDate).toISOString().split('T')[0] : 
                                               this.selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
                                           }"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Hora (opcional)</label>
                                    <input type="time" id="event-time" 
                                           value="${this.currentEvent?.scheduledDate ? 
                                               new Date(this.currentEvent.scheduledDate).toTimeString().slice(0,5) : '08:00'
                                           }"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Árbol (opcional)</label>
                                    <select id="event-tree" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                        <option value="">Todos los árboles</option>
                                        ${StorageManager.getTrees().map(tree => `
                                            <option value="${tree.id}" ${this.currentEvent?.treeId === tree.id ? 'selected' : ''}>
                                                ${tree.code} - ${tree.variety}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea id="event-description" rows="3" 
                                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                              placeholder="Detalles adicionales...">${this.currentEvent?.description || ''}</textarea>
                                </div>
                                
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" id="event-reminder" 
                                           ${this.currentEvent?.reminder ? 'checked' : ''}>
                                    <label for="event-reminder" class="text-sm text-gray-700">Recordarme 1 día antes</label>
                                </div>
                            </div>
                            
                            <div class="flex gap-3 mt-6">
                                <button type="submit" 
                                        class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    ${this.currentEvent ? 'Actualizar' : 'Crear'} Actividad
                                </button>
                                <button type="button" onclick="calendarComponent.closeEventModal()" 
                                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                    Cancelar
                                </button>
                                ${this.currentEvent ? `
                                    <button type="button" onclick="calendarComponent.deleteEvent('${this.currentEvent.id}')" 
                                            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                        Eliminar
                                    </button>
                                ` : ''}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
}

// Instancia global
const calendarComponent = new CalendarComponent();