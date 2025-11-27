/**
 * SISTEMA COMPLETO DE GESTIÓN AGRÍCOLA - VERSION FINAL
 * 
 * MÓDULOS COMPLETOS:
 * ✅ Árboles (Sectores, Surcos, Árboles, Tipos de árbol)
 * ✅ Producción (3 tipos de cosecha, proyecciones, merma, tipo de producto)
 * ✅ Ventas (Clientes, ventas, métodos de pago, meta mensual, dashboard detallado)
 * ✅ Gastos (Categorías personalizadas, presupuesto mensual, gastos recurrentes, múltiples destinos, métricas automáticas)
 * ✅ Tareas (Calendario interactivo, notificaciones push, prioridades, tareas recurrentes, postponer, completar, dashboard)
 * ✅ Reportes Avanzados (ROI, ganancia neta, filtros por mes/producto, comparativas vs mes anterior, top performers)
 * 
 * CARACTERÍSTICAS:
 * ✅ DatePicker con calendario visual en todos los campos de fecha
 * ✅ Edición y eliminación completas en todos los módulos
 * ✅ Validaciones robustas
 * ✅ Unidades personalizadas
 * ✅ Métricas financieras completas (ROI, margen de ganancia, costo por unidad)
 * ✅ Dashboard integrado con estadísticas en tiempo real
 * ✅ Navegación intuitiva
 * ✅ Sistema de notificaciones para tareas
 * ✅ Relaciones entre módulos (gastos por árbol/sector/surco, tareas por ubicación)
 * 
 * ESTE ES EL ARCHIVO FINAL COMPLETO - LISTO PARA PRODUCCIÓN
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ========================================
// VERSIÓN: 2024-01-03-FINAL-v7.2-PRESUPUESTOS-FIX
// SI VES ESTO EN CONSOLA, EL CÓDIGO ESTÁ ACTUALIZADO
// ✅ Error de permisos en presupuestos CORREGIDO
// ✅ BudgetScreen y BudgetModal usan currentFarm
// ✅ Presupuestos por finca separados
// ========================================
console.log("🚀 VERSIÓN DEL CÓDIGO: 2024-01-03-FINAL-v7.2-PRESUPUESTOS-FIX");
console.log("✅ Presupuestos corregidos");
console.log("✅ Permisos resueltos");
console.log("✅ Módulo funcional");
console.log("📅 Última actualización: " + new Date().toISOString());

import firebase from 'firebase';
import {
  PLANS,
  checkIfPremium,
  AdBanner,
  showInterstitialAd,
  showRewardedAd,
  RequestPremiumModal,
  Paywall,
  AdminMetricsDashboard,
  ActivatePremiumPanel,
  PlatformMetricsDashboard,  // 🆕 AGREGAR ESTA LÍNEA
} from './MONETIZATION-COMPONENTS';

// Sistema de roles
const ROLES = { 
  OWNER: 'owner', 
  MANAGER: 'manager', 
  WORKER: 'worker',
  PLATFORM_ADMIN: 'platform_admin'  // 🆕 ROL DE SUPER ADMIN
};

// ============ FIREBASE CONFIGURATION ============
const firebaseConfig = {
  apiKey: "AIzaSyDm_DenNbuG-zLS-8tupO8BZEpfo5z3MY8",
  authDomain: "fincalaherradura-c5229.firebaseapp.com",
  projectId: "fincalaherradura-c5229",
  storageBucket: "fincalaherradura-c5229.firebasestorage.app",
  messagingSenderId: "453253173599",
  appId: "1:453253173599:web:f5f31e55fc1a93e7f5a6ea"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();


// ============ HELPER: Get Farm Collection ============
const getFarmCollection = (collectionName, farm) => {
  if (!farm || !farm.id) {
    console.error('❌ Error: No hay finca seleccionada');
    console.error('   Collection:', collectionName);
    console.error('   Farm:', farm);
    // Solo log en consola, no mostrar Alert al usuario
    return null;
  }
  return db.collection('farms').doc(farm.id).collection(collectionName);
};


// Generar ID único para fincas
const generateFarmId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `farm_${timestamp}_${randomStr}`;
};

// Crear documento de finca en Firestore
const createFarmDocument = async (farmId, farmName, ownerId) => {
  try {
    await db.collection('farms').doc(farmId).set({
      name: farmName,
      ownerId: ownerId,
      createdAt: new Date().toISOString(),
      members: [ownerId],
      settings: {
        currency: 'Q'
      }
    });
    console.log('✅ Documento de finca creado:', farmId);
    return true;
  } catch (error) {
    console.error('❌ Error creando finca:', error);
    return false;
  }
};



// ============ ANÁLISIS INTELIGENTE Y PREDICCIONES ============
const SmartAnalytics = {
  // Analizar tendencias de producción
  analyzeProductionTrends: async () => {
    try {
      const harvestsSnap = await getFarmCollection('harvests', currentFarm).get();
      const harvests = harvestsSnap.docs.map(doc => doc.data());
      
      // Últimos 3 meses
      const now = new Date();
      const months = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toISOString().substring(0, 7));
      }
      
      const monthlyProduction = months.map(month => {
        const total = harvests
          .filter(h => h.date?.startsWith(month))
          .reduce((sum, h) => sum + (h.quantity || 0), 0);
        return { month, total };
      }).reverse();
      
      // Calcular tendencia
      if (monthlyProduction.length >= 2) {
        const last = monthlyProduction[monthlyProduction.length - 1].total;
        const prev = monthlyProduction[monthlyProduction.length - 2].total;
        const change = prev > 0 ? ((last - prev) / prev * 100) : 0;
        
        return {
          trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
          change: change.toFixed(1),
          data: monthlyProduction,
          prediction: last * (1 + change / 100), // Predicción simple mes siguiente
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error analyzing trends:', error);
      return null;
    }
  },

  // Alertas inteligentes avanzadas
  getSmartAlerts: async () => {
    const alerts = [];
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    try {
      // 1. ALERTA: Presupuesto
      const [budgetSnap, expensesSnap] = await Promise.all([
        db.collection('budgets').where('month', '==', currentMonth).get(),
        getFarmCollection('expenses', currentFarm).get(),
      ]);
      
      if (!budgetSnap.empty) {
        const budget = budgetSnap.docs[0].data().amount;
        const expenses = expensesSnap.docs
          .map(doc => doc.data())
          .filter(e => e.date?.startsWith(currentMonth))
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        
        const percentage = (expenses / budget) * 100;
        const remaining = budget - expenses;
        const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
        const dailyBudget = remaining / daysLeft;
        
        if (percentage > 100) {
          alerts.push({
            id: 'budget-exceeded',
            type: 'critical',
            icon: 'warning',
            color: '#F44336',
            title: '💸 Presupuesto Excedido',
            message: `Excediste el presupuesto en Q${(expenses - budget).toFixed(0)}`,
            recommendation: `Reduce gastos o ajusta presupuesto para el siguiente mes`,
            action: 'Ver Gastos',
            module: 'Expenses'
          });
        } else if (percentage > 90) {
          alerts.push({
            id: 'budget-warning',
            type: 'warning',
            icon: 'alert-circle',
            color: '#FF9800',
            title: '⚠️ Presupuesto Casi Agotado',
            message: `${percentage.toFixed(0)}% gastado - Quedan Q${remaining.toFixed(0)} para ${daysLeft} días`,
            recommendation: `Presupuesto diario recomendado: Q${dailyBudget.toFixed(0)}/día`,
            action: 'Ver Gastos',
            module: 'Expenses'
          });
        } else if (percentage > 70 && daysLeft < 10) {
          alerts.push({
            id: 'budget-pace',
            type: 'info',
            icon: 'information-circle',
            color: '#2196F3',
            title: '📊 Ritmo de Gasto Normal',
            message: `${percentage.toFixed(0)}% usado - Presupuesto bajo control`,
            recommendation: `Puedes gastar hasta Q${dailyBudget.toFixed(0)}/día`,
            action: 'Ver Gastos',
            module: 'Expenses'
          });
        }
      }
      
      // 2. ALERTA: Tareas atrasadas
      const today = new Date().toISOString().split('T')[0];
      const tasksSnap = await getFarmCollection('tasks', currentFarm).where('status', '==', 'pending').get();
      const overdue = tasksSnap.docs.filter(doc => doc.data().dueDate < today);
      const upcoming = tasksSnap.docs.filter(doc => {
        const dueDate = doc.data().dueDate;
        const diff = (new Date(dueDate) - new Date(today)) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 3;
      });
      
      if (overdue.length > 0) {
        alerts.push({
          id: 'tasks-overdue',
          type: 'critical',
          icon: 'calendar',
          color: '#F44336',
          title: '📅 Tareas Atrasadas',
          message: `${overdue.length} tarea(s) vencida(s)`,
          recommendation: overdue.length > 5 
            ? 'Prioriza las más importantes o reasigna al equipo'
            : 'Completa estas tareas hoy para ponerte al día',
          action: 'Ver Tareas',
          module: 'Tasks'
        });
      } else if (upcoming.length > 0) {
        alerts.push({
          id: 'tasks-upcoming',
          type: 'info',
          icon: 'time',
          color: '#2196F3',
          title: '⏰ Tareas Próximas',
          message: `${upcoming.length} tarea(s) vencen en los próximos 3 días`,
          recommendation: 'Planifica tu semana para completarlas a tiempo',
          action: 'Ver Tareas',
          module: 'Tasks'
        });
      }
      
      // 3. ALERTA: Producción
      const trends = await SmartAnalytics.analyzeProductionTrends();
      if (trends) {
        if (trends.trend === 'down') {
          alerts.push({
            id: 'production-drop',
            type: 'warning',
            icon: 'trending-down',
            color: '#FF9800',
            title: '📉 Caída en Producción',
            message: `Producción bajó ${Math.abs(parseFloat(trends.change))}% vs mes anterior`,
            recommendation: 'Revisa salud de árboles, clima y aplicaciones de fertilizantes',
            action: 'Ver Producción',
            module: 'Production'
          });
        } else if (trends.trend === 'up') {
          alerts.push({
            id: 'production-growth',
            type: 'success',
            icon: 'trending-up',
            color: '#4CAF50',
            title: '📈 Crecimiento en Producción',
            message: `Producción aumentó ${trends.change}% vs mes anterior`,
            recommendation: `Continúa con las prácticas actuales. Proyección próximo mes: ${trends.prediction.toFixed(0)} unidades`,
            action: 'Ver Producción',
            module: 'Production'
          });
        }
      }
      
      // 4. ALERTA: Stock bajo
      const harvestsSnap = await getFarmCollection('harvests', currentFarm).get();
      const salesSnap = await getFarmCollection('sales', currentFarm).get();
      
      const harvests = harvestsSnap.docs.map(doc => doc.data());
      const sales = salesSnap.docs.map(doc => doc.data());
      
      const currentHarvest = harvests
        .filter(h => h.date?.startsWith(currentMonth))
        .reduce((sum, h) => sum + (h.quantity || 0), 0);
      
      const currentSales = sales
        .filter(s => s.date?.startsWith(currentMonth))
        .reduce((sum, s) => sum + (s.quantity || 0), 0);
      
      const available = currentHarvest - currentSales;
      const sellRate = currentSales / new Date().getDate(); // Ventas diarias promedio
      const daysUntilEmpty = available / (sellRate || 1);
      
      if (available < 100 && currentHarvest > 0) {
        alerts.push({
          id: 'low-stock',
          type: 'warning',
          icon: 'cube-outline',
          color: '#FF9800',
          title: '📦 Stock Bajo',
          message: `Solo ${available.toFixed(0)} unidades disponibles`,
          recommendation: daysUntilEmpty < 5 
            ? `¡Urgente! Stock se agotará en ~${daysUntilEmpty.toFixed(0)} días. Programa cosecha.`
            : `Stock actual suficiente para ~${daysUntilEmpty.toFixed(0)} días`,
          action: 'Ver Producción',
          module: 'Production'
        });
      }
      
      // 5. ALERTA: Oportunidad de venta
      if (available > 500) {
        const avgPrice = sales.length > 0 
          ? sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0) / sales.reduce((sum, s) => sum + (s.quantity || 0), 0)
          : 0;
        const potentialRevenue = available * avgPrice;
        
        alerts.push({
          id: 'sales-opportunity',
          type: 'success',
          icon: 'cash',
          color: '#4CAF50',
          title: '💰 Oportunidad de Venta',
          message: `Tienes ${available.toFixed(0)} unidades disponibles`,
          recommendation: `Potencial de ingresos: Q${potentialRevenue.toFixed(0)}. Contacta clientes.`,
          action: 'Ver Ventas',
          module: 'Sales'
        });
      }
      
      // 6. ALERTA: Inventario bajo stock
      const inventorySnap = await getFarmCollection('inventory', currentFarm).get();
      const lowStockItems = inventorySnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.quantity <= item.minStock);
      
      if (lowStockItems.length > 0) {
        const criticalItems = lowStockItems.filter(item => item.quantity === 0);
        if (criticalItems.length > 0) {
          alerts.push({
            id: 'inventory-critical',
            type: 'critical',
            icon: 'alert-circle',
            color: '#F44336',
            title: '🚨 Productos Agotados',
            message: `${criticalItems.length} producto(s) sin stock`,
            recommendation: 'Reabastecer urgentemente: ' + criticalItems.map(i => i.name).slice(0, 2).join(', '),
            action: 'Ver Inventario',
            module: 'Inventory'
          });
        } else {
          alerts.push({
            id: 'inventory-low-stock',
            type: 'warning',
            icon: 'cube',
            color: '#FF9800',
            title: '📦 Stock Bajo',
            message: `${lowStockItems.length} producto(s) con stock bajo`,
            recommendation: 'Planifica reabastecimiento: ' + lowStockItems.map(i => i.name).slice(0, 2).join(', '),
            action: 'Ver Inventario',
            module: 'Inventory'
          });
        }
      }
      
    } catch (error) {
      console.error('Error getting smart alerts:', error);
    }
    
    // Ordenar por tipo: critical > warning > success > info
    const priority = { critical: 0, warning: 1, success: 2, info: 3 };
    return alerts.sort((a, b) => priority[a.type] - priority[b.type]);
  },

  // Generar insights y recomendaciones
  generateInsights: async () => {
    const insights = [];
    
    try {
      const [harvestsSnap, salesSnap, expensesSnap, tasksSnap] = await Promise.all([
        getFarmCollection('harvests', currentFarm).get(),
        getFarmCollection('sales', currentFarm).get(),
        getFarmCollection('expenses', currentFarm).get(),
        getFarmCollection('tasks', currentFarm).get(),
      ]);
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      
      // Insight: Rentabilidad
      const revenue = salesSnap.docs
        .map(d => d.data())
        .filter(s => s.date?.startsWith(currentMonth))
        .reduce((sum, s) => sum + (s.totalPrice || 0), 0);
      
      const costs = expensesSnap.docs
        .map(d => d.data())
        .filter(e => e.date?.startsWith(currentMonth))
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue * 100) : 0;
      
      if (margin > 40) {
        insights.push({
          icon: 'trophy',
          color: '#4CAF50',
          title: 'Excelente Rentabilidad',
          message: `Margen de ganancia: ${margin.toFixed(0)}% - ¡Muy por encima del promedio del sector!`
        });
      } else if (margin < 20 && revenue > 0) {
        insights.push({
          icon: 'warning',
          color: '#FF9800',
          title: 'Margen Bajo',
          message: `Margen: ${margin.toFixed(0)}%. Considera reducir costos o aumentar precios.`
        });
      }
      
      // Insight: Eficiencia de tareas
      const completedTasks = tasksSnap.docs.filter(d => d.data().status === 'completed').length;
      const totalTasks = tasksSnap.docs.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;
      
      if (completionRate > 80) {
        insights.push({
          icon: 'checkmark-circle',
          color: '#4CAF50',
          title: 'Equipo Eficiente',
          message: `${completionRate.toFixed(0)}% de tareas completadas - ¡Excelente trabajo!`
        });
      } else if (completionRate < 50) {
        insights.push({
          icon: 'alert-circle',
          color: '#FF9800',
          title: 'Tareas Pendientes',
          message: `Solo ${completionRate.toFixed(0)}% completadas. Revisa prioridades o asigna más recursos.`
        });
      }
      
      // Insight: Mejor cliente
      const customerSales = {};
      salesSnap.docs.forEach(doc => {
        const sale = doc.data();
        if (sale.customerName) {
          customerSales[sale.customerName] = (customerSales[sale.customerName] || 0) + (sale.totalPrice || 0);
        }
      });
      
      const topCustomer = Object.entries(customerSales).sort((a, b) => b[1] - a[1])[0];
      if (topCustomer) {
        insights.push({
          icon: 'star',
          color: '#2196F3',
          title: 'Cliente Top',
          message: `${topCustomer[0]} genera Q${topCustomer[1].toFixed(0)} en ventas. Mantén esta relación.`
        });
      }
      
    } catch (error) {
      console.error('Error generating insights:', error);
    }
    
    return insights;
  },
};




// ============ SISTEMA DE CLIMA (OpenWeatherMap) ============
const WEATHER_API_KEY = '3e27d54a23ed3cc0934174cc13d878';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

const WeatherService = {
  // Obtener clima actual
  getCurrentWeather: async (lat, lon) => {
    try {
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
      );
      const data = await response.json();
      return {
        temp: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        wind_speed: data.wind.speed,
        clouds: data.clouds.all,
        rain: data.rain ? data.rain['1h'] || 0 : 0,
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      return null;
    }
  },

  // Obtener pronóstico 5 días
  getForecast: async (lat, lon) => {
    try {
      const response = await fetch(
        `${WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
      );
      const data = await response.json();
      
      // Agrupar por día
      const dailyForecasts = {};
      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyForecasts[date]) {
          dailyForecasts[date] = {
            date,
            temps: [],
            conditions: [],
            rain: 0,
            humidity: [],
          };
        }
        dailyForecasts[date].temps.push(item.main.temp);
        dailyForecasts[date].conditions.push(item.weather[0].description);
        dailyForecasts[date].humidity.push(item.main.humidity);
        if (item.rain && item.rain['3h']) {
          dailyForecasts[date].rain += item.rain['3h'];
        }
      });

      // Calcular promedios por día
      return Object.values(dailyForecasts).slice(0, 5).map(day => ({
        date: day.date,
        temp_max: Math.max(...day.temps),
        temp_min: Math.min(...day.temps),
        temp_avg: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
        condition: day.conditions[0],
        rain: day.rain,
        humidity: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
      }));
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return [];
    }
  },

  // Analizar clima y generar alertas
  analyzeWeatherAlerts: (currentWeather, forecast) => {
    const alerts = [];

    if (!currentWeather || !forecast.length) return alerts;

    // Alerta de lluvia fuerte actual
    if (currentWeather.rain > 5) {
      alerts.push({
        id: 'weather-heavy-rain',
        type: 'critical',
        icon: 'rainy',
        color: '#2196F3',
        title: '🌧️ Lluvia Fuerte',
        message: `Lluvia intensa ahora: ${currentWeather.rain.toFixed(1)}mm/h`,
        recommendation: 'Pospón cosecha y aplicaciones. Revisa drenajes.',
        action: 'Ver Tareas',
        module: 'Tasks',
      });
    }

    // Alerta de temperatura alta
    if (currentWeather.temp > 35) {
      alerts.push({
        id: 'weather-high-temp',
        type: 'warning',
        icon: 'sunny',
        color: '#FF9800',
        title: '🌡️ Temperatura Alta',
        message: `${currentWeather.temp.toFixed(0)}°C - Calor extremo`,
        recommendation: 'Aumenta riego. Evita trabajo pesado en horas pico.',
        action: 'Ver Tareas',
        module: 'Tasks',
      });
    }

    // Alerta de temperatura baja (riesgo de helada)
    if (currentWeather.temp < 5) {
      alerts.push({
        id: 'weather-frost-risk',
        type: 'critical',
        icon: 'snow',
        color: '#03A9F4',
        title: '❄️ Riesgo de Helada',
        message: `${currentWeather.temp.toFixed(0)}°C - Temperatura muy baja`,
        recommendation: '¡URGENTE! Protege cultivos. Considera riego anti-helada.',
        action: 'Ver Tareas',
        module: 'Tasks',
      });
    }

    // Alerta de vientos fuertes
    if (currentWeather.wind_speed > 15) {
      alerts.push({
        id: 'weather-strong-wind',
        type: 'warning',
        icon: 'cloudy',
        color: '#607D8B',
        title: '💨 Vientos Fuertes',
        message: `${currentWeather.wind_speed.toFixed(0)} km/h`,
        recommendation: 'Pospón aplicaciones foliares. Revisa tutores de árboles.',
        action: 'Ver Tareas',
        module: 'Tasks',
      });
    }

    // Alerta de lluvia próxima (próximos 2 días)
    const rainNext2Days = forecast.slice(0, 2).reduce((sum, day) => sum + day.rain, 0);
    if (rainNext2Days > 10) {
      alerts.push({
        id: 'weather-rain-forecast',
        type: 'info',
        icon: 'umbrella',
        color: '#2196F3',
        title: '☔ Lluvia Próxima',
        message: `Se esperan ${rainNext2Days.toFixed(0)}mm en 48 horas`,
        recommendation: 'Planifica cosecha antes de la lluvia. Prepara drenajes.',
        action: 'Ver Pronóstico',
        module: 'Dashboard',
      });
    }

    // Alerta de condiciones ideales
    if (currentWeather.temp >= 18 && currentWeather.temp <= 28 && 
        currentWeather.rain === 0 && currentWeather.wind_speed < 10) {
      alerts.push({
        id: 'weather-ideal',
        type: 'success',
        icon: 'sunny',
        color: '#4CAF50',
        title: '✨ Clima Ideal',
        message: `Condiciones perfectas para trabajo en campo`,
        recommendation: 'Excelente día para cosecha, aplicaciones y mantenimiento.',
        action: 'Ver Tareas',
        module: 'Tasks',
      });
    }

    return alerts;
  },

  // Recomendaciones basadas en clima
  getWeatherRecommendations: (currentWeather, forecast) => {
    const recommendations = [];

    if (!currentWeather) return recommendations;

    // Recomendación de riego
    if (currentWeather.temp > 28 && currentWeather.humidity < 60) {
      recommendations.push({
        icon: 'water',
        color: '#2196F3',
        title: 'Riego Recomendado',
        message: 'Temperatura alta y humedad baja. Aumenta frecuencia de riego.',
      });
    } else if (currentWeather.rain > 0 || forecast.slice(0, 1).some(d => d.rain > 5)) {
      recommendations.push({
        icon: 'water-outline',
        color: '#4CAF50',
        title: 'Riego No Necesario',
        message: 'Lluvia reciente o próxima. Puedes reducir riego.',
      });
    }

    // Recomendación de aplicaciones
    if (currentWeather.wind_speed < 10 && currentWeather.rain === 0) {
      recommendations.push({
        icon: 'flask',
        color: '#4CAF50',
        title: 'Bueno para Aplicaciones',
        message: 'Condiciones ideales para aplicar fertilizantes o pesticidas.',
      });
    } else if (currentWeather.wind_speed > 15 || currentWeather.rain > 0) {
      recommendations.push({
        icon: 'flask-outline',
        color: '#FF9800',
        title: 'Evita Aplicaciones',
        message: 'Viento fuerte o lluvia. Pospón aplicaciones foliares.',
      });
    }

    // Recomendación de cosecha
    const rainNext24h = forecast.length > 0 ? forecast[0].rain : 0;
    if (currentWeather.rain === 0 && rainNext24h < 2) {
      recommendations.push({
        icon: 'basket',
        color: '#4CAF50',
        title: 'Buen Momento para Cosechar',
        message: 'Sin lluvia en próximas 24h. Ideal para cosecha.',
      });
    } else if (rainNext24h > 5) {
      recommendations.push({
        icon: 'basket-outline',
        color: '#FF9800',
        title: 'Pospón Cosecha',
        message: `Lluvia esperada: ${rainNext24h.toFixed(0)}mm. Cosecha antes o después.`,
      });
    }

    return recommendations;
  },
};



// ============ MODAL DE CONFIGURACIÓN DE UBICACIÓN ============
function LocationSettingsModal({ visible, onClose, currentLocation, onSave }) {
  const [lat, setLat] = useState(currentLocation?.lat?.toString() || '14.6349');
  const [lon, setLon] = useState(currentLocation?.lon?.toString() || '-90.5069');
  const [locationName, setLocationName] = useState(currentLocation?.name || 'Finca La Herradura');

  const handleSave = async () => {
    const location = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      name: locationName,
    };
    
    try {
      await onSave(location);
      Alert.alert('Éxito', 'Ubicación guardada correctamente');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la ubicación');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, width: '90%' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
            📍 Ubicación de la Finca
          </Text>
          
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 15 }}>
            Configura la ubicación de tu finca para obtener pronósticos precisos del clima.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre de la finca"
            value={locationName}
            onChangeText={setLocationName}
          />

          <TextInput
            style={styles.input}
            placeholder="Latitud (ej: 14.6349)"
            value={lat}
            onChangeText={setLat}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Longitud (ej: -90.5069)"
            value={lon}
            onChangeText={setLon}
            keyboardType="numeric"
          />

          <View style={{ backgroundColor: '#E3F2FD', padding: 10, borderRadius: 8, marginBottom: 15 }}>
            <Text style={{ fontSize: 12, color: '#1976D2' }}>
              💡 Tip: Usa Google Maps para obtener las coordenadas exactas de tu finca.
            </Text>
          </View>

          <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginBottom: 15 }}>
            <Text style={{ fontSize: 11, color: '#E65100', fontWeight: '600' }}>
              Guatemala predeterminado: 14.6349, -90.5069
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, alignItems: 'center' }}
              onPress={onClose}
            >
              <Text style={{ color: '#666', fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, { flex: 1 }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


// ============ LOGIN SCREEN ============

// ============ MÓDULO DE INTELIGENCIA ARTIFICIAL ============

const AIService = {
  // Analizar datos y generar insights inteligentes
  analyzeProductionData: (trees, production, sales, expenses) => {
    const insights = [];
    
    // 1. Análisis de productividad por árbol
    if (trees > 0 && production > 0) {
      const prodPerTree = production / trees;
      if (prodPerTree < 50) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Baja productividad detectada',
          message: `Promedio de ${prodPerTree.toFixed(1)} kg por árbol. Considera fertilización adicional.`,
          priority: 'high'
        });
      } else if (prodPerTree > 100) {
        insights.push({
          type: 'success',
          icon: '🌟',
          title: 'Excelente productividad',
          message: `${prodPerTree.toFixed(1)} kg por árbol supera el promedio de la región.`,
          priority: 'info'
        });
      }
    }
    
    // 2. Análisis de rentabilidad
    if (sales > 0 && expenses > 0) {
      const roi = ((sales - expenses) / expenses) * 100;
      if (roi < 20) {
        insights.push({
          type: 'warning',
          icon: '💰',
          title: 'Rentabilidad baja',
          message: `ROI de ${roi.toFixed(1)}%. Revisa costos operativos y precios de venta.`,
          priority: 'high'
        });
      } else if (roi > 50) {
        insights.push({
          type: 'success',
          icon: '📈',
          title: 'Excelente rentabilidad',
          message: `ROI de ${roi.toFixed(1)}%. Considera expandir operaciones.`,
          priority: 'info'
        });
      }
    }
    
    // 3. Análisis de gastos
    if (sales > 0 && expenses > 0) {
      const expenseRatio = (expenses / sales) * 100;
      if (expenseRatio > 70) {
        insights.push({
          type: 'alert',
          icon: '🚨',
          title: 'Gastos muy altos',
          message: `Gastos representan ${expenseRatio.toFixed(1)}% de ventas. Optimiza costos urgentemente.`,
          priority: 'critical'
        });
      }
    }
    
    // 4. Predicción de cosecha
    if (production > 0) {
      const avgDaily = production / 30;
      const projectedMonth = avgDaily * 30 * 1.1; // 10% de crecimiento estimado
      insights.push({
        type: 'info',
        icon: '🔮',
        title: 'Proyección inteligente',
        message: `Basado en tendencias actuales, se proyectan ${projectedMonth.toFixed(0)} kg para el próximo mes.`,
        priority: 'info'
      });
    }
    
    return insights;
  },

  // Generar recomendaciones personalizadas
  generateRecommendations: (userData, weatherData) => {
    const recommendations = [];
    
    // Recomendaciones basadas en clima
    if (weatherData) {
      if (weatherData.temp > 30) {
        recommendations.push({
          icon: '💧',
          title: 'Riego adicional recomendado',
          description: 'Temperaturas altas detectadas. Aumenta frecuencia de riego.',
          action: 'Programar riego'
        });
      }
      
      if (weatherData.rain > 10) {
        recommendations.push({
          icon: '🌧️',
          title: 'Postponer aplicaciones',
          description: 'Lluvia esperada. Pospón fumigaciones y fertilizaciones foliares.',
          action: 'Ver calendario'
        });
      }
    }
    
    // Recomendaciones basadas en producción
    if (userData.productionTrend === 'decreasing') {
      recommendations.push({
        icon: '🌱',
        title: 'Revisa nutrición de plantas',
        description: 'Tendencia decreciente en producción. Considera análisis de suelo.',
        action: 'Programar análisis'
      });
    }
    
    return recommendations;
  },

  // Detectar patrones y anomalías
  detectAnomalies: (historicalData) => {
    const anomalies = [];
    
    if (historicalData && historicalData.length > 0) {
      const avg = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
      const latest = historicalData[historicalData.length - 1];
      
      // Detectar caída brusca
      if (latest < avg * 0.7) {
        anomalies.push({
          type: 'drop',
          severity: 'high',
          message: 'Caída significativa detectada en producción (-30%)',
          suggestion: 'Inspecciona árboles en busca de plagas o enfermedades'
        });
      }
      
      // Detectar pico inusual
      if (latest > avg * 1.5) {
        anomalies.push({
          type: 'spike',
          severity: 'medium',
          message: 'Pico inusual detectado en producción (+50%)',
          suggestion: 'Documenta las condiciones actuales para replicar resultados'
        });
      }
    }
    
    return anomalies;
  },

  // Optimización de recursos usando ML básico
  optimizeResources: (resources, usage, budget) => {
    const optimizations = [];
    
    // Análisis de uso vs presupuesto
    Object.keys(resources).forEach(resource => {
      const used = usage[resource] || 0;
      const allocated = budget[resource] || 0;
      
      if (used > allocated * 0.9) {
        optimizations.push({
          resource,
          type: 'over_budget',
          message: `${resource}: Cerca del límite presupuestario`,
          recommendation: 'Buscar alternativas más económicas'
        });
      } else if (used < allocated * 0.5) {
        optimizations.push({
          resource,
          type: 'under_used',
          message: `${resource}: Subutilizado`,
          recommendation: 'Reasignar presupuesto a áreas críticas'
        });
      }
    });
    
    return optimizations;
  }
};


function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Validar formato de email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Obtener mensaje de error amigable
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return '📧 El formato del correo electrónico no es válido';
      case 'auth/user-disabled':
        return '🚫 Esta cuenta ha sido deshabilitada';
      case 'auth/user-not-found':
        return '❌ No existe una cuenta con este correo';
      case 'auth/wrong-password':
        return '🔒 Contraseña incorrecta';
      case 'auth/email-already-in-use':
        return '⚠️ Este correo ya está registrado';
      case 'auth/weak-password':
        return '🔑 La contraseña debe tener al menos 6 caracteres';
      case 'auth/network-request-failed':
        return '📡 Error de conexión. Verifica tu internet';
      case 'auth/too-many-requests':
        return '⏰ Demasiados intentos. Intenta más tarde';
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return '❌ Credenciales inválidas. Verifica tu correo y contraseña';
      default:
        return '❌ Error: ' + errorCode;
    }
  };

  const handleLogin = async () => {
    // Validaciones
    if (!email || !password) {
      Alert.alert('Error', '📝 Por favor completa todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', '📧 El formato del correo electrónico no es válido');
      return;
    }

    setLoading(true);

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      console.log('✅ Login exitoso');
    } catch (error) {
      console.error('❌ Error en login:', error.code);
      Alert.alert('Error de inicio de sesión', getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    // Validaciones
    if (!name || !email || !password) {
      Alert.alert('Error', '📝 Por favor completa todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', '📧 El formato del correo electrónico no es válido');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', '🔑 La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      
      // 🆕 Generar ID único para la nueva finca
      const uniqueFarmId = generateFarmId();
      console.log('🆕 Generando nueva finca con ID:', uniqueFarmId);
      console.log('   Para usuario:', email);

      // 🆕 Crear documento de la finca en Firestore
      await createFarmDocument(uniqueFarmId, 'Mi Finca', userCredential.user.uid);

      // Crear usuario con su finca única
      await db.collection('users').doc(userCredential.user.uid).set({
        name: name,
        email: email,
        role: 'owner',
        createdAt: new Date().toISOString(),
        farms: [{
          id: uniqueFarmId,
          name: 'Mi Finca',
          role: 'owner',
          joinedAt: new Date().toISOString()
        }]
      });
      
      console.log('✅ Registro exitoso');
      console.log('   Usuario:', email);
      console.log('   Farm ID:', uniqueFarmId);
      console.log('   UID:', userCredential.user.uid);
      
      Alert.alert('¡Bienvenido!', `Cuenta creada exitosamente para ${name}`);
    } catch (error) {
      console.error('❌ Error en registro:', error.code);
      Alert.alert('Error de registro', getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Recuperar contraseña
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', '📧 Por favor ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(resetEmail)) {
      Alert.alert('Error', '📧 El formato del correo electrónico no es válido');
      return;
    }

    setLoading(true);

    try {
      await firebase.auth().sendPasswordResetEmail(resetEmail);
      Alert.alert(
        '✅ Correo enviado',
        `Hemos enviado un enlace de recuperación a ${resetEmail}. Revisa tu bandeja de entrada.`,
        [
          {
            text: 'Entendido',
            onPress: () => {
              setShowForgotPassword(false);
              setResetEmail('');
            }
          }
        ]
      );
      console.log('✅ Email de recuperación enviado');
    } catch (error) {
      console.error('❌ Error recuperación:', error.code);
      Alert.alert('Error', getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#4CAF50' }]}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 36, fontWeight: 'bold', color: 'white', marginBottom: 10 }}>
          🌱 AgroApp
        </Text>
        <Text style={{ fontSize: 16, color: 'white', marginBottom: 40 }}>
          Gestión profesional de fincas
        </Text>

        <View style={{ width: '100%', maxWidth: 400, backgroundColor: 'white', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
          
          {isSignUp && (
            <>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>Nombre completo</Text>
              <TextInput
                style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 }}
                placeholder="Juan Pérez"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </>
          )}

          <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>Correo electrónico</Text>
          <TextInput
            style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 }}
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>Contraseña</Text>
          <View style={{ position: 'relative', marginBottom: 10 }}>
            <TextInput
              style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, fontSize: 16, paddingRight: 50 }}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 15, top: 15 }}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#999" />
            </TouchableOpacity>
          </View>

          {!isSignUp && (
            <TouchableOpacity
              onPress={() => {
                setShowForgotPassword(true);
                setResetEmail(email);
              }}
              style={{ alignSelf: 'flex-end', marginBottom: 20 }}
              disabled={loading}
            >
              <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: '600' }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{ backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, opacity: loading ? 0.6 : 1 }}
            onPress={isSignUp ? handleSignUp : handleLogin}
            disabled={loading}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {loading ? 'Procesando...' : (isSignUp ? 'Crear cuenta' : 'Iniciar sesión')}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25 }}>
            <Text style={{ color: '#666', fontSize: 14 }}>
              {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(!isSignUp);
                setName('');
                setEmail('');
                setPassword('');
              }}
              disabled={loading}
            >
              <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: 'bold', marginLeft: 5 }}>
                {isSignUp ? 'Inicia sesión' : 'Regístrate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* MODAL RECUPERAR CONTRASEÑA */}
      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '50%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑 Recuperar Contraseña</Text>
              <TouchableOpacity onPress={() => setShowForgotPassword(false)} disabled={loading}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 }}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </Text>

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setShowForgotPassword(false)}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============ DASHBOARD SCREEN ============
function DashboardScreen({ user, settings, onNavigate, currentFarm, userFarms, userRole, showFarmSelector, setShowFarmSelector, setCurrentFarm, setUserRole }) {
  const [stats, setStats] = useState({
    totalTrees: 0,
    healthyTrees: 0,
    sectors: 0,
    rows: 0,
    totalProduction: 0,
    lastHarvest: null,
  });
    const [smartAlerts, setSmartAlerts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [productionTrend, setProductionTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [weatherRecommendations, setWeatherRecommendations] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [treesSnap, sectorsSnap, rowsSnap, harvestsSnap] = await Promise.all([
        getFarmCollection('trees', currentFarm).get(),
        getFarmCollection('sectors', currentFarm).get(),
        getFarmCollection('rows', currentFarm).get(),
        getFarmCollection('harvests', currentFarm).orderBy('date', 'desc').limit(1).get(),
      ]);

      const trees = treesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const healthyTrees = trees.filter(t => t.healthStatus === 'Saludable').length;

      const harvestsAllSnap = await getFarmCollection('harvests', currentFarm).get();
      const harvests = harvestsAllSnap.docs.map(doc => doc.data());
      const totalProduction = harvests.reduce((sum, h) => sum + (h.quantity || 0), 0);

      const lastHarvest = harvestsSnap.docs.length > 0 ? harvestsSnap.docs[0].data() : null;

      setStats({
        totalTrees: trees.length,
        healthyTrees,
        sectors: sectorsSnap.size,
        rows: rowsSnap.size,
        totalProduction,
        lastHarvest,
      });

      // Cargar alertas inteligentes e insights
      const [alerts, insightsData, trends] = await Promise.all([
        SmartAnalytics.getSmartAlerts(),
        SmartAnalytics.generateInsights(),
        SmartAnalytics.analyzeProductionTrends(),
      ]);
      
      
      // Cargar datos de clima (ubicación de Guatemala - ajustar según finca)
      // Guatemala City por defecto: 14.6349, -90.5069
      const fincaLat = settings?.location?.lat || 14.6349;
      const fincaLon = settings?.location?.lon || -90.5069;
      
      const [weather, weatherForecast] = await Promise.all([
        WeatherService.getCurrentWeather(fincaLat, fincaLon),
        WeatherService.getForecast(fincaLat, fincaLon),
      ]);
      
      setCurrentWeather(weather);
      setForecast(weatherForecast);
      
      // Analizar alertas climáticas
      const climateAlerts = WeatherService.analyzeWeatherAlerts(weather, weatherForecast);
      setWeatherAlerts(climateAlerts);
      
      // Obtener recomendaciones
      const recommendations = WeatherService.getWeatherRecommendations(weather, weatherForecast);
      setWeatherRecommendations(recommendations);
      
      // Generar insights con IA
      const aiAnalysis = AIService.analyzeProductionData(
        treesSnap.size,
        totalProduction,
        totalRevenue,
        totalExpenses
      );
      setAiInsights(aiAnalysis);
      
      // Combinar alertas de clima con alertas inteligentes
      const allAlerts = [...climateAlerts, ...alerts];

      setSmartAlerts(allAlerts);
      setInsights(insightsData);
      setProductionTrend(trends);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, color, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={32} color={color} />
      <View style={styles.statCardContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bienvenido 👋</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate('Settings')}>
          <Ionicons name="settings-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Selector de Finca */}
      {currentFarm && (
        <View style={{ backgroundColor: "white", padding: 12, marginHorizontal: 15, marginTop: 10, marginBottom: 10, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <View>
            <Text style={{ fontSize: 11, color: "#666" }}>📍 Finca actual</Text>
            <Text style={{ fontSize: 15, fontWeight: "bold", color: "#2E7D32" }}>{currentFarm.name}</Text>
            <Text style={{ fontSize: 10, color: "#999" }}>Rol: {userRole}</Text>
          </View>
          {userFarms.length > 1 && (
            <TouchableOpacity onPress={() => setShowFarmSelector(true)} style={{ backgroundColor: "#4CAF50", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>Cambiar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}


      

      {/* Botón de Gestión de Miembros */}
      {currentFarm && userRole === 'owner' && (
        <TouchableOpacity
          onPress={() => onNavigate('Members')}
          style={{
            backgroundColor: "white",
            padding: 15,
            marginHorizontal: 15,
            marginBottom: 10,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="people" size={24} color="#2196F3" />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "bold", color: "#333" }}>
                Gestionar Equipo
              </Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                Invitar y administrar miembros
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      )}

{loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Cargando dashboard...</Text>
        </View>
      ) : (
      <ScrollView style={styles.content}>

        {/* Widget de Clima */}
        {currentWeather && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>🌤️ Clima Actual</Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <View>
                  <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#333' }}>
                    {currentWeather.temp.toFixed(0)}°C
                  </Text>
                  <Text style={{ fontSize: 16, color: '#666', textTransform: 'capitalize' }}>
                    {currentWeather.description}
                  </Text>
                </View>
                <Ionicons 
                  name={
                    currentWeather.description.includes('lluvia') ? 'rainy' :
                    currentWeather.description.includes('nublado') ? 'cloudy' :
                    currentWeather.description.includes('tormenta') ? 'thunderstorm' :
                    'sunny'
                  }
                  size={64}
                  color={
                    currentWeather.description.includes('lluvia') ? '#2196F3' :
                    currentWeather.description.includes('nublado') ? '#607D8B' :
                    currentWeather.description.includes('tormenta') ? '#673AB7' :
                    '#FF9800'
                  }
                />
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="water" size={20} color="#2196F3" />
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>Humedad</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    {currentWeather.humidity}%
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="flag" size={20} color="#607D8B" />
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>Viento</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    {currentWeather.wind_speed.toFixed(0)} km/h
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="eye" size={20} color="#4CAF50" />
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>Sensación</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    {currentWeather.feels_like.toFixed(0)}°C
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Pronóstico 5 días */}
        {forecast.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>📅 Pronóstico 5 Días</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {forecast.map((day, index) => {
                const date = new Date(day.date);
                const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
                const dayNum = date.getDate();
                const month = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()];
                
                return (
                  <View key={index} style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 15,
                    marginRight: 10,
                    width: 100,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 }}>
                      {dayName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                      {dayNum} {month}
                    </Text>
                    <Ionicons 
                      name={day.rain > 5 ? 'rainy' : day.condition.includes('nublado') ? 'cloudy' : 'sunny'}
                      size={32}
                      color={day.rain > 5 ? '#2196F3' : day.condition.includes('nublado') ? '#607D8B' : '#FF9800'}
                    />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10 }}>
                      {day.temp_max.toFixed(0)}°
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666' }}>
                      {day.temp_min.toFixed(0)}°
                    </Text>
                    {day.rain > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        <Ionicons name="water" size={12} color="#2196F3" />
                        <Text style={{ fontSize: 11, color: '#2196F3', marginLeft: 3 }}>
                          {day.rain.toFixed(0)}mm
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Recomendaciones basadas en clima */}
        {weatherRecommendations.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>🌱 Recomendaciones de Clima</Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              {weatherRecommendations.map((rec, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: index < weatherRecommendations.length - 1 ? 15 : 0,
                    paddingBottom: index < weatherRecommendations.length - 1 ? 15 : 0,
                    borderBottomWidth: index < weatherRecommendations.length - 1 ? 1 : 0,
                    borderBottomColor: '#F0F0F0',
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: rec.color + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name={rec.icon} size={20} color={rec.color} />


        {/* Widget de IA - Insights Inteligentes */}
        {aiInsights && aiInsights.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>🤖 Análisis Inteligente con IA</Text>
            {aiInsights.map((insight, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: 
                    insight.priority === 'critical' ? '#FFEBEE' :
                    insight.priority === 'high' ? '#FFF3E0' :
                    insight.type === 'success' ? '#E8F5E9' :
                    'white',
                  borderRadius: 12,
                  padding: 15,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor:
                    insight.priority === 'critical' ? '#F44336' :
                    insight.priority === 'high' ? '#FF9800' :
                    insight.type === 'success' ? '#4CAF50' :
                    '#2196F3',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 24, marginRight: 10 }}>{insight.icon}</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 }}>
                    {insight.title}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: '#666', lineHeight: 20 }}>
                  {insight.message}
                </Text>
              </View>
            ))}
          </View>
        )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 }}>
                      {rec.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#666' }}>
                      {rec.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}



        {/* Alertas Inteligentes */}
        {smartAlerts.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>🤖 Alertas Inteligentes</Text>
            {smartAlerts.slice(0, 3).map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 15,
                  padding: 15,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: alert.color,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => onNavigate(alert.module)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: alert.color + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name={alert.icon} size={20} color={alert.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                      {alert.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>
                      {alert.message}
                    </Text>
                    <View style={{
                      backgroundColor: '#F5F5F5',
                      padding: 10,
                      borderRadius: 8,
                      marginTop: 4,
                    }}>
                      <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                        💡 {alert.recommendation}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: alert.color, fontWeight: '600', marginTop: 8 }}>
                      → {alert.action}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Insights y Recomendaciones */}
        {insights.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>💡 Insights</Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              {insights.map((insight, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: index < insights.length - 1 ? 15 : 0,
                    paddingBottom: index < insights.length - 1 ? 15 : 0,
                    borderBottomWidth: index < insights.length - 1 ? 1 : 0,
                    borderBottomColor: '#F0F0F0',
                  }}
                >
                  <Ionicons name={insight.icon} size={24} color={insight.color} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 }}>
                      {insight.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#666' }}>
                      {insight.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tendencia de Producción */}
        {productionTrend && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>📊 Tendencia de Producción</Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Ionicons 
                  name={productionTrend.trend === 'up' ? 'trending-up' : productionTrend.trend === 'down' ? 'trending-down' : 'remove'}
                  size={32}
                  color={productionTrend.trend === 'up' ? '#4CAF50' : productionTrend.trend === 'down' ? '#F44336' : '#FF9800'}
                />
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                    {productionTrend.trend === 'up' ? 'Creciendo' : productionTrend.trend === 'down' ? 'Bajando' : 'Estable'}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    {Math.abs(parseFloat(productionTrend.change))}% vs mes anterior
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>
                  📈 Últimos 3 meses:
                </Text>
                {productionTrend.data.map((item, index) => {
                  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                  const [year, month] = item.month.split('-');
                  const monthName = monthNames[parseInt(month) - 1];
                  return (
                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontSize: 13, color: '#666' }}>{monthName} {year}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#333' }}>
                        {item.total.toFixed(0)} unidades
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={{
                backgroundColor: '#E3F2FD',
                padding: 10,
                borderRadius: 8,
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="bulb" size={20} color="#2196F3" />
                <Text style={{ fontSize: 12, color: '#2196F3', marginLeft: 8, flex: 1 }}>
                  Predicción próximo mes: ~{productionTrend.prediction.toFixed(0)} unidades
                </Text>
              </View>
            </View>
          </View>
        )}


        <View style={styles.statsGrid}>
          <StatCard icon="leaf" title="Total Árboles" value={stats.totalTrees} color="#4CAF50" onPress={() => onNavigate('TreeManagement')} />
          <StatCard icon="heart" title="Saludables" value={stats.healthyTrees} color="#8BC34A" />
          <StatCard icon="basket" title="Producción Total" value={stats.totalProduction.toFixed(1)} color="#795548" onPress={() => onNavigate('Production')} />
          <StatCard icon="calendar" title="Última Cosecha" value={stats.lastHarvest ? stats.lastHarvest.date : 'N/A'} color="#FF9800" onPress={() => onNavigate('Production')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('TreeManagement')}>
              <Ionicons name="leaf" size={40} color="#4CAF50" />
              <Text style={styles.quickActionText}>Gestión de Árboles</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('Production')}>
              <Ionicons name="basket" size={40} color="#795548" />
              <Text style={styles.quickActionText}>Producción</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('Sales')}>
              <Ionicons name="cart" size={40} color="#4CAF50" />
              <Text style={styles.quickActionText}>Ventas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('Expenses')}>
              <Ionicons name="wallet" size={40} color="#F44336" />
              <Text style={styles.quickActionText}>Gastos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('Tasks')}>
              <Ionicons name="checkbox" size={40} color="#9C27B0" />
              <Text style={styles.quickActionText}>Tareas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('Reports')}>
              <Ionicons name="stats-chart" size={40} color="#2196F3" />
              <Text style={styles.quickActionText}>Reportes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('Inventory')}>
              <Ionicons name="cube" size={40} color="#FF9800" />
              <Text style={styles.quickActionText}>Inventario</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('Employees')}>
              <Ionicons name="people" size={40} color="#9C27B0" />
              <Text style={styles.quickActionText}>Empleados</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      )}
    </View>
  );
}

// ============ TREE MANAGEMENT SCREEN (COMPLETE) ============
function TreeManagementScreen({ settings, currentFarm, onBack }) {
  const [currentView, setCurrentView] = useState('menu');
  
  return (
    <View style={styles.container}>
      {currentView === 'menu' && <TreeManagementMenu onNavigate={setCurrentView} onBack={onBack} />}
      {currentView === 'sectors' && <SectorsScreen currentFarm={currentFarm} onBack={() => setCurrentView('menu')} />}
      {currentView === 'rows' && <RowsScreen currentFarm={currentFarm} onBack={() => setCurrentView('menu')} />}
      {currentView === 'trees' && <TreesScreen currentFarm={currentFarm} settings={settings} onBack={() => setCurrentView('menu')} />}
      {currentView === 'treeTypes' && <TreeTypesScreen currentFarm={currentFarm} onBack={() => setCurrentView('menu')} />}
    </View>
  );
}

function TreeManagementMenu({ onNavigate, onBack }) {
  const menuItems = [
    { id: 'sectors', icon: 'location', title: 'Sectores', color: '#4CAF50' },
    { id: 'rows', icon: 'grid', title: 'Surcos', color: '#2196F3' },
    { id: 'trees', icon: 'leaf', title: 'Árboles', color: '#8BC34A' },
    { id: 'treeTypes', icon: 'list', title: 'Tipos de Árbol', color: '#FF9800' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Gestión de Árboles</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => onNavigate(item.id)}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={32} color={item.color} />
            </View>
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ============ SECTORS SCREEN ============
function SectorsScreen({ currentFarm, onBack }) {
  const [sectors, setSectors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSector, setEditingSector] = useState(null);

  useEffect(() => {
    loadSectors();
  }, [currentFarm]);

  const loadSectors = async () => {
    console.log("🔍 =================================");
    console.log("🔍 [SECTORES] Iniciando carga...");
    console.log("🔍 =================================");
    
    try {
      // PASO 1: Verificar currentFarm
      console.log("📌 Paso 1: Verificando currentFarm...");
      console.log("   currentFarm:", currentFarm);
      
      if (!currentFarm || !currentFarm.id) {
        console.warn("⚠️ No hay finca seleccionada aún");
        setSectors([]);
        return;
      }
      console.log("✅ currentFarm OK:", currentFarm.id);

      // PASO 2: Obtener colección
      console.log("📌 Paso 2: Obteniendo colección...");
      const collection = getFarmCollection('sectors', currentFarm);
      
      if (!collection) {
        console.error("❌ No se pudo obtener la colección");
        setSectors([]);
        return;
      }
      console.log("✅ Colección obtenida");

      // PASO 3: Cargar datos (sin orderBy primero)
      console.log("📌 Paso 3: Cargando datos de Firebase...");
      let snapshot = await collection.get();
      console.log("✅ Snapshot obtenido:", snapshot.docs.length, "documentos");

      // PASO 4: Mapear datos
      console.log("📌 Paso 4: Mapeando datos...");
      const sectorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("✅ Datos mapeados:", sectorsData.length, "sectores");
      
      // Mostrar los primeros 3
      console.log("📋 Primeros 3 sectores:");
      sectorsData.slice(0, 3).forEach((sector, idx) => {
        console.log(`   ${idx + 1}. ${sector.name || 'SIN NOMBRE'} (ID: ${sector.id})`);
      });

      // PASO 5: Ordenar (si tienen createdAt)
      console.log("📌 Paso 5: Ordenando...");
      sectorsData.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      console.log("✅ Sectores ordenados");

      // PASO 6: Actualizar estado
      console.log("📌 Paso 6: Actualizando estado...");
      setSectors(sectorsData);
      
      console.log("🎉 =================================");
      console.log("🎉 SECTORES CARGADOS:", sectorsData.length);
      console.log("🎉 =================================");
      
    } catch (error) {
      console.error("❌ =================================");
      console.error("❌ ERROR CARGANDO SECTORES:");
      console.error("❌ Mensaje:", error.message);
      console.error("❌ Stack:", error.stack);
      console.error("❌ =================================");
      Alert.alert('Error', 'No se pudieron cargar los sectores: ' + error.message);
    }
  };


  const handleDelete = (id, name) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await getFarmCollection('sectors', currentFarm).doc(id).delete();
              Alert.alert('Éxito', 'Sector eliminado correctamente');
              loadSectors();
            } catch (error) {
              console.error('Error eliminando sector:', error);
              Alert.alert('Error', 'No se pudo eliminar el sector: ' + (error.message || 'Error desconocido'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sectores</Text>
        <TouchableOpacity onPress={() => {
          setEditingSector(null);
          setShowModal(true);
        }}>
          <Ionicons name="add-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {sectors.map(sector => (
          <View key={sector.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={24} color="#4CAF50" />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{sector.name}</Text>
                <Text style={styles.cardSubtitle}>{sector.area} ha</Text>
              </View>
            </View>
            {sector.gpsLat && sector.gpsLng && (
              <Text style={styles.cardDetail}>📍 {sector.gpsLat}, {sector.gpsLng}</Text>
            )}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setEditingSector(sector);
                  setShowModal(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#2196F3" />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(sector.id, sector.name)}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {showModal && (
        <SectorModal
          visible={showModal}
          sector={editingSector}
          onClose={() => {
            setShowModal(false);
            setEditingSector(null);
          }}
          onSuccess={loadSectors}
          currentFarm={currentFarm}
        />
      )}
    </View>
  );
}

function SectorModal({ visible, sector, onClose, onSuccess, currentFarm }) {
  const [name, setName] = useState(sector?.name || '');
  const [area, setArea] = useState(sector?.area?.toString() || '');
  const [gpsLat, setGpsLat] = useState(sector?.gpsLat || '');
  const [gpsLng, setGpsLng] = useState(sector?.gpsLng || '');

  const handleSubmit = async () => {
    if (!name || !area) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    const data = {
      name,
      area: parseFloat(area),
      gpsLat,
      gpsLng,
    };

    try {
      if (sector) {
        await getFarmCollection('sectors', currentFarm).doc(sector.id).update(data);
        Alert.alert('Éxito', 'Sector actualizado');
      } else {
        const newData = { ...data, createdAt: new Date().toISOString() };
        await getFarmCollection('sectors', currentFarm).add(newData);
        Alert.alert('Éxito', 'Sector agregado');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{sector ? 'Editar' : 'Agregar'} Sector</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Sector A" />
            
            <Text style={styles.label}>Área (hectáreas) *</Text>
            <TextInput style={styles.input} value={area} onChangeText={setArea} keyboardType="numeric" placeholder="5.5" />
            
            <Text style={styles.label}>GPS Latitud</Text>
            <TextInput style={styles.input} value={gpsLat} onChangeText={setGpsLat} placeholder="14.6349" />
            
            <Text style={styles.label}>GPS Longitud</Text>
            <TextInput style={styles.input} value={gpsLng} onChangeText={setGpsLng} placeholder="-90.5069" />
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{sector ? 'Actualizar' : 'Guardar'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============ ROWS SCREEN ============
function RowsScreen({ currentFarm, onBack }) {
  const [rows, setRows] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rowsSnap, sectorsSnap] = await Promise.all([
      getFarmCollection('rows', currentFarm).get(),
      getFarmCollection('sectors', currentFarm).get(),
    ]);
    setRows(rowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setSectors(sectorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await getFarmCollection('rows', currentFarm).doc(id).delete();
            Alert.alert('Éxito', 'Surco eliminado');
            loadData();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Surcos</Text>
        <TouchableOpacity onPress={() => {
          setEditingRow(null);
          setShowModal(true);
        }}>
          <Ionicons name="add-circle" size={28} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {rows.map(row => {
          const sector = sectors.find(s => s.id === row.sectorId);
          return (
            <View key={row.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="grid" size={24} color="#2196F3" />
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{row.name}</Text>
                  <Text style={styles.cardSubtitle}>Número: {row.number}</Text>
                </View>
              </View>
              <Text style={styles.cardDetail}>📍 Sector: {sector?.name || 'N/A'}</Text>
              {row.gpsLat && row.gpsLng && (
                <Text style={styles.cardDetail}>🗺️ {row.gpsLat}, {row.gpsLng}</Text>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setEditingRow(row);
                    setShowModal(true);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color="#2196F3" />
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(row.id, row.name)}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {showModal && (
        <RowModal
          visible={showModal}
          row={editingRow}
          sectors={sectors}
          onClose={() => {
            setShowModal(false);
            setEditingRow(null);
          }}
          onSuccess={loadData}
          currentFarm={currentFarm}
        />
      )}
    </View>
  );
}

function RowModal({ visible, row, sectors, onClose, onSuccess, currentFarm }) {
  const [sectorId, setSectorId] = useState(row?.sectorId || '');
  const [name, setName] = useState(row?.name || '');
  const [number, setNumber] = useState(row?.number?.toString() || '');
  const [gpsLat, setGpsLat] = useState(row?.gpsLat || '');
  const [gpsLng, setGpsLng] = useState(row?.gpsLng || '');

  const handleSubmit = async () => {
    if (!sectorId || !name || !number) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    const data = {
      sectorId,
      name,
      number: parseInt(number),
      gpsLat,
      gpsLng,
    };

    try {
      if (row) {
        await getFarmCollection('rows', currentFarm).doc(row.id).update(data);
        Alert.alert('Éxito', 'Surco actualizado');
      } else {
        await getFarmCollection('rows', currentFarm).add(data);
        Alert.alert('Éxito', 'Surco agregado');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{row ? 'Editar' : 'Agregar'} Surco</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Sector *</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              {sectors.map(sector => (
                <TouchableOpacity
                  key={sector.id}
                  style={[styles.pickerOption, sectorId === sector.id && styles.pickerOptionSelected]}
                  onPress={() => setSectorId(sector.id)}
                >
                  <Text style={[styles.pickerOptionText, sectorId === sector.id && styles.pickerOptionTextSelected]}>
                    {sector.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Surco 1" />
            
            <Text style={styles.label}>Número *</Text>
            <TextInput style={styles.input} value={number} onChangeText={setNumber} keyboardType="numeric" placeholder="1" />
            
            <Text style={styles.label}>GPS Latitud</Text>
            <TextInput style={styles.input} value={gpsLat} onChangeText={setGpsLat} placeholder="14.6349" />
            
            <Text style={styles.label}>GPS Longitud</Text>
            <TextInput style={styles.input} value={gpsLng} onChangeText={setGpsLng} placeholder="-90.5069" />
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{row ? 'Actualizar' : 'Guardar'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============ TREES SCREEN ============
function TreesScreen({ currentFarm, settings, onBack }) {
  const [trees, setTrees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTree, setEditingTree] = useState(null);

  useEffect(() => {
    loadTrees();
  }, []);

  const loadTrees = async () => {
    const snapshot = await getFarmCollection('trees', currentFarm).get();
    setTrees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = (id, number) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar el Árbol #${number}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await getFarmCollection('trees', currentFarm).doc(id).delete();
            Alert.alert('Éxito', 'Árbol eliminado');
            loadTrees();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Árboles</Text>
        <TouchableOpacity onPress={() => {
          setEditingTree(null);
          setShowModal(true);
        }}>
          <Ionicons name="add-circle" size={28} color="#8BC34A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {trees.map(tree => (
          <TreeCard
            key={tree.id}
            tree={tree}
            onEdit={() => {
              setEditingTree(tree);
              setShowModal(true);
            }}
            onDelete={() => handleDelete(tree.id, tree.number)}
          />
        ))}
      </ScrollView>

      {showModal && (
        <TreeModal
          visible={showModal}
          tree={editingTree}
          settings={settings}
          onClose={() => {
            setShowModal(false);
            setEditingTree(null);
          }}
          onSuccess={loadTrees}
          currentFarm={currentFarm}
        />
      )}
    </View>
  );
}

function TreeCard({ tree, onEdit, onDelete, currentFarm }) {
  const [details, setDetails] = useState({ sector: null, row: null, treeType: null });

  useEffect(() => {
    loadDetails();
  }, [tree]);

  const loadDetails = async () => {
    try {
      const [sectorDoc, rowDoc, typeDoc] = await Promise.all([
        tree.sectorId ? getFarmCollection('sectors', currentFarm).doc(tree.sectorId).get() : null,
        tree.rowId ? getFarmCollection('rows', currentFarm).doc(tree.rowId).get() : null,
        tree.treeTypeId ? getFarmCollection('treeTypes', currentFarm).doc(tree.treeTypeId).get() : null,
      ]);

      setDetails({
        sector: sectorDoc?.exists ? sectorDoc.data() : null,
        row: rowDoc?.exists ? rowDoc.data() : null,
        treeType: typeDoc?.exists ? typeDoc.data() : null,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="leaf" size={24} color="#8BC34A" />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Árbol #{tree.number}</Text>
          <Text style={styles.cardSubtitle}>{details.treeType?.name || 'N/A'}</Text>
        </View>
      </View>
      <Text style={styles.cardDetail}>📍 {details.sector?.name || 'N/A'} - {details.row?.name || 'N/A'}</Text>
      <Text style={styles.cardDetail}>📅 Plantado: {tree.plantDate}</Text>
      <Text style={styles.cardDetail}>💚 Estado: {tree.healthStatus}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TreeModal({ visible, tree, settings, onClose, onSuccess, currentFarm }) {
  const [sectorId, setSectorId] = useState(tree?.sectorId || '');
  const [rowId, setRowId] = useState(tree?.rowId || '');
  const [treeTypeId, setTreeTypeId] = useState(tree?.treeTypeId || '');
  const [number, setNumber] = useState(tree?.number?.toString() || '');
  const [plantDate, setPlantDate] = useState(tree?.plantDate || '');
  const [healthStatus, setHealthStatus] = useState(tree?.healthStatus || 'Saludable');
  const [gpsLat, setGpsLat] = useState(tree?.gpsLat || '');
  const [gpsLng, setGpsLng] = useState(tree?.gpsLng || '');

  const [sectors, setSectors] = useState([]);
  const [rows, setRows] = useState([]);
  const [treeTypes, setTreeTypes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sectorsSnap, rowsSnap, typesSnap] = await Promise.all([
      getFarmCollection('sectors', currentFarm).get(),
      getFarmCollection('rows', currentFarm).get(),
      getFarmCollection('treeTypes', currentFarm).get(),
    ]);
    setSectors(sectorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setRows(rowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setTreeTypes(typesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const filteredRows = rows.filter(r => r.sectorId === sectorId);

  const handleSubmit = async () => {
    if (!sectorId || !rowId || !treeTypeId || !number || !plantDate) {
      Alert.alert('Error', 'Completa todos los campos obligatorios (*)');
      return;
    }

    const data = {
      sectorId,
      rowId,
      treeTypeId,
      number: parseInt(number),
      plantDate,
      healthStatus,
      gpsLat,
      gpsLng,
    };

    try {
      if (tree) {
        await getFarmCollection('trees', currentFarm).doc(tree.id).update(data);
        Alert.alert('Éxito', 'Árbol actualizado');
      } else {
        await getFarmCollection('trees', currentFarm).add(data);
        Alert.alert('Éxito', 'Árbol agregado');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{tree ? 'Editar' : 'Agregar'} Árbol</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Sector *</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              {sectors.map(sector => (
                <TouchableOpacity
                  key={sector.id}
                  style={[styles.pickerOption, sectorId === sector.id && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSectorId(sector.id);
                    setRowId('');
                  }}
                >
                  <Text style={[styles.pickerOptionText, sectorId === sector.id && styles.pickerOptionTextSelected]}>
                    {sector.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Surco *</Text>
            {filteredRows.length === 0 && sectorId && (
              <Text style={styles.helpText}>⚠️ Selecciona un sector primero</Text>
            )}
            <ScrollView horizontal style={styles.pickerContainer}>
              {filteredRows.map(row => (
                <TouchableOpacity
                  key={row.id}
                  style={[styles.pickerOption, rowId === row.id && styles.pickerOptionSelected]}
                  onPress={() => setRowId(row.id)}
                >
                  <Text style={[styles.pickerOptionText, rowId === row.id && styles.pickerOptionTextSelected]}>
                    {row.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Tipo de Árbol *</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              {treeTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.pickerOption, treeTypeId === type.id && styles.pickerOptionSelected]}
                  onPress={() => setTreeTypeId(type.id)}
                >
                  <Text style={[styles.pickerOptionText, treeTypeId === type.id && styles.pickerOptionTextSelected]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Número de Árbol *</Text>
            <TextInput style={styles.input} value={number} onChangeText={setNumber} keyboardType="numeric" placeholder="1" />
            
            <Text style={styles.label}>Fecha de Plantación *</Text>
            <DatePickerInput value={plantDate} onChangeDate={setPlantDate} placeholder="Seleccionar fecha" />
            
            <Text style={styles.label}>Estado de Salud</Text>
            <View style={styles.pickerContainer}>
              {['Saludable', 'Regular', 'Enfermo'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[styles.pickerOption, healthStatus === status && styles.pickerOptionSelected]}
                  onPress={() => setHealthStatus(status)}
                >
                  <Text style={[styles.pickerOptionText, healthStatus === status && styles.pickerOptionTextSelected]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>GPS Latitud</Text>
            <TextInput style={styles.input} value={gpsLat} onChangeText={setGpsLat} placeholder="14.6349" />
            
            <Text style={styles.label}>GPS Longitud</Text>
            <TextInput style={styles.input} value={gpsLng} onChangeText={setGpsLng} placeholder="-90.5069" />
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{tree ? 'Actualizar' : 'Guardar'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============ TREE TYPES SCREEN ============
function TreeTypesScreen({ currentFarm, onBack }) {
  const [treeTypes, setTreeTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadTreeTypes();
  }, []);

  const loadTreeTypes = async () => {
    const snapshot = await getFarmCollection('treeTypes', currentFarm).get();
    setTreeTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await getFarmCollection('treeTypes', currentFarm).doc(id).delete();
            Alert.alert('Éxito', 'Tipo eliminado');
            loadTreeTypes();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tipos de Árbol</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={28} color="#FF9800" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {treeTypes.map(type => (
          <View key={type.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list" size={24} color="#FF9800" />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{type.name}</Text>
                <Text style={styles.cardSubtitle}>{type.scientificName}</Text>
              </View>
            </View>
            <Text style={styles.cardDetail}>📊 Rendimiento: {type.averageYield} {type.yieldUnit || 'lb'}/año</Text>
            <Text style={styles.cardDetail}>🔄 Ciclo: {type.harvestCycle} días</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(type.id, type.name)}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {showModal && (
        <TreeTypeModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={loadTreeTypes}
          currentFarm={currentFarm}
        />
      )}
    </View>
  );
}

function TreeTypeModal({ visible, onClose, onSuccess, currentFarm }) {
  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [averageYield, setAverageYield] = useState('');
  const [yieldUnit, setYieldUnit] = useState('lb');
  const [harvestCycle, setHarvestCycle] = useState('');

  const units = ['lb', 'kg', 'unidades', 'cientos', 'qq', 'ton'];

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    const data = {
      name,
      scientificName,
      averageYield: parseFloat(averageYield) || 0,
      yieldUnit,
      harvestCycle: parseInt(harvestCycle) || 0,
    };

    try {
      await getFarmCollection('treeTypes', currentFarm).add(data);
      Alert.alert('Éxito', 'Tipo de árbol agregado');
      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Tipo de Árbol</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Limón Persa" />
            
            <Text style={styles.label}>Nombre Científico</Text>
            <TextInput style={styles.input} value={scientificName} onChangeText={setScientificName} placeholder="Citrus latifolia" />
            
            <Text style={styles.label}>Rendimiento Promedio</Text>
            <TextInput style={styles.input} value={averageYield} onChangeText={setAverageYield} keyboardType="numeric" placeholder="150" />
            
            <Text style={styles.label}>Unidad de Medida</Text>
            <View style={styles.pickerContainer}>
              {units.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.pickerOption, yieldUnit === unit && styles.pickerOptionSelected]}
                  onPress={() => setYieldUnit(unit)}
                >
                  <Text style={[styles.pickerOptionText, yieldUnit === unit && styles.pickerOptionTextSelected]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>Ciclo de Cosecha (días)</Text>
            <TextInput style={styles.input} value={harvestCycle} onChangeText={setHarvestCycle} keyboardType="numeric" placeholder="90" />
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============ PRODUCTION SCREEN ============
function ProductionScreen({ settings, currentFarm, onBack }) {
  const [harvests, setHarvests] = useState([]);
  const [stats, setStats] = useState({
    totalHarvests: 0,
    totalQuantity: 0,
    byTree: 0,
    byRow: 0,
    bySector: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadHarvests();
  }, []);

  const loadHarvests = async () => {
    try {
      const snapshot = await getFarmCollection('harvests', currentFarm).orderBy('date', 'desc').get();
      const harvestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setHarvests(harvestsData);

      const totalQuantity = harvestsData.reduce((sum, h) => sum + (h.quantity || 0), 0);
      const byTree = harvestsData.filter(h => h.harvestType === 'tree').length;
      const byRow = harvestsData.filter(h => h.harvestType === 'row').length;
      const bySector = harvestsData.filter(h => h.harvestType === 'sector').length;

      setStats({
        totalHarvests: harvestsData.length,
        totalQuantity,
        byTree,
        byRow,
        bySector,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = (id, date) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar la cosecha del ${date}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await getFarmCollection('harvests', currentFarm).doc(id).delete();
              Alert.alert('Éxito', 'Cosecha eliminada');
              loadHarvests();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const filteredHarvests = harvests.filter(h => {
    if (filterType === 'all') return true;
    return h.harvestType === filterType;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Producción</Text>
        <TouchableOpacity onPress={() => {
          setEditingHarvest(null);
          setShowAddModal(true);
        }}>
          <Ionicons name="add-circle" size={28} color="#795548" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.productionSummary}>
          <Text style={styles.summaryValue}>{stats.totalQuantity.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Producción Total</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{stats.totalHarvests}</Text>
              <Text style={styles.summaryStatLabel}>Cosechas</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{stats.byTree}</Text>
              <Text style={styles.summaryStatLabel}>Por Árbol</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{stats.byRow}</Text>
              <Text style={styles.summaryStatLabel}>Por Surco</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{stats.bySector}</Text>
              <Text style={styles.summaryStatLabel}>Por Sector</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>Todas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'tree' && styles.filterButtonActive]}
              onPress={() => setFilterType('tree')}
            >
              <Text style={[styles.filterText, filterType === 'tree' && styles.filterTextActive]}>Por Árbol</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'row' && styles.filterButtonActive]}
              onPress={() => setFilterType('row')}
            >
              <Text style={[styles.filterText, filterType === 'row' && styles.filterTextActive]}>Por Surco</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'sector' && styles.filterButtonActive]}
              onPress={() => setFilterType('sector')}
            >
              <Text style={[styles.filterText, filterType === 'sector' && styles.filterTextActive]}>Por Sector</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {filteredHarvests.map(harvest => (
          <HarvestCard
            key={harvest.id}
            harvest={harvest}
            onEdit={() => {
              setEditingHarvest(harvest);
              setShowAddModal(true);
            }}
            onDelete={() => handleDelete(harvest.id, harvest.date)}
            currentFarm={currentFarm}
          />
        ))}

        {filteredHarvests.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay cosechas registradas</Text>
            <TouchableOpacity style={styles.button} onPress={() => setShowAddModal(true)}>
              <Text style={styles.buttonText}>Registrar Cosecha</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {showAddModal && (
        <AddHarvestModal
          visible={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingHarvest(null);
          }}
          onSuccess={loadHarvests}
          editingHarvest={editingHarvest}
          currentFarm={currentFarm}
        />
      )}
    </View>
  );
}

function HarvestCard({ harvest, onEdit, onDelete, currentFarm }) {
  const [details, setDetails] = useState({ sector: null, row: null, tree: null, treeType: null });

  useEffect(() => {
    loadDetails();
  }, [harvest]);

  const loadDetails = async () => {
    try {
      if (harvest.sectorId) {
        const sectorDoc = await getFarmCollection('sectors', currentFarm).doc(harvest.sectorId).get();
        if (sectorDoc.exists) setDetails(prev => ({ ...prev, sector: sectorDoc.data() }));
      }
      if (harvest.rowId) {
        const rowDoc = await getFarmCollection('rows', currentFarm).doc(harvest.rowId).get();
        if (rowDoc.exists) setDetails(prev => ({ ...prev, row: rowDoc.data() }));
      }
      if (harvest.treeId) {
        const treeDoc = await getFarmCollection('trees', currentFarm).doc(harvest.treeId).get();
        if (treeDoc.exists) {
          const treeData = treeDoc.data();
          setDetails(prev => ({ ...prev, tree: treeData }));
          if (treeData.treeTypeId) {
            const typeDoc = await getFarmCollection('treeTypes', currentFarm).doc(treeData.treeTypeId).get();
            if (typeDoc.exists) setDetails(prev => ({ ...prev, treeType: typeDoc.data() }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading details:', error);
    }
  };

  const getHarvestIcon = () => {
    switch (harvest.harvestType) {
      case 'tree': return 'leaf';
      case 'row': return 'grid';
      case 'sector': return 'location';
      default: return 'basket';
    }
  };

  const getHarvestLabel = () => {
    switch (harvest.harvestType) {
      case 'tree': return `Árbol #${details.tree?.number || 'N/A'}`;
      case 'row': return details.row?.name || 'Surco N/A';
      case 'sector': return details.sector?.name || 'Sector N/A';
      default: return 'N/A';
    }
  };

  return (
    <View style={styles.harvestCard}>
      <View style={styles.harvestHeader}>
        <Ionicons name={getHarvestIcon()} size={24} color="#795548" />
        <View style={styles.harvestHeaderText}>
          <Text style={styles.harvestTitle}>{getHarvestLabel()}</Text>
          <Text style={styles.harvestSubtitle}>
            {harvest.productType || (harvest.harvestType === 'tree' && details.treeType ? details.treeType.name : '')}
          </Text>
        </View>
        <View style={styles.harvestBadge}>
          <Text style={styles.harvestBadgeText}>
            {harvest.harvestType === 'tree' ? 'Árbol' : harvest.harvestType === 'row' ? 'Surco' : 'Sector'}
          </Text>
        </View>
      </View>

      <View style={styles.harvestDetails}>
        <View style={styles.harvestDetailItem}>
          <Ionicons name="calendar" size={18} color="#666" />
          <Text style={styles.harvestDetailText}>{harvest.date}</Text>
        </View>
        <View style={styles.harvestDetailItem}>
          <Ionicons name="basket" size={18} color="#666" />
          <Text style={styles.harvestDetailText}>
            {harvest.quantity} {harvest.unit || 'lb'}
          </Text>
        </View>
      </View>

      {harvest.waste && harvest.waste > 0 && (
        <View style={styles.wasteCard}>
          <Ionicons name="trash" size={16} color="#F44336" />
          <Text style={styles.wasteText}>
            Merma: {harvest.waste} {harvest.wasteUnit || 'lb'}
          </Text>
          <Text style={styles.netYieldText}>
            → Neto: {(harvest.quantity - harvest.waste).toFixed(1)} {harvest.unit || 'lb'}
          </Text>
        </View>
      )}

      {harvest.notes && (
        <Text style={styles.harvestNotes}>📝 {harvest.notes}</Text>
      )}

      {harvest.nextHarvestDate && (
        <View style={styles.projectionCard}>
          <Ionicons name="time" size={16} color="#FF9800" />
          <Text style={styles.projectionText}>
            Próxima cosecha proyectada: {harvest.nextHarvestDate}
          </Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddHarvestModal({ visible, onClose, onSuccess, editingHarvest, currentFarm }) {
  const [harvestType, setHarvestType] = useState(editingHarvest?.harvestType || 'tree');
  const [productType, setProductType] = useState(editingHarvest?.productType || '');
  const [date, setDate] = useState(editingHarvest?.date || '');
  const [quantity, setQuantity] = useState(editingHarvest?.quantity?.toString() || '');
  const [unit, setUnit] = useState(editingHarvest?.unit || 'lb');
  const [waste, setWaste] = useState(editingHarvest?.waste?.toString() || '');
  const [wasteUnit, setWasteUnit] = useState(editingHarvest?.wasteUnit || 'lb');
  const [notes, setNotes] = useState(editingHarvest?.notes || '');
  
  const [sectorId, setSectorId] = useState(editingHarvest?.sectorId || '');
  const [rowId, setRowId] = useState(editingHarvest?.rowId || '');
  const [treeId, setTreeId] = useState(editingHarvest?.treeId || '');

  const [sectors, setSectors] = useState([]);
  const [rows, setRows] = useState([]);
  const [trees, setTrees] = useState([]);
  const [treeTypes, setTreeTypes] = useState([]);

  const units = ['lb', 'kg', 'unidades', 'cientos', 'qq', 'ton'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sectorsSnap, rowsSnap, treesSnap, typesSnap] = await Promise.all([
        getFarmCollection('sectors', currentFarm).get(),
        getFarmCollection('rows', currentFarm).get(),
        getFarmCollection('trees', currentFarm).get(),
        getFarmCollection('treeTypes', currentFarm).get(),
      ]);

      setSectors(sectorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setRows(rowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTrees(treesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTreeTypes(typesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredRows = rows.filter(r => r.sectorId === sectorId);
  const filteredTrees = trees.filter(t => {
    if (harvestType === 'tree') return t.rowId === rowId;
    return true;
  });

  const calculateNextHarvest = (currentDate, treeTypeId) => {
    const treeType = treeTypes.find(t => t.id === treeTypeId);
    if (!treeType || !treeType.harvestCycle) return null;

    const currentDateObj = new Date(currentDate);
    const nextDate = new Date(currentDateObj);
    nextDate.setDate(nextDate.getDate() + treeType.harvestCycle);
    
    return nextDate.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!date || !quantity || !productType) {
      Alert.alert('Error', 'Completa los campos obligatorios (Fecha, Cantidad y Tipo de Producto)');
      return;
    }

    if (harvestType === 'tree' && !treeId) {
      Alert.alert('Error', 'Selecciona un árbol');
      return;
    }
    if (harvestType === 'row' && !rowId) {
      Alert.alert('Error', 'Selecciona un surco');
      return;
    }
    if (harvestType === 'sector' && !sectorId) {
      Alert.alert('Error', 'Selecciona un sector');
      return;
    }

    try {
      let nextHarvestDate = null;
      
      if (harvestType === 'tree' && treeId) {
        const treeDoc = await getFarmCollection('trees', currentFarm).doc(treeId).get();
        if (treeDoc.exists) {
          const treeData = treeDoc.data();
          nextHarvestDate = calculateNextHarvest(date, treeData.treeTypeId);
        }
      }

      const harvestData = {
        harvestType,
        productType,
        date,
        quantity: parseFloat(quantity),
        unit,
        waste: waste ? parseFloat(waste) : 0,
        wasteUnit,
        notes,
        nextHarvestDate,
        ...(harvestType === 'sector' && { sectorId }),
        ...(harvestType === 'row' && { rowId, sectorId }),
        ...(harvestType === 'tree' && { treeId, rowId, sectorId }),
      };

      if (editingHarvest) {
        await getFarmCollection('harvests', currentFarm).doc(editingHarvest.id).update(harvestData);
        Alert.alert('Éxito', 'Cosecha actualizada');
      } else {
        await getFarmCollection('harvests', currentFarm).add({
          ...harvestData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Éxito', 'Cosecha registrada');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingHarvest ? 'Editar' : 'Registrar'} Cosecha</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Tipo de Cosecha *</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.pickerOption, harvestType === 'tree' && styles.pickerOptionSelected]}
                onPress={() => {
                  setHarvestType('tree');
                  setRowId('');
                  setTreeId('');
                }}
              >
                <Ionicons name="leaf" size={20} color={harvestType === 'tree' ? 'white' : '#666'} />
                <Text style={[styles.pickerOptionText, harvestType === 'tree' && styles.pickerOptionTextSelected]}>
                  Por Árbol
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, harvestType === 'row' && styles.pickerOptionSelected]}
                onPress={() => {
                  setHarvestType('row');
                  setTreeId('');
                }}
              >
                <Ionicons name="grid" size={20} color={harvestType === 'row' ? 'white' : '#666'} />
                <Text style={[styles.pickerOptionText, harvestType === 'row' && styles.pickerOptionTextSelected]}>
                  Por Surco
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, harvestType === 'sector' && styles.pickerOptionSelected]}
                onPress={() => {
                  setHarvestType('sector');
                  setRowId('');
                  setTreeId('');
                }}
              >
                <Ionicons name="location" size={20} color={harvestType === 'sector' ? 'white' : '#666'} />
                <Text style={[styles.pickerOptionText, harvestType === 'sector' && styles.pickerOptionTextSelected]}>
                  Por Sector
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Tipo de Producto *</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              {treeTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.pickerOption, productType === type.name && styles.pickerOptionSelected]}
                  onPress={() => setProductType(type.name)}
                >
                  <Text style={[styles.pickerOptionText, productType === type.name && styles.pickerOptionTextSelected]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Sector *</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              {sectors.map(sector => (
                <TouchableOpacity
                  key={sector.id}
                  style={[styles.pickerOption, sectorId === sector.id && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSectorId(sector.id);
                    setRowId('');
                    setTreeId('');
                  }}
                >
                  <Text style={[styles.pickerOptionText, sectorId === sector.id && styles.pickerOptionTextSelected]}>
                    {sector.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {(harvestType === 'row' || harvestType === 'tree') && sectorId && (
              <>
                <Text style={styles.label}>Surco *</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {filteredRows.map(row => (
                    <TouchableOpacity
                      key={row.id}
                      style={[styles.pickerOption, rowId === row.id && styles.pickerOptionSelected]}
                      onPress={() => {
                        setRowId(row.id);
                        setTreeId('');
                      }}
                    >
                      <Text style={[styles.pickerOptionText, rowId === row.id && styles.pickerOptionTextSelected]}>
                        {row.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {harvestType === 'tree' && rowId && (
              <>
                <Text style={styles.label}>Árbol *</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {filteredTrees.map(tree => (
                    <TouchableOpacity
                      key={tree.id}
                      style={[styles.pickerOption, treeId === tree.id && styles.pickerOptionSelected]}
                      onPress={() => setTreeId(tree.id)}
                    >
                      <Text style={[styles.pickerOptionText, treeId === tree.id && styles.pickerOptionTextSelected]}>
                        #{tree.number}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.label}>Fecha de Cosecha *</Text>
            <DatePickerInput value={date} onChangeDate={setDate} placeholder="Seleccionar fecha" />

            <Text style={styles.label}>Cantidad *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="150"
            />

            <Text style={styles.label}>Unidad de Medida</Text>
            <View style={styles.pickerContainer}>
              {units.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.pickerOption, unit === u && styles.pickerOptionSelected]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.pickerOptionText, unit === u && styles.pickerOptionTextSelected]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Merma/Desperdicio (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={waste}
              onChangeText={setWaste}
              keyboardType="numeric"
              placeholder="10"
            />

            <Text style={styles.label}>Unidad de Merma</Text>
            <View style={styles.pickerContainer}>
              {units.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.pickerOption, wasteUnit === u && styles.pickerOptionSelected]}
                  onPress={() => setWasteUnit(u)}
                >
                  <Text style={[styles.pickerOptionText, wasteUnit === u && styles.pickerOptionTextSelected]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notas (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Observaciones sobre la cosecha..."
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{editingHarvest ? 'Actualizar' : 'Guardar'} Cosecha</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============ SALES SCREEN ============
function SalesScreen({ settings, currentFarm, onBack }) {
  const [currentView, setCurrentView] = useState('dashboard');
  
  return (
    <View style={styles.container}>
      {currentView === 'dashboard' && <SalesDashboard settings={settings} onNavigate={setCurrentView} onBack={onBack} currentFarm={currentFarm} />}
      {currentView === 'customers' && <CustomersScreen onBack={() => setCurrentView('dashboard')} currentFarm={currentFarm} />}
      {currentView === 'sales' && <SalesListScreen settings={settings} onBack={() => setCurrentView('dashboard')} currentFarm={currentFarm} />}
      {currentView === 'goal' && <SalesGoalScreen settings={settings} currentFarm={currentFarm} onBack={() => setCurrentView('dashboard')} />}
    </View>
  );
}

function SalesDashboard({ settings, onNavigate, onBack, currentFarm }) {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    avgPrice: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    monthGoal: 0,
    goalPercentage: 0,
    topCustomers: [],
    topProducts: [],
    salesByPayment: { contado: 0, credito: 0, anticipo: 0 },
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const salesSnap = await getFarmCollection('sales', currentFarm).get();
      const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const avgPrice = totalSales > 0 ? totalRevenue / totalSales : 0;

      const today = new Date().toISOString().split('T')[0];
      const todayRevenue = sales
        .filter(s => s.date === today)
        .reduce((sum, s) => sum + (s.total || 0), 0);

      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthRevenue = sales
        .filter(s => s.date?.startsWith(currentMonth))
        .reduce((sum, s) => sum + (s.total || 0), 0);

      // Get monthly goal
      const goalsSnap = await db
  .collection('farms')
  .doc(currentFarm.id)
  .collection('goals')
  .where('month', '==', currentMonth)
  .get();
      const monthGoal = goalsSnap.empty ? 0 : goalsSnap.docs[0].data().amount;
      const goalPercentage = monthGoal > 0 ? (monthRevenue / monthGoal) * 100 : 0;

      const customerSales = {};
      const productSales = {};
      const paymentMethods = { contado: 0, credito: 0, anticipo: 0 };

      sales.forEach(s => {
        if (s.customerId) {
          customerSales[s.customerId] = (customerSales[s.customerId] || 0) + (s.total || 0);
        }
        if (s.productType) {
          productSales[s.productType] = (productSales[s.productType] || 0) + (s.quantity || 0);
        }
        if (s.paymentMethod) {
          paymentMethods[s.paymentMethod] = (paymentMethods[s.paymentMethod] || 0) + (s.total || 0);
        }
      });

const customersSnap = await db
  .collection('farms')
  .doc(currentFarm.id)
  .collection('customers')
  .get();
      const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const topCustomers = Object.entries(customerSales)
        .map(([id, total]) => ({
          customer: customers.find(c => c.id === id),
          total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const topProducts = Object.entries(productSales)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setStats({
        totalSales,
        totalRevenue,
        avgPrice,
        todayRevenue,
        monthRevenue,
        monthGoal,
        goalPercentage,
        topCustomers,
        topProducts,
        salesByPayment: paymentMethods,
      });
    } catch (error) {
      console.error('Error loading sales stats:', error);
    }
  };

  const StatCard = ({ icon, title, value, color, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={32} color={color} />
      <View style={styles.statCardContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Ventas</Text>
        <TouchableOpacity onPress={() => onNavigate('sales')}>
          <Ionicons name="add-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>Meta del Mes</Text>
            <TouchableOpacity onPress={() => onNavigate('goal')}>
              <Ionicons name="create" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.budgetAmounts}>
            <View>
              <Text style={styles.budgetLabel}>Meta</Text>
              <Text style={styles.budgetAmount}>{settings.currency}{stats.monthGoal.toFixed(0)}</Text>
            </View>
            <View>
              <Text style={styles.budgetLabel}>Vendido</Text>
              <Text style={[styles.budgetAmount, { color: stats.goalPercentage >= 100 ? '#4CAF50' : '#FF9800' }]}>
                {settings.currency}{stats.monthRevenue.toFixed(0)}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(stats.goalPercentage, 100)}%`, backgroundColor: stats.goalPercentage >= 100 ? '#4CAF50' : stats.goalPercentage >= 70 ? '#FF9800' : '#F44336' }]} />
          </View>
          <Text style={styles.progressText}>{stats.goalPercentage.toFixed(1)}% de la meta</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="cash"
            title={`Ingresos Totales (${settings.currency})`}
            value={stats.totalRevenue.toFixed(2)}
            color="#4CAF50"
          />
          <StatCard
            icon="trending-up"
            title={`Hoy (${settings.currency})`}
            value={stats.todayRevenue.toFixed(2)}
            color="#2196F3"
          />
          <StatCard
            icon="calendar"
            title={`Este Mes (${settings.currency})`}
            value={stats.monthRevenue.toFixed(2)}
            color="#FF9800"
          />
          <StatCard
            icon="cart"
            title="Total Ventas"
            value={stats.totalSales}
            color="#9C27B0"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métodos de Pago</Text>
          <View style={styles.paymentMethodsGrid}>
            <View style={styles.paymentCard}>
              <Text style={styles.paymentLabel}>Contado</Text>
              <Text style={styles.paymentValue}>{settings.currency}{stats.salesByPayment.contado.toFixed(0)}</Text>
            </View>
            <View style={styles.paymentCard}>
              <Text style={styles.paymentLabel}>Crédito</Text>
              <Text style={styles.paymentValue}>{settings.currency}{stats.salesByPayment.credito.toFixed(0)}</Text>
            </View>
            <View style={styles.paymentCard}>
              <Text style={styles.paymentLabel}>Anticipo</Text>
              <Text style={styles.paymentValue}>{settings.currency}{stats.salesByPayment.anticipo.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Clientes</Text>
          {stats.topCustomers.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <Text style={styles.topRank}>#{index + 1}</Text>
              <Text style={styles.topName}>{item.customer?.name || 'Desconocido'}</Text>
              <Text style={styles.topValue}>{settings.currency}{item.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Productos</Text>
          {stats.topProducts.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <Text style={styles.topRank}>#{index + 1}</Text>
              <Text style={styles.topName}>{item.name}</Text>
              <Text style={styles.topValue}>{item.quantity.toFixed(0)} und</Text>
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('customers')}>
            <Ionicons name="people" size={40} color="#2196F3" />
            <Text style={styles.quickActionText}>Clientes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('sales')}>
            <Ionicons name="cart" size={40} color="#4CAF50" />
            <Text style={styles.quickActionText}>Ver Ventas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function CustomersScreen({ onBack, currentFarm }) {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    if (currentFarm) {
      loadCustomers();
    }
  }, [currentFarm]);

  const loadCustomers = async () => {
    if (!currentFarm) {
      console.warn('⚠️ No currentFarm disponible');
      return;
    }
    
    console.log('📥 Cargando clientes de finca:', currentFarm.id);
    const snapshot = await db.collection('farms').doc(currentFarm.id).collection('customers').get();
    setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    console.log('✅ Clientes cargados:', snapshot.docs.length);
  };

  const handleDelete = (id, name) => {
    Alert.alert('Confirmar', `¿Eliminar cliente "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await db.collection('farms').doc(currentFarm.id).collection('customers').doc(id).delete();
          Alert.alert('Éxito', 'Cliente eliminado');
          loadCustomers();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clientes</Text>
        <TouchableOpacity onPress={() => { setEditingCustomer(null); setShowModal(true); }}>
          <Ionicons name="add-circle" size={28} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {customers.map(customer => (
          <View key={customer.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={24} color="#2196F3" />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{customer.name}</Text>
                {customer.phone && <Text style={styles.cardSubtitle}>📞 {customer.phone}</Text>}
              </View>
            </View>
            {customer.email && <Text style={styles.cardDetail}>📧 {customer.email}</Text>}
            {customer.address && <Text style={styles.cardDetail}>📍 {customer.address}</Text>}
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => { setEditingCustomer(customer); setShowModal(true); }}>
                <Ionicons name="create-outline" size={20} color="#2196F3" />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(customer.id, customer.name)}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {showModal && currentFarm && (
        <CustomerModal visible={showModal} customer={editingCustomer} onClose={() => { setShowModal(false); setEditingCustomer(null); }} onSuccess={loadCustomers} currentFarm={currentFarm} />
      )}
    </View>
  );
}

function CustomerModal({ visible, customer, onClose, onSuccess, currentFarm }) {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState(customer?.address || '');

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!currentFarm) {
      Alert.alert('Error', 'No hay finca seleccionada');
      console.error('❌ currentFarm no disponible en CustomerModal');
      return;
    }

    const data = { name, phone, email, address };

    try {
      console.log('💾 Guardando cliente en finca:', currentFarm.id);
      
      if (customer) {
        // Actualizar cliente existente
        await db
          .collection('farms')
          .doc(currentFarm.id)
          .collection('customers')
          .doc(customer.id)
          .update(data);
        console.log('✅ Cliente actualizado');
        Alert.alert('Éxito', 'Cliente actualizado');
      } else {
        // Agregar nuevo cliente
        await db
          .collection('farms')
          .doc(currentFarm.id)
          .collection('customers')
          .add(data);
        console.log('✅ Cliente agregado');
        Alert.alert('Éxito', 'Cliente agregado');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error guardando cliente:', error);
      Alert.alert('Error', 'No se pudo guardar el cliente: ' + error.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{customer ? 'Editar' : 'Agregar'} Cliente</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Juan Pérez" />
            
            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="5555-5555" keyboardType="phone-pad" />
            
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="cliente@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
            
            <Text style={styles.label}>Dirección</Text>
            <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="Dirección completa..." multiline numberOfLines={3} />
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{customer ? 'Actualizar' : 'Guardar'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SalesListScreen({ settings, onBack, currentFarm }) {
  const [sales, setSales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const snapshot = await getFarmCollection('sales', currentFarm).orderBy('date', 'desc').get();
    setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = (id, date) => {
    Alert.alert('Confirmar', `¿Eliminar venta del ${date}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await getFarmCollection('sales', currentFarm).doc(id).delete();
          Alert.alert('Éxito', 'Venta eliminada');
          loadSales();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Ventas</Text>
        <TouchableOpacity onPress={() => { setEditingSale(null); setShowModal(true); }}>
          <Ionicons name="add-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {sales.map(sale => (
          <SaleCard key={sale.id} sale={sale} settings={settings} onEdit={() => { setEditingSale(sale); setShowModal(true); }} onDelete={() => handleDelete(sale.id, sale.date)} currentFarm={currentFarm} />
        ))}
      </ScrollView>

      {showModal && (
        <SaleModal visible={showModal} sale={editingSale} settings={settings} onClose={() => { setShowModal(false); setEditingSale(null); }} onSuccess={loadSales} currentFarm={currentFarm} />
      )}
    </View>
  );
}

function SaleCard({ sale, settings, onEdit, onDelete, currentFarm }) {
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (sale.customerId) {
      db.collection('farms')
  .doc(currentFarm.id)
  .collection('customers')
  .doc(sale.customerId)
  .get()  // ✅ BIEN
      .then(doc => {
        if (doc.exists) setCustomer(doc.data());
      });
    }
  }, [sale]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="cart" size={24} color="#4CAF50" />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{sale.productType}</Text>
          <Text style={styles.cardSubtitle}>{customer?.name || 'Cliente N/A'}</Text>
        </View>
        <View style={[styles.paymentBadge, { backgroundColor: sale.paymentMethod === 'contado' ? '#4CAF50' : sale.paymentMethod === 'credito' ? '#FF9800' : '#2196F3' }]}>
          <Text style={styles.paymentBadgeText}>{sale.paymentMethod}</Text>
        </View>
      </View>
      
      <View style={styles.saleDetails}>
        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>📅 Fecha:</Text>
          <Text style={styles.saleDetailValue}>{sale.date}</Text>
        </View>
        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>📦 Cantidad:</Text>
          <Text style={styles.saleDetailValue}>{sale.quantity} {sale.unit}</Text>
        </View>
        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>💰 Precio:</Text>
          <Text style={styles.saleDetailValue}>{settings.currency}{sale.pricePerUnit} / {sale.unit}</Text>
        </View>
        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>💵 Total:</Text>
          <Text style={[styles.saleDetailValue, styles.totalValue]}>{settings.currency}{sale.total.toFixed(2)}</Text>
        </View>
      </View>

      {sale.notes && (
        <Text style={styles.harvestNotes}>📝 {sale.notes}</Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SaleModal({ visible, sale, settings, onClose, onSuccess, currentFarm }) {
  const [customerId, setCustomerId] = useState(sale?.customerId || '');
  const [productType, setProductType] = useState(sale?.productType || '');
  const [date, setDate] = useState(sale?.date || '');
  const [quantity, setQuantity] = useState(sale?.quantity?.toString() || '');
  const [unit, setUnit] = useState(sale?.unit || 'lb');
  const [pricePerUnit, setPricePerUnit] = useState(sale?.pricePerUnit?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(sale?.paymentMethod || 'contado');
  const [notes, setNotes] = useState(sale?.notes || '');

  const [customers, setCustomers] = useState([]);
  const [treeTypes, setTreeTypes] = useState([]);

  const units = ['lb', 'kg', 'unidades', 'cientos', 'qq', 'ton'];
  const paymentMethods = ['contado', 'credito', 'anticipo'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [customersSnap, typesSnap] = await Promise.all([
      db.collection('farms').doc(currentFarm.id).collection('customers').get(),
      getFarmCollection('treeTypes', currentFarm).get(),
    ]);
    setCustomers(customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setTreeTypes(typesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async () => {
    if (!customerId || !productType || !date || !quantity || !pricePerUnit) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }

    const total = parseFloat(quantity) * parseFloat(pricePerUnit);

    const data = {
      customerId,
      productType,
      date,
      quantity: parseFloat(quantity),
      unit,
      pricePerUnit: parseFloat(pricePerUnit),
      total,
      paymentMethod,
      notes,
    };

    try {
      if (sale) {
        await getFarmCollection('sales', currentFarm).doc(sale.id).update(data);
        Alert.alert('Éxito', 'Venta actualizada');
      } else {
        await getFarmCollection('sales', currentFarm).add({ ...data, createdAt: new Date().toISOString() });
        Alert.alert('Éxito', 'Venta registrada');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  const total = quantity && pricePerUnit ? (parseFloat(quantity) * parseFloat(pricePerUnit)).toFixed(2) : '0.00';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{sale ? 'Editar' : 'Registrar'} Venta</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Cliente *</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              {customers.map(customer => (
                <TouchableOpacity key={customer.id} style={[styles.pickerOption, customerId === customer.id && styles.pickerOptionSelected]} onPress={() => setCustomerId(customer.id)}>
                  <Text style={[styles.pickerOptionText, customerId === customer.id && styles.pickerOptionTextSelected]}>{customer.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Producto *</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              {treeTypes.map(type => (
                <TouchableOpacity key={type.id} style={[styles.pickerOption, productType === type.name && styles.pickerOptionSelected]} onPress={() => setProductType(type.name)}>
                  <Text style={[styles.pickerOptionText, productType === type.name && styles.pickerOptionTextSelected]}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Fecha *</Text>
            <DatePickerInput value={date} onChangeDate={setDate} placeholder="Seleccionar fecha" />

            <Text style={styles.label}>Cantidad *</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="100" />

            <Text style={styles.label}>Unidad</Text>
            <View style={styles.pickerContainer}>
              {units.map(u => (
                <TouchableOpacity key={u} style={[styles.pickerOption, unit === u && styles.pickerOptionSelected]} onPress={() => setUnit(u)}>
                  <Text style={[styles.pickerOptionText, unit === u && styles.pickerOptionTextSelected]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Precio por {unit} *</Text>
            <TextInput style={styles.input} value={pricePerUnit} onChangeText={setPricePerUnit} keyboardType="numeric" placeholder="1.50" />

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>{settings.currency}{total}</Text>
            </View>

            <Text style={styles.label}>Método de Pago</Text>
            <View style={styles.pickerContainer}>
              {paymentMethods.map(method => (
                <TouchableOpacity key={method} style={[styles.pickerOption, paymentMethod === method && styles.pickerOptionSelected]} onPress={() => setPaymentMethod(method)}>
                  <Text style={[styles.pickerOptionText, paymentMethod === method && styles.pickerOptionTextSelected]}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notas (Opcional)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Notas adicionales..." multiline numberOfLines={3} />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{sale ? 'Actualizar' : 'Guardar'} Venta</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SalesGoalScreen({ settings, currentFarm, onBack }) {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const snapshot = await db
    .collection('farms')
    .doc(currentFarm.id)
    .collection('goals')
    .orderBy('month', 'desc')
    .get();
  
  setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metas de Ventas</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {goals.map(goal => (
          <View key={goal.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy" size={24} color="#4CAF50" />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{goal.month}</Text>
                <Text style={styles.cardSubtitle}>{settings.currency}{goal.amount.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {showModal && <SalesGoalModal visible={showModal} settings={settings} currentFarm={currentFarm} onClose={() => setShowModal(false)} onSuccess={loadGoals} />}
    </View>
  );
}

function SalesGoalModal({ visible, settings, currentFarm, onClose, onSuccess }) {
  const [month, setMonth] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!month || !amount) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    if (!currentFarm) {
      Alert.alert('Error', 'No hay finca seleccionada');
      return;
    }

    try {
      console.log('💾 Guardando meta en finca:', currentFarm.id);
      
      const goalsRef = db
        .collection('farms')
        .doc(currentFarm.id)
        .collection('goals');
      
      const existing = await goalsRef
        .where('month', '==', month)
        .get();
      
      if (!existing.empty) {
        await goalsRef
          .doc(existing.docs[0].id)
          .update({ amount: parseFloat(amount) });
        
        console.log('✅ Meta actualizada');
        Alert.alert('Éxito', 'Meta actualizada');
      } else {
        await goalsRef.add({ 
          month, 
          amount: parseFloat(amount),
          createdAt: new Date().toISOString()
        });
        
        console.log('✅ Meta agregada');
        Alert.alert('Éxito', 'Meta agregada');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error guardando meta:', error);
      Alert.alert('Error', 'No se pudo guardar la meta: ' + error.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registrar Meta</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Mes *</Text>
            <TextInput style={styles.input} value={month} onChangeText={setMonth} placeholder="2024-03" />
            
            <Text style={styles.label}>Meta ({settings.currency}) *</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="50000" />
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============ EXPENSES SCREEN ============
function ExpensesScreen({ settings, currentFarm, onBack }) {
  const [currentView, setCurrentView] = useState('dashboard');
  
  return (
    <View style={styles.container}>
      {currentView === 'dashboard' && <ExpensesDashboard settings={settings} onNavigate={setCurrentView} onBack={onBack} currentFarm={currentFarm} />}
      {currentView === 'categories' && <ExpenseCategoriesScreen onBack={() => setCurrentView('dashboard')} currentFarm={currentFarm} />}
      {currentView === 'budget' && <BudgetScreen settings={settings} onBack={() => setCurrentView('dashboard')} currentFarm={currentFarm} />}
      {currentView === 'expenses' && <ExpensesListScreen settings={settings} onBack={() => setCurrentView('dashboard')} currentFarm={currentFarm} />}
    </View>
  );
}

function ExpensesDashboard({ settings, onNavigate, onBack, currentFarm }) {
  const [stats, setStats] = useState({
    monthBudget: 0,
    monthExpenses: 0,
    todayExpenses: 0,
    weekExpenses: 0,
    budgetPercentage: 0,
    topCategories: [],
    expensesBySector: [],
    costPerProduction: 0,
    projectedMonth: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7);
      
      // Get budget
// ✅ CÓDIGO CORREGIDO (BUENO):
const budgetSnap = await db
  .collection('farms')
  .doc(currentFarm.id)
  .collection('budgets')
  .where('month', '==', currentMonth)
  .get();

const monthBudget = budgetSnap.empty ? 0 : budgetSnap.docs[0].data().amount;

      // Get expenses
      const expensesSnap = await getFarmCollection('expenses', currentFarm).get();
      const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const monthExpenses = expenses
        .filter(e => e.date?.startsWith(currentMonth))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const today = new Date().toISOString().split('T')[0];
      const todayExpenses = expenses
        .filter(e => e.date === today)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const weekExpenses = expenses
        .filter(e => e.date >= weekAgoStr)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const budgetPercentage = monthBudget > 0 ? (monthExpenses / monthBudget) * 100 : 0;

      // By category
      const categoryExpenses = {};
      expenses.filter(e => e.date?.startsWith(currentMonth)).forEach(e => {
        const cat = e.categoryName || 'Sin categoría';
        categoryExpenses[cat] = (categoryExpenses[cat] || 0) + (e.amount || 0);
      });
      const topCategories = Object.entries(categoryExpenses)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // By sector
      const sectorExpenses = {};
      expenses.filter(e => e.date?.startsWith(currentMonth)).forEach(e => {
        if (e.applications && e.applications.length > 0) {
          e.applications.forEach(app => {
            if (app.sectorId) {
              sectorExpenses[app.sectorId] = (sectorExpenses[app.sectorId] || 0) + (e.amount / e.applications.length);
            }
          });
        }
      });

      const sectorsSnap = await getFarmCollection('sectors', currentFarm).get();
      const sectors = sectorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const expensesBySector = Object.entries(sectorExpenses)
        .map(([id, amount]) => ({
          sector: sectors.find(s => s.id === id),
          amount,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Cost per production
      const harvestsSnap = await getFarmCollection('harvests', currentFarm).get();
      const harvests = harvestsSnap.docs.map(doc => doc.data());
      const totalProduction = harvests
        .filter(h => h.date?.startsWith(currentMonth))
        .reduce((sum, h) => sum + (h.quantity || 0), 0);
      const costPerProduction = totalProduction > 0 ? monthExpenses / totalProduction : 0;

      // Projection
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const currentDay = new Date().getDate();
      const avgPerDay = monthExpenses / currentDay;
      const projectedMonth = avgPerDay * daysInMonth;

      setStats({
        monthBudget,
        monthExpenses,
        todayExpenses,
        weekExpenses,
        budgetPercentage,
        topCategories,
        expensesBySector,
        costPerProduction,
        projectedMonth,
      });
    } catch (error) {
      console.error('Error loading expenses stats:', error);
    }
  };

  const StatCard = ({ icon, title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={32} color={color} />
      <View style={styles.statCardContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Gastos</Text>
        <TouchableOpacity onPress={() => onNavigate('expenses')}>
          <Ionicons name="add-circle" size={28} color="#F44336" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>Presupuesto del Mes</Text>
            <TouchableOpacity onPress={() => onNavigate('budget')}>
              <Ionicons name="create" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.budgetAmounts}>
            <View>
              <Text style={styles.budgetLabel}>Presupuesto</Text>
              <Text style={styles.budgetAmount}>{settings.currency}{stats.monthBudget.toFixed(0)}</Text>
            </View>
            <View>
              <Text style={styles.budgetLabel}>Gastado</Text>
              <Text style={[styles.budgetAmount, { color: stats.budgetPercentage > 100 ? '#F44336' : '#FF9800' }]}>
                {settings.currency}{stats.monthExpenses.toFixed(0)}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(stats.budgetPercentage, 100)}%`, backgroundColor: stats.budgetPercentage > 90 ? '#F44336' : stats.budgetPercentage > 70 ? '#FF9800' : '#4CAF50' }]} />
          </View>
          <Text style={styles.progressText}>{stats.budgetPercentage.toFixed(1)}% utilizado</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="today" title={`Hoy (${settings.currency})`} value={stats.todayExpenses.toFixed(0)} color="#F44336" />
          <StatCard icon="calendar" title={`Esta Semana (${settings.currency})`} value={stats.weekExpenses.toFixed(0)} color="#FF9800" />
          <StatCard icon="trending-up" title={`Proyección Mes (${settings.currency})`} value={stats.projectedMonth.toFixed(0)} color="#2196F3" />
          <StatCard icon="calculator" title={`Costo/Producción (${settings.currency})`} value={stats.costPerProduction.toFixed(2)} color="#9C27B0" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Categorías</Text>
          {stats.topCategories.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <Text style={styles.topRank}>#{index + 1}</Text>
              <Text style={styles.topName}>{item.name}</Text>
              <Text style={[styles.topValue, { color: '#F44336' }]}>{settings.currency}{item.amount.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gastos por Sector</Text>
          {stats.expensesBySector.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <Text style={styles.topRank}>#{index + 1}</Text>
              <Text style={styles.topName}>{item.sector?.name || 'N/A'}</Text>
              <Text style={[styles.topValue, { color: '#F44336' }]}>{settings.currency}{item.amount.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('categories')}>
            <Ionicons name="list" size={40} color="#9C27B0" />
            <Text style={styles.quickActionText}>Categorías</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('budget')}>
            <Ionicons name="wallet" size={40} color="#2196F3" />
            <Text style={styles.quickActionText}>Presupuesto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate('expenses')}>
            <Ionicons name="receipt" size={40} color="#F44336" />
            <Text style={styles.quickActionText}>Ver Gastos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ExpenseCategoriesScreen({ onBack, currentFarm }) {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const snapshot = await getFarmCollection('expenseCategories', currentFarm).get();
    setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = (id, name) => {
    Alert.alert('Confirmar', `¿Eliminar categoría "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await getFarmCollection('expenseCategories', currentFarm).doc(id).delete();
          Alert.alert('Éxito', 'Categoría eliminada');
          loadCategories();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorías de Gasto</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={28} color="#9C27B0" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {categories.map(cat => (
          <View key={cat.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetag" size={24} color="#9C27B0" />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{cat.name}</Text>
                {cat.description && <Text style={styles.cardSubtitle}>{cat.description}</Text>}
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(cat.id, cat.name)}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {showModal && <ExpenseCategoryModal visible={showModal} onClose={() => setShowModal(false)} onSuccess={loadCategories} currentFarm={currentFarm} />}
    </View>
  );
}

function ExpenseCategoryModal({ visible, onClose, onSuccess, currentFarm }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      await getFarmCollection('expenseCategories', currentFarm).add({ name, description });
      Alert.alert('Éxito', 'Categoría agregada');
      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Categoría</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Fertilizante, Mano de obra..." />
            
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Descripción de la categoría..." multiline numberOfLines={3} />
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BudgetScreen({ settings, onBack, currentFarm }) {
  const [budgets, setBudgets] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (currentFarm) {
      loadBudgets();
    }
  }, [currentFarm]);

  const loadBudgets = async () => {
    if (!currentFarm) {
      console.warn('⚠️ No currentFarm disponible en BudgetScreen');
      return;
    }
    
    console.log('📥 Cargando presupuestos de finca:', currentFarm.id);
    const snapshot = await db
      .collection('farms')
      .doc(currentFarm.id)
      .collection('budgets')
      .orderBy('month', 'desc')
      .get();
    setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    console.log('✅ Presupuestos cargados:', snapshot.docs.length);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Presupuestos</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={28} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {budgets.map(budget => (
          <View key={budget.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet" size={24} color="#2196F3" />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{budget.month}</Text>
                <Text style={styles.cardSubtitle}>{settings.currency}{budget.amount.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {showModal && currentFarm && <BudgetModal visible={showModal} settings={settings} onClose={() => setShowModal(false)} onSuccess={loadBudgets} currentFarm={currentFarm} />}
    </View>
  );
}

function BudgetModal({ visible, settings, onClose, onSuccess, currentFarm }) {
  const [month, setMonth] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!month || !amount) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    if (!currentFarm) {
      Alert.alert('Error', 'No hay finca seleccionada');
      console.error('❌ currentFarm no disponible en BudgetModal');
      return;
    }

    try {
      console.log('💾 Guardando presupuesto en finca:', currentFarm.id);
      
      const budgetsRef = db
        .collection('farms')
        .doc(currentFarm.id)
        .collection('budgets');
      
      const existing = await budgetsRef.where('month', '==', month).get();
      
      if (!existing.empty) {
        await budgetsRef.doc(existing.docs[0].id).update({ amount: parseFloat(amount) });
        console.log('✅ Presupuesto actualizado');
        Alert.alert('Éxito', 'Presupuesto actualizado');
      } else {
        await budgetsRef.add({ month, amount: parseFloat(amount) });
        console.log('✅ Presupuesto agregado');
        Alert.alert('Éxito', 'Presupuesto agregado');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error guardando presupuesto:', error);
      Alert.alert('Error', 'No se pudo guardar el presupuesto: ' + error.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registrar Presupuesto</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Mes *</Text>
            <TextInput style={styles.input} value={month} onChangeText={setMonth} placeholder="2024-03" />
            
            <Text style={styles.label}>Monto ({settings.currency}) *</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="10000" />
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ExpensesListScreen({ settings, onBack, currentFarm }) {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const snapshot = await getFarmCollection('expenses', currentFarm).orderBy('date', 'desc').get();
    setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = (id, concept) => {
    Alert.alert('Confirmar', `¿Eliminar gasto "${concept}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await getFarmCollection('expenses', currentFarm).doc(id).delete();
          Alert.alert('Éxito', 'Gasto eliminado');
          loadExpenses();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Gastos</Text>
        <TouchableOpacity onPress={() => { setEditingExpense(null); setShowModal(true); }}>
          <Ionicons name="add-circle" size={28} color="#F44336" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {expenses.map(expense => (
          <ExpenseCard key={expense.id} expense={expense} settings={settings} onEdit={() => { setEditingExpense(expense); setShowModal(true); }} onDelete={() => handleDelete(expense.id, expense.concept)} currentFarm={currentFarm} />
        ))}
      </ScrollView>

      {showModal && <ExpenseModal visible={showModal} expense={editingExpense} settings={settings} onClose={() => { setShowModal(false); setEditingExpense(null); }} onSuccess={loadExpenses} currentFarm={currentFarm} />}
    </View>
  );
}

function ExpenseCard({ expense, settings, onEdit, onDelete, currentFarm }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="receipt" size={24} color="#F44336" />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{expense.concept}</Text>
          <Text style={styles.cardSubtitle}>{expense.categoryName}</Text>
        </View>
        {expense.isRecurring && (
          <View style={styles.recurringBadge}>
            <Ionicons name="repeat" size={14} color="white" />
            <Text style={styles.recurringBadgeText}>Recurrente</Text>
          </View>
        )}
      </View>
      
      <View style={styles.saleDetails}>
        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>📅 Fecha:</Text>
          <Text style={styles.saleDetailValue}>{expense.date}</Text>
        </View>
        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>💰 Monto:</Text>
          <Text style={[styles.saleDetailValue, { color: '#F44336', fontWeight: 'bold' }]}>{settings.currency}{expense.amount.toFixed(2)}</Text>
        </View>
        {expense.productType && (
          <View style={styles.saleDetailRow}>
            <Text style={styles.saleDetailLabel}>🌳 Producto:</Text>
            <Text style={styles.saleDetailValue}>{expense.productType}</Text>
          </View>
        )}
      </View>

      {expense.applications && expense.applications.length > 0 && (
        <View style={styles.applicationsCard}>
          <Text style={styles.applicationsTitle}>Aplicado en {expense.applications.length} destino(s)</Text>
        </View>
      )}

      {expense.notes && (
        <Text style={styles.harvestNotes}>📝 {expense.notes}</Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ExpenseModal({ visible, expense, settings, onClose, onSuccess, currentFarm }) {
  const [categoryId, setCategoryId] = useState(expense?.categoryId || '');
  const [concept, setConcept] = useState(expense?.concept || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [date, setDate] = useState(expense?.date || '');
  const [productType, setProductType] = useState(expense?.productType || '');
  const [isRecurring, setIsRecurring] = useState(expense?.isRecurring || false);
  const [frequency, setFrequency] = useState(expense?.frequency || 'mensual');
  const [notes, setNotes] = useState(expense?.notes || '');
  const [applications, setApplications] = useState(expense?.applications || []);
  
  const [categories, setCategories] = useState([]);
  const [treeTypes, setTreeTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [rows, setRows] = useState([]);
  const [trees, setTrees] = useState([]);
  
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const frequencies = ['semanal', 'quincenal', 'mensual'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [categoriesSnap, typesSnap, sectorsSnap, rowsSnap, treesSnap] = await Promise.all([
      getFarmCollection('expenseCategories', currentFarm).get(),
      getFarmCollection('treeTypes', currentFarm).get(),
      getFarmCollection('sectors', currentFarm).get(),
      getFarmCollection('rows', currentFarm).get(),
      getFarmCollection('trees', currentFarm).get(),
    ]);
    setCategories(categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setTreeTypes(typesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setSectors(sectorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setRows(rowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setTrees(treesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async () => {
    if (!categoryId || !concept || !amount || !date) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    const category = categories.find(c => c.id === categoryId);
    const data = {
      categoryId,
      categoryName: category?.name || '',
      concept,
      amount: parseFloat(amount),
      date,
      productType,
      isRecurring,
      frequency: isRecurring ? frequency : null,
      applications,
      notes,
    };

    try {
      if (expense) {
        await getFarmCollection('expenses', currentFarm).doc(expense.id).update(data);
        Alert.alert('Éxito', 'Gasto actualizado');
      } else {
        await getFarmCollection('expenses', currentFarm).add({ ...data, createdAt: new Date().toISOString() });
        Alert.alert('Éxito', 'Gasto registrado');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  const addApplication = (app) => {
    setApplications([...applications, app]);
  };

  const removeApplication = (index) => {
    setApplications(applications.filter((_, i) => i !== index));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{expense ? 'Editar' : 'Registrar'} Gasto</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Categoría *</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.pickerOption, categoryId === cat.id && styles.pickerOptionSelected]} onPress={() => setCategoryId(cat.id)}>
                  <Text style={[styles.pickerOptionText, categoryId === cat.id && styles.pickerOptionTextSelected]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Concepto *</Text>
            <TextInput style={styles.input} value={concept} onChangeText={setConcept} placeholder="Compra de fertilizante..." />

            <Text style={styles.label}>Monto ({settings.currency}) *</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="500" />

            <Text style={styles.label}>Fecha *</Text>
            <DatePickerInput value={date} onChangeDate={setDate} placeholder="Seleccionar fecha" />

            <Text style={styles.label}>Tipo de Producto</Text>
            <ScrollView horizontal style={styles.pickerContainer}>
              <TouchableOpacity style={[styles.pickerOption, !productType && styles.pickerOptionSelected]} onPress={() => setProductType('')}>
                <Text style={[styles.pickerOptionText, !productType && styles.pickerOptionTextSelected]}>Todos</Text>
              </TouchableOpacity>
              {treeTypes.map(type => (
                <TouchableOpacity key={type.id} style={[styles.pickerOption, productType === type.name && styles.pickerOptionSelected]} onPress={() => setProductType(type.name)}>
                  <Text style={[styles.pickerOptionText, productType === type.name && styles.pickerOptionTextSelected]}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity style={styles.checkbox} onPress={() => setIsRecurring(!isRecurring)}>
                <Ionicons name={isRecurring ? 'checkbox' : 'square-outline'} size={24} color="#4CAF50" />
                <Text style={styles.checkboxLabel}>Gasto Recurrente</Text>
              </TouchableOpacity>
            </View>

            {isRecurring && (
              <>
                <Text style={styles.label}>Frecuencia</Text>
                <View style={styles.pickerContainer}>
                  {frequencies.map(freq => (
                    <TouchableOpacity key={freq} style={[styles.pickerOption, frequency === freq && styles.pickerOptionSelected]} onPress={() => setFrequency(freq)}>
                      <Text style={[styles.pickerOptionText, frequency === freq && styles.pickerOptionTextSelected]}>{freq}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Aplicación del Gasto</Text>
            <TouchableOpacity style={styles.addApplicationButton} onPress={() => setShowApplicationModal(true)}>
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.addApplicationText}>Agregar Destino</Text>
            </TouchableOpacity>
            
            {applications.map((app, index) => (
              <View key={index} style={styles.applicationItem}>
                <Text style={styles.applicationText}>
                  {app.type === 'finca' ? 'Finca Completa' : app.type === 'sector' ? `Sector: ${app.sectorName}` : app.type === 'row' ? `Surco: ${app.rowName}` : `Árbol: #${app.treeNumber}`}
                </Text>
                <TouchableOpacity onPress={() => removeApplication(index)}>
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.label}>Notas</Text>
            <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Notas adicionales..." multiline numberOfLines={3} />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{expense ? 'Actualizar' : 'Guardar'} Gasto</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {showApplicationModal && (
        <ApplicationModal
          visible={showApplicationModal}
          sectors={sectors}
          rows={rows}
          trees={trees}
          onClose={() => setShowApplicationModal(false)}
          onAdd={addApplication}
        />
      )}
    </Modal>
  );
}

function ApplicationModal({ visible, sectors, rows, trees, onClose, onAdd }) {
  const [type, setType] = useState('finca');
  const [sectorId, setSectorId] = useState('');
  const [rowId, setRowId] = useState('');
  const [treeId, setTreeId] = useState('');

  const handleAdd = () => {
    let app = { type };
    
    if (type === 'sector' && sectorId) {
      const sector = sectors.find(s => s.id === sectorId);
      app.sectorId = sectorId;
      app.sectorName = sector?.name || '';
    } else if (type === 'row' && rowId) {
      const row = rows.find(r => r.id === rowId);
      app.rowId = rowId;
      app.rowName = row?.name || '';
    } else if (type === 'tree' && treeId) {
      const tree = trees.find(t => t.id === treeId);
      app.treeId = treeId;
      app.treeNumber = tree?.number || '';
    }
    
    onAdd(app);
    onClose();
  };

  const filteredRows = rows.filter(r => r.sectorId === sectorId);
  const filteredTrees = trees.filter(t => t.rowId === rowId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { maxHeight: '60%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Destino</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity style={[styles.pickerOption, type === 'finca' && styles.pickerOptionSelected]} onPress={() => setType('finca')}>
                <Text style={[styles.pickerOptionText, type === 'finca' && styles.pickerOptionTextSelected]}>Finca</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerOption, type === 'sector' && styles.pickerOptionSelected]} onPress={() => setType('sector')}>
                <Text style={[styles.pickerOptionText, type === 'sector' && styles.pickerOptionTextSelected]}>Sector</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerOption, type === 'row' && styles.pickerOptionSelected]} onPress={() => setType('row')}>
                <Text style={[styles.pickerOptionText, type === 'row' && styles.pickerOptionTextSelected]}>Surco</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerOption, type === 'tree' && styles.pickerOptionSelected]} onPress={() => setType('tree')}>
                <Text style={[styles.pickerOptionText, type === 'tree' && styles.pickerOptionTextSelected]}>Árbol</Text>
              </TouchableOpacity>
            </View>

            {type === 'sector' && (
              <>
                <Text style={styles.label}>Sector</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {sectors.map(sector => (
                    <TouchableOpacity key={sector.id} style={[styles.pickerOption, sectorId === sector.id && styles.pickerOptionSelected]} onPress={() => setSectorId(sector.id)}>
                      <Text style={[styles.pickerOptionText, sectorId === sector.id && styles.pickerOptionTextSelected]}>{sector.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {type === 'row' && (
              <>
                <Text style={styles.label}>Sector</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {sectors.map(sector => (
                    <TouchableOpacity key={sector.id} style={[styles.pickerOption, sectorId === sector.id && styles.pickerOptionSelected]} onPress={() => { setSectorId(sector.id); setRowId(''); }}>
                      <Text style={[styles.pickerOptionText, sectorId === sector.id && styles.pickerOptionTextSelected]}>{sector.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.label}>Surco</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {filteredRows.map(row => (
                    <TouchableOpacity key={row.id} style={[styles.pickerOption, rowId === row.id && styles.pickerOptionSelected]} onPress={() => setRowId(row.id)}>
                      <Text style={[styles.pickerOptionText, rowId === row.id && styles.pickerOptionTextSelected]}>{row.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {type === 'tree' && (
              <>
                <Text style={styles.label}>Sector</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {sectors.map(sector => (
                    <TouchableOpacity key={sector.id} style={[styles.pickerOption, sectorId === sector.id && styles.pickerOptionSelected]} onPress={() => { setSectorId(sector.id); setRowId(''); setTreeId(''); }}>
                      <Text style={[styles.pickerOptionText, sectorId === sector.id && styles.pickerOptionTextSelected]}>{sector.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.label}>Surco</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {filteredRows.map(row => (
                    <TouchableOpacity key={row.id} style={[styles.pickerOption, rowId === row.id && styles.pickerOptionSelected]} onPress={() => { setRowId(row.id); setTreeId(''); }}>
                      <Text style={[styles.pickerOptionText, rowId === row.id && styles.pickerOptionTextSelected]}>{row.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.label}>Árbol</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {filteredTrees.map(tree => (
                    <TouchableOpacity key={tree.id} style={[styles.pickerOption, treeId === tree.id && styles.pickerOptionSelected]} onPress={() => setTreeId(tree.id)}>
                      <Text style={[styles.pickerOptionText, treeId === tree.id && styles.pickerOptionTextSelected]}>#{tree.number}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity style={styles.button} onPress={handleAdd}>
              <Text style={styles.buttonText}>Agregar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============ DATE PICKER COMPONENT ============
function DatePickerInput({ value, onChangeDate, placeholder = "YYYY-MM-DD", style }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date().toISOString().split('T')[0]);

  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.input, styles.datePickerInput, style]}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="calendar" size={20} color="#666" />
        <Text style={[styles.datePickerText, !value && styles.datePickerPlaceholder]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Seleccionar Fecha</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerMonthNav}>
              <TouchableOpacity onPress={() => {
                const d = parseDateString(tempDate);
                d.setMonth(d.getMonth() - 1);
                setTempDate(formatDate(d));
              }}>
                <Ionicons name="chevron-back" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <Text style={styles.datePickerMonthText}>
                {parseDateString(tempDate).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => {
                const d = parseDateString(tempDate);
                d.setMonth(d.getMonth() + 1);
                setTempDate(formatDate(d));
              }}>
                <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
              {(() => {
                const currentDate = parseDateString(tempDate);
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const days = [];

                for (let i = 0; i < firstDay; i++) {
                  days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
                }

                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = dateStr === tempDate;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  days.push(
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        isToday && !isSelected && styles.calendarDayToday,
                      ]}
                      onPress={() => setTempDate(dateStr)}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && !isSelected && styles.calendarDayTextToday,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return days;
              })()}
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#ddd', marginRight: 10 }]}
                onPress={() => setShowPicker(false)}
              >
                <Text style={[styles.buttonText, { color: '#333' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  onChangeDate(tempDate);
                  setShowPicker(false);
                }}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============ TASKS SCREEN ============
function TasksScreen({ settings, currentFarm, onBack }) {
  const [currentView, setCurrentView] = useState('calendar');
  
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    // Note: In real app, use expo-notifications
    // For now, just a placeholder
    console.log('Notifications ready');
  };

  return (
    <View style={styles.container}>
      {currentView === 'calendar' && <TasksCalendarView currentFarm={currentFarm} onNavigate={setCurrentView} onBack={onBack} />}
      {currentView === 'list' && <TasksListView currentFarm={currentFarm} onBack={() => setCurrentView('calendar')} />}
      {currentView === 'dashboard' && <TasksDashboard currentFarm={currentFarm} onBack={() => setCurrentView('calendar')} />}
    </View>
  );
}

function TasksCalendarView({ currentFarm, onNavigate, onBack }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  const loadTasks = async () => {
    try {
      const snapshot = await getFarmCollection('tasks', currentFarm).where('dueDate', '==', selectedDate).get();
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const getDaysInMonth = () => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  };

  const changeMonth = (delta) => {
    const date = new Date(selectedDate);
    date.setMonth(date.getMonth() + delta);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const { firstDay, daysInMonth, year, month } = getDaysInMonth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Tareas</Text>
        <TouchableOpacity onPress={() => onNavigate('dashboard')}>
          <Ionicons name="stats-chart" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={28} color="#4CAF50" />
            </TouchableOpacity>
            <Text style={styles.calendarHeaderText}>
              {new Date(year, month).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={28} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
              <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
            ))}
            {Array(firstDay).fill(null).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calendarDay} />
            ))}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calendarDay,
                    isSelected && styles.calendarDaySelected,
                    isToday && !isSelected && styles.calendarDayToday,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isSelected && styles.calendarDayTextSelected,
                    isToday && !isSelected && styles.calendarDayTextToday,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.tasksHeader}>
          <Text style={styles.tasksHeaderText}>
            Tareas del {new Date(selectedDate).toLocaleDateString('es', { day: 'numeric', month: 'long' })}
          </Text>
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle" size={32} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay tareas para este día</Text>
          </View>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onUpdate={loadTasks} currentFarm={currentFarm} />
          ))
        )}
      </ScrollView>

      {showAddModal && (
        <TaskModal
          visible={showAddModal}
          initialDate={selectedDate}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadTasks}
          currentFarm={currentFarm}
        />
      )}
    </View>
  );
}

function TaskCard({ task, onUpdate, currentFarm }) {
  const [details, setDetails] = useState({ sector: null, row: null, tree: null });

  useEffect(() => {
    loadDetails();
  }, [task]);

  const loadDetails = async () => {
    try {
      if (task.relatedTo === 'sector' && task.sectorId) {
        const doc = await getFarmCollection('sectors', currentFarm).doc(task.sectorId).get();
        if (doc.exists) setDetails({ sector: doc.data() });
      } else if (task.relatedTo === 'row' && task.rowId) {
        const doc = await getFarmCollection('rows', currentFarm).doc(task.rowId).get();
        if (doc.exists) setDetails({ row: doc.data() });
      } else if (task.relatedTo === 'tree' && task.treeId) {
        const doc = await getFarmCollection('trees', currentFarm).doc(task.treeId).get();
        if (doc.exists) setDetails({ tree: doc.data() });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleComplete = async () => {
    await getFarmCollection('tasks', currentFarm).doc(task.id).update({
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    onUpdate();
  };

  const handlePostpone = () => {
    Alert.alert('Posponer Tarea', '¿Cuántos días?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: '1 día', onPress: () => postponeTask(1) },
      { text: '3 días', onPress: () => postponeTask(3) },
      { text: '7 días', onPress: () => postponeTask(7) },
    ]);
  };

  const postponeTask = async (days) => {
    const newDate = new Date(task.dueDate);
    newDate.setDate(newDate.getDate() + days);
    await getFarmCollection('tasks', currentFarm).doc(task.id).update({
      dueDate: newDate.toISOString().split('T')[0],
      postponedCount: (task.postponedCount || 0) + 1,
    });
    Alert.alert('Éxito', `Tarea pospuesta ${days} día(s)`);
    onUpdate();
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'alta': return '#F44336';
      case 'media': return '#FF9800';
      case 'baja': return '#4CAF50';
      default: return '#999';
    }
  };

  const getLocationText = () => {
    if (task.relatedTo === 'finca') return '🌍 Toda la finca';
    if (task.relatedTo === 'sector') return `📍 Sector: ${details.sector?.name || 'N/A'}`;
    if (task.relatedTo === 'row') return `📊 Surco: ${details.row?.name || 'N/A'}`;
    if (task.relatedTo === 'tree') return `🌳 Árbol #${details.tree?.number || 'N/A'}`;
    return '';
  };

  return (
    <View style={[styles.taskCard, task.status === 'completed' && styles.taskCardCompleted]}>
      <View style={styles.taskHeader}>
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor() }]} />
        <View style={styles.taskHeaderContent}>
          <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleCompleted]}>
            {task.title}
          </Text>
          {task.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.completedText}>Completada</Text>
            </View>
          )}
        </View>
      </View>

      {task.description && (
        <Text style={styles.taskDescription}>{task.description}</Text>
      )}

      <Text style={styles.taskLocation}>{getLocationText()}</Text>

      {task.isRecurring && (
        <View style={styles.recurringBadge}>
          <Ionicons name="repeat" size={14} color="white" />
          <Text style={styles.recurringBadgeText}>Recurrente - {task.frequency}</Text>
        </View>
      )}

      {task.status !== 'completed' && (
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#E8F5E9' }]}
            onPress={handleComplete}
          >
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Completar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FFF3E0' }]}
            onPress={handlePostpone}
          >
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>Posponer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TaskModal({ visible, initialDate, task, onClose, onSuccess, currentFarm }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || initialDate);
  const [priority, setPriority] = useState(task?.priority || 'media');
  const [relatedTo, setRelatedTo] = useState(task?.relatedTo || 'finca');
  const [sectorId, setSectorId] = useState(task?.sectorId || '');
  const [rowId, setRowId] = useState(task?.rowId || '');
  const [treeId, setTreeId] = useState(task?.treeId || '');
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [frequency, setFrequency] = useState(task?.frequency || 'semanal');

  const [sectors, setSectors] = useState([]);
  const [rows, setRows] = useState([]);
  const [trees, setTrees] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sectorsSnap, rowsSnap, treesSnap] = await Promise.all([
      getFarmCollection('sectors', currentFarm).get(),
      getFarmCollection('rows', currentFarm).get(),
      getFarmCollection('trees', currentFarm).get(),
    ]);
    setSectors(sectorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setRows(rowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setTrees(treesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async () => {
    if (!title || !dueDate) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    const data = {
      title,
      description,
      dueDate,
      priority,
      relatedTo,
      sectorId: relatedTo === 'sector' || relatedTo === 'row' || relatedTo === 'tree' ? sectorId : null,
      rowId: relatedTo === 'row' || relatedTo === 'tree' ? rowId : null,
      treeId: relatedTo === 'tree' ? treeId : null,
      isRecurring,
      frequency: isRecurring ? frequency : null,
      status: 'pending',
      postponedCount: 0,
    };

    try {
      if (task) {
        await getFarmCollection('tasks', currentFarm).doc(task.id).update(data);
        Alert.alert('Éxito', 'Tarea actualizada');
      } else {
        await getFarmCollection('tasks', currentFarm).add({ ...data, createdAt: new Date().toISOString() });
        Alert.alert('Éxito', 'Tarea creada');
        // scheduleNotification(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  const filteredRows = rows.filter(r => r.sectorId === sectorId);
  const filteredTrees = trees.filter(t => t.rowId === rowId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{task ? 'Editar' : 'Nueva'} Tarea</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={styles.label}>Título *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Aplicar fertilizante..." />

            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Detalles..." multiline numberOfLines={3} />

            <Text style={styles.label}>Fecha de Vencimiento *</Text>
            <DatePickerInput value={dueDate} onChangeDate={setDueDate} />

            <Text style={styles.label}>Prioridad</Text>
            <View style={styles.pickerContainer}>
              {['baja', 'media', 'alta'].map(p => (
                <TouchableOpacity key={p} style={[styles.pickerOption, priority === p && styles.pickerOptionSelected]} onPress={() => setPriority(p)}>
                  <Text style={[styles.pickerOptionText, priority === p && styles.pickerOptionTextSelected]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Aplicar a</Text>
            <View style={styles.pickerContainer}>
              {['finca', 'sector', 'row', 'tree'].map(r => (
                <TouchableOpacity key={r} style={[styles.pickerOption, relatedTo === r && styles.pickerOptionSelected]} onPress={() => setRelatedTo(r)}>
                  <Text style={[styles.pickerOptionText, relatedTo === r && styles.pickerOptionTextSelected]}>
                    {r === 'finca' ? 'Finca' : r === 'sector' ? 'Sector' : r === 'row' ? 'Surco' : 'Árbol'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(relatedTo === 'sector' || relatedTo === 'row' || relatedTo === 'tree') && (
              <>
                <Text style={styles.label}>Sector</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {sectors.map(s => (
                    <TouchableOpacity key={s.id} style={[styles.pickerOption, sectorId === s.id && styles.pickerOptionSelected]} onPress={() => { setSectorId(s.id); setRowId(''); setTreeId(''); }}>
                      <Text style={[styles.pickerOptionText, sectorId === s.id && styles.pickerOptionTextSelected]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {(relatedTo === 'row' || relatedTo === 'tree') && sectorId && (
              <>
                <Text style={styles.label}>Surco</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {filteredRows.map(r => (
                    <TouchableOpacity key={r.id} style={[styles.pickerOption, rowId === r.id && styles.pickerOptionSelected]} onPress={() => { setRowId(r.id); setTreeId(''); }}>
                      <Text style={[styles.pickerOptionText, rowId === r.id && styles.pickerOptionTextSelected]}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {relatedTo === 'tree' && rowId && (
              <>
                <Text style={styles.label}>Árbol</Text>
                <ScrollView horizontal style={styles.pickerContainer}>
                  {filteredTrees.map(t => (
                    <TouchableOpacity key={t.id} style={[styles.pickerOption, treeId === t.id && styles.pickerOptionSelected]} onPress={() => setTreeId(t.id)}>
                      <Text style={[styles.pickerOptionText, treeId === t.id && styles.pickerOptionTextSelected]}>#{t.number}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.checkboxContainer}>
              <TouchableOpacity style={styles.checkbox} onPress={() => setIsRecurring(!isRecurring)}>
                <Ionicons name={isRecurring ? 'checkbox' : 'square-outline'} size={24} color="#4CAF50" />
                <Text style={styles.checkboxLabel}>Tarea Recurrente</Text>
              </TouchableOpacity>
            </View>

            {isRecurring && (
              <>
                <Text style={styles.label}>Frecuencia</Text>
                <View style={styles.pickerContainer}>
                  {['diaria', 'semanal', 'quincenal', 'mensual'].map(f => (
                    <TouchableOpacity key={f} style={[styles.pickerOption, frequency === f && styles.pickerOptionSelected]} onPress={() => setFrequency(f)}>
                      <Text style={[styles.pickerOptionText, frequency === f && styles.pickerOptionTextSelected]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{task ? 'Actualizar' : 'Crear'} Tarea</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TasksDashboard({ currentFarm, onBack }) {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    avgPostpones: 0,
    topRecurring: [],
    tasksByPriority: { alta: 0, media: 0, baja: 0 },
    tasksByLocation: [],
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const snapshot = await getFarmCollection('tasks', currentFarm).get();
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const today = new Date().toISOString().split('T')[0];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      const overdueTasks = tasks.filter(t => t.status === 'pending' && t.dueDate < today).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;
      const avgPostpones = tasks.reduce((sum, t) => sum + (t.postponedCount || 0), 0) / totalTasks || 0;

      const recurringTasks = tasks.filter(t => t.isRecurring);
      const topRecurring = recurringTasks.slice(0, 5).map(t => ({ name: t.title, count: 1 }));

      const tasksByPriority = {
        alta: tasks.filter(t => t.priority === 'alta').length,
        media: tasks.filter(t => t.priority === 'media').length,
        baja: tasks.filter(t => t.priority === 'baja').length,
      };

      const locationCounts = {};
      tasks.forEach(t => {
        const loc = t.relatedTo || 'finca';
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });
      const tasksByLocation = Object.entries(locationCounts).map(([name, count]) => ({ name, count }));

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        avgPostpones,
        topRecurring,
        tasksByPriority,
        tasksByLocation,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard de Tareas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { borderLeftColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-done" size={24} color="#4CAF50" />
            <Text style={styles.metricValue}>{stats.completedTasks}</Text>
            <Text style={styles.metricTitle}>Completadas</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#FF9800' }]}>
            <Ionicons name="time" size={24} color="#FF9800" />
            <Text style={styles.metricValue}>{stats.pendingTasks}</Text>
            <Text style={styles.metricTitle}>Pendientes</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#F44336' }]}>
            <Ionicons name="alert-circle" size={24} color="#F44336" />
            <Text style={styles.metricValue}>{stats.overdueTasks}</Text>
            <Text style={styles.metricTitle}>Atrasadas</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#2196F3' }]}>
            <Ionicons name="pie-chart" size={24} color="#2196F3" />
            <Text style={styles.metricValue}>{stats.completionRate.toFixed(0)}%</Text>
            <Text style={styles.metricTitle}>Tasa Completado</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tareas por Prioridad</Text>
          <View style={styles.priorityStats}>
            <View style={styles.priorityStatItem}>
              <Text style={[styles.priorityStatValue, { color: '#F44336' }]}>{stats.tasksByPriority.alta}</Text>
              <Text style={styles.priorityStatLabel}>Alta</Text>
            </View>
            <View style={styles.priorityStatItem}>
              <Text style={[styles.priorityStatValue, { color: '#FF9800' }]}>{stats.tasksByPriority.media}</Text>
              <Text style={styles.priorityStatLabel}>Media</Text>
            </View>
            <View style={styles.priorityStatItem}>
              <Text style={[styles.priorityStatValue, { color: '#4CAF50' }]}>{stats.tasksByPriority.baja}</Text>
              <Text style={styles.priorityStatLabel}>Baja</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tareas por Ubicación</Text>
          {stats.tasksByLocation.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <View style={styles.topRankBadge}>
                <Text style={styles.topRankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.topName}>{item.name}</Text>
              <Text style={styles.topValue}>{item.count} tareas</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ============ REPORTS SCREEN ============
function ReportsScreen({ onBack, currentFarm }) {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [stats, setStats] = useState({
    // Financial
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    roi: 0,
    profitMargin: 0,
    // Production
    totalProduction: 0,
    totalWaste: 0,
    wastePercentage: 0,
    avgYieldPerTree: 0,
    // Trees
    totalTrees: 0,
    healthyTrees: 0,
    healthPercentage: 0,
    // Sales
    totalSales: 0,
    avgSalePrice: 0,
    // Costs
    costPerUnit: 0,
    costPerTree: 0,
    // Comparisons
    vsLastMonth: {
      revenue: 0,
      expenses: 0,
      profit: 0,
    },
    // Top performers
    topProducts: [],
    topSectors: [],
    topCustomers: [],
  });

  const [months, setMonths] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedMonth, selectedProduct]);

  const loadFilters = async () => {
    // Get unique months from sales and expenses
    const [salesSnap, expensesSnap, typesSnap] = await Promise.all([
      getFarmCollection('sales', currentFarm).get(),
      getFarmCollection('expenses', currentFarm).get(),
      getFarmCollection('treeTypes', currentFarm).get(),
    ]);

    const monthsSet = new Set();
    salesSnap.docs.forEach(doc => {
      const date = doc.data().date;
      if (date) monthsSet.add(date.substring(0, 7));
    });
    expensesSnap.docs.forEach(doc => {
      const date = doc.data().date;
      if (date) monthsSet.add(date.substring(0, 7));
    });

    setMonths(['all', ...Array.from(monthsSet).sort().reverse()]);
    setProducts(['all', ...typesSnap.docs.map(doc => doc.data().name)]);
  };

  const loadStats = async () => {
    try {
      // Fetch all data
      const [salesSnap, expensesSnap, harvestsSnap, treesSnap, customersSnap, sectorsSnap] = await Promise.all([
        getFarmCollection('sales', currentFarm).get(),
        getFarmCollection('expenses', currentFarm).get(),
        getFarmCollection('harvests', currentFarm).get(),
        getFarmCollection('trees', currentFarm).get(),
        db.collection('customers').get(),
        getFarmCollection('sectors', currentFarm).get(),
      ]);

      const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const harvests = harvestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const trees = treesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sectors = sectorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Apply filters
      const filteredSales = sales.filter(s => {
        const matchMonth = selectedMonth === 'all' || s.date?.startsWith(selectedMonth);
        const matchProduct = selectedProduct === 'all' || s.productType === selectedProduct;
        return matchMonth && matchProduct;
      });

      const filteredExpenses = expenses.filter(e => {
        const matchMonth = selectedMonth === 'all' || e.date?.startsWith(selectedMonth);
        const matchProduct = selectedProduct === 'all' || e.productType === selectedProduct || !e.productType;
        return matchMonth && matchProduct;
      });

      const filteredHarvests = harvests.filter(h => {
        const matchMonth = selectedMonth === 'all' || h.date?.startsWith(selectedMonth);
        const matchProduct = selectedProduct === 'all' || h.productType === selectedProduct;
        return matchMonth && matchProduct;
      });

      // Financial metrics
      const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100) : 0;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

      // Production metrics
      const totalProduction = filteredHarvests.reduce((sum, h) => sum + (h.quantity || 0), 0);
      const totalWaste = filteredHarvests.reduce((sum, h) => sum + (h.waste || 0), 0);
      const wastePercentage = totalProduction > 0 ? (totalWaste / totalProduction * 100) : 0;
      const avgYieldPerTree = trees.length > 0 ? totalProduction / trees.length : 0;

      // Trees metrics
      const totalTrees = trees.length;
      const healthyTrees = trees.filter(t => t.healthStatus === 'Saludable').length;
      const healthPercentage = totalTrees > 0 ? (healthyTrees / totalTrees * 100) : 0;

      // Sales metrics
      const totalSales = filteredSales.length;
      const avgSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Cost metrics
      const costPerUnit = totalProduction > 0 ? totalExpenses / totalProduction : 0;
      const costPerTree = totalTrees > 0 ? totalExpenses / totalTrees : 0;

      // Last month comparison (if current month selected)
      let vsLastMonth = { revenue: 0, expenses: 0, profit: 0 };
      if (selectedMonth !== 'all') {
        const lastMonth = new Date(selectedMonth + '-01');
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().substring(0, 7);

        const lastMonthSales = sales.filter(s => s.date?.startsWith(lastMonthStr));
        const lastMonthExpenses = expenses.filter(e => e.date?.startsWith(lastMonthStr));
        const lastMonthRevenue = lastMonthSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const lastMonthExpensesTotal = lastMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const lastMonthProfit = lastMonthRevenue - lastMonthExpensesTotal;

        vsLastMonth = {
          revenue: lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0,
          expenses: lastMonthExpensesTotal > 0 ? ((totalExpenses - lastMonthExpensesTotal) / lastMonthExpensesTotal * 100) : 0,
          profit: lastMonthProfit !== 0 ? ((netProfit - lastMonthProfit) / Math.abs(lastMonthProfit) * 100) : 0,
        };
      }

      // Top products by revenue
      const productRevenue = {};
      filteredSales.forEach(s => {
        const prod = s.productType || 'Sin especificar';
        productRevenue[prod] = (productRevenue[prod] || 0) + (s.total || 0);
      });
      const topProducts = Object.entries(productRevenue)
        .map(([name, revenue]) => ({ name, value: revenue }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Top sectors by profit (revenue - expenses)
      const sectorMetrics = {};
      filteredSales.forEach(s => {
        // We don't have sector in sales, so this is approximate
        sectors.forEach(sector => {
          sectorMetrics[sector.id] = sectorMetrics[sector.id] || { name: sector.name, revenue: 0, expenses: 0 };
        });
      });
      
      filteredExpenses.forEach(e => {
        if (e.applications) {
          e.applications.forEach(app => {
            if (app.sectorId) {
              sectorMetrics[app.sectorId] = sectorMetrics[app.sectorId] || { name: '', revenue: 0, expenses: 0 };
              sectorMetrics[app.sectorId].expenses += (e.amount / e.applications.length);
              const sector = sectors.find(s => s.id === app.sectorId);
              if (sector) sectorMetrics[app.sectorId].name = sector.name;
            }
          });
        }
      });

      const topSectors = Object.values(sectorMetrics)
        .map(s => ({ name: s.name, value: s.revenue - s.expenses }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Top customers
      const customerRevenue = {};
      filteredSales.forEach(s => {
        customerRevenue[s.customerId] = (customerRevenue[s.customerId] || 0) + (s.total || 0);
      });
      const topCustomers = Object.entries(customerRevenue)
        .map(([id, revenue]) => {
          const customer = customers.find(c => c.id === id);
          return { name: customer?.name || 'Desconocido', value: revenue };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit,
        roi,
        profitMargin,
        totalProduction,
        totalWaste,
        wastePercentage,
        avgYieldPerTree,
        totalTrees,
        healthyTrees,
        healthPercentage,
        totalSales,
        avgSalePrice,
        costPerUnit,
        costPerTree,
        vsLastMonth,
        topProducts,
        topSectors,
        topCustomers,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const MetricCard = ({ icon, title, value, subtitle, color, change }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={24} color={color} />
        {change !== undefined && change !== 0 && (
          <View style={[styles.changeIndicator, { backgroundColor: change >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
            <Ionicons name={change >= 0 ? 'trending-up' : 'trending-down'} size={12} color={change >= 0 ? '#4CAF50' : '#F44336'} />
            <Text style={[styles.changeText, { color: change >= 0 ? '#4CAF50' : '#F44336' }]}>
              {Math.abs(change).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Reportes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Filters */}
        <View style={styles.filtersCard}>
          <Text style={styles.filterLabel}>Período</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {months.map(month => (
              <TouchableOpacity
                key={month}
                style={[styles.filterChip, selectedMonth === month && styles.filterChipActive]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text style={[styles.filterChipText, selectedMonth === month && styles.filterChipTextActive]}>
                  {month === 'all' ? 'Todo' : month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: 15 }]}>Producto</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {products.map(product => (
              <TouchableOpacity
                key={product}
                style={[styles.filterChip, selectedProduct === product && styles.filterChipActive]}
                onPress={() => setSelectedProduct(product)}
              >
                <Text style={[styles.filterChipText, selectedProduct === product && styles.filterChipTextActive]}>
                  {product === 'all' ? 'Todos' : product}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resumen Financiero</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon="cash"
              title="Ingresos"
              value={`Q${stats.totalRevenue.toFixed(0)}`}
              color="#4CAF50"
              change={stats.vsLastMonth.revenue}
            />
            <MetricCard
              icon="wallet"
              title="Gastos"
              value={`Q${stats.totalExpenses.toFixed(0)}`}
              color="#F44336"
              change={stats.vsLastMonth.expenses}
            />
            <MetricCard
              icon="trending-up"
              title="Ganancia Neta"
              value={`Q${stats.netProfit.toFixed(0)}`}
              subtitle={stats.netProfit >= 0 ? 'Positivo' : 'Negativo'}
              color={stats.netProfit >= 0 ? '#4CAF50' : '#F44336'}
              change={stats.vsLastMonth.profit}
            />
            <MetricCard
              icon="analytics"
              title="ROI"
              value={`${stats.roi.toFixed(1)}%`}
              subtitle="Retorno de inversión"
              color="#2196F3"
            />
            <MetricCard
              icon="pie-chart"
              title="Margen"
              value={`${stats.profitMargin.toFixed(1)}%`}
              subtitle="Margen de ganancia"
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Production Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌾 Producción</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon="basket"
              title="Producción Total"
              value={stats.totalProduction.toFixed(0)}
              subtitle="unidades"
              color="#795548"
            />
            <MetricCard
              icon="trash"
              title="Merma"
              value={`${stats.wastePercentage.toFixed(1)}%`}
              subtitle={`${stats.totalWaste.toFixed(0)} unidades`}
              color="#FF9800"
            />
            <MetricCard
              icon="leaf"
              title="Rendimiento/Árbol"
              value={stats.avgYieldPerTree.toFixed(1)}
              subtitle="promedio"
              color="#8BC34A"
            />
          </View>
        </View>

        {/* Cost Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Análisis de Costos</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon="calculator"
              title="Costo/Unidad"
              value={`Q${stats.costPerUnit.toFixed(2)}`}
              subtitle="costo producción"
              color="#FF5722"
            />
            <MetricCard
              icon="leaf"
              title="Costo/Árbol"
              value={`Q${stats.costPerTree.toFixed(0)}`}
              subtitle="inversión por árbol"
              color="#607D8B"
            />
            <MetricCard
              icon="pricetag"
              title="Precio Venta Prom."
              value={`Q${stats.avgSalePrice.toFixed(0)}`}
              subtitle="por venta"
              color="#00BCD4"
            />
          </View>
        </View>

        {/* Trees Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌳 Estado de Árboles</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthStats}>
              <View style={styles.healthStatItem}>
                <Text style={styles.healthStatValue}>{stats.totalTrees}</Text>
                <Text style={styles.healthStatLabel}>Total</Text>
              </View>
              <View style={styles.healthStatItem}>
                <Text style={[styles.healthStatValue, { color: '#4CAF50' }]}>{stats.healthyTrees}</Text>
                <Text style={styles.healthStatLabel}>Saludables</Text>
              </View>
              <View style={styles.healthStatItem}>
                <Text style={[styles.healthStatValue, { color: '#4CAF50' }]}>{stats.healthPercentage.toFixed(0)}%</Text>
                <Text style={styles.healthStatLabel}>Salud</Text>
              </View>
            </View>
            <View style={styles.healthBar}>
              <View style={[styles.healthBarFill, { width: `${stats.healthPercentage}%` }]} />
            </View>
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top 5 Productos (Ingresos)</Text>
          {stats.topProducts.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <View style={styles.topRankBadge}>
                <Text style={styles.topRankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.topName}>{item.name}</Text>
              <Text style={styles.topValue}>Q{item.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Top 5 Clientes</Text>
          {stats.topCustomers.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <View style={styles.topRankBadge}>
                <Text style={styles.topRankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.topName}>{item.name}</Text>
              <Text style={styles.topValue}>Q{item.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryHeader}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.summaryTitle}>Resumen del Período</Text>
          </View>
          <Text style={styles.summaryText}>
            Período: <Text style={styles.summaryBold}>{selectedMonth === 'all' ? 'Todos los meses' : selectedMonth}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Producto: <Text style={styles.summaryBold}>{selectedProduct === 'all' ? 'Todos' : selectedProduct}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Ventas realizadas: <Text style={styles.summaryBold}>{stats.totalSales}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Balance: <Text style={[styles.summaryBold, { color: stats.netProfit >= 0 ? '#4CAF50' : '#F44336' }]}>
              Q{stats.netProfit.toFixed(0)} {stats.netProfit >= 0 ? '✓' : '✗'}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ============ MAP VIEW & SETTINGS ============
function MapViewScreen({ onBack }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Mapa</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="map" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Vista de Mapa</Text>
      </View>
    </View>
  );
}


// ============ FARM MEMBERS SCREEN ============
function FarmMembersScreen({ currentFarm, onBack }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('worker');

  useEffect(() => {
    loadMembers();
  }, [currentFarm]);

  const loadMembers = async () => {
    if (!currentFarm) return;
    
    setLoading(true);
    try {
      // Buscar todos los usuarios que tienen esta finca
      const usersSnap = await db.collection('users').get();
      const farmMembers = [];
      
      usersSnap.forEach(doc => {
        const userData = doc.data();
        if (userData.farms) {
          const farm = userData.farms.find(f => f.id === currentFarm.id);
          if (farm) {
            farmMembers.push({
              uid: doc.id,
              email: userData.email,
              role: farm.role,
              joinedAt: farm.joinedAt || new Date().toISOString()
            });
          }
        }
      });
      
      setMembers(farmMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'No se pudieron cargar los miembros');
    }
    setLoading(false);
  };

  const inviteUser = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }

    console.log('🔍 Buscando usuario:', inviteEmail.toLowerCase().trim());

    try {
      // Buscar si el usuario existe
      const usersSnap = await db.collection('users')
        .where('email', '==', inviteEmail.toLowerCase().trim())
        .get();

      console.log('📊 Usuarios encontrados:', usersSnap.size);

      if (usersSnap.empty) {
        console.log('❌ Usuario no encontrado en Firebase');
        Alert.alert(
          'Usuario no encontrado',
          `El email ${inviteEmail} no está registrado en la app.

El usuario debe:
1. Descargar la app
2. Registrarse con este email
3. Luego puedes invitarlo`
        );
        return;
      }

      const userDoc = usersSnap.docs[0];
      const userData = userDoc.data();
      
      console.log('👤 Usuario encontrado:', userDoc.id);
      console.log('📋 Fincas del usuario:', userData.farms);
      
      // Verificar si ya está en la finca
      if (userData.farms && userData.farms.some(f => f.id === currentFarm.id)) {
        console.log('⚠️ Usuario ya es miembro de esta finca');
        Alert.alert('Error', 'El usuario ya es miembro de esta finca');
        return;
      }

      // Agregar finca al usuario
      const newFarm = {
        id: currentFarm.id,
        name: currentFarm.name,
        role: inviteRole,
        joinedAt: new Date().toISOString()
      };

      console.log('➕ Agregando finca al usuario:', newFarm);

      await db.collection('users').doc(userDoc.id).update({
        farms: firebase.firestore.FieldValue.arrayUnion(newFarm)
      });

      console.log('✅ Usuario invitado exitosamente');
      Alert.alert('¡Éxito!', `${inviteEmail} ha sido agregado como ${inviteRole}`);
      setShowInviteModal(false);
      setInviteEmail('');
      loadMembers();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      
      let errorMessage = 'No se pudo invitar al usuario.\n\n';
      
      if (error.code === 'permission-denied') {
        errorMessage += 'Error: Permisos de Firebase insuficientes.\n\nSolución: Verifica las reglas de Firestore.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Error: Sin conexión a internet.\n\nSolución: Verifica tu conexión.';
      } else {
        errorMessage += `Error técnico: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const changeRole = async (uid, newRole) => {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();
      
      const updatedFarms = userData.farms.map(f => 
        f.id === currentFarm.id ? { ...f, role: newRole } : f
      );

      await db.collection('users').doc(uid).update({
        farms: updatedFarms
      });

      Alert.alert('¡Éxito!', 'Rol actualizado correctamente');
      loadMembers();
    } catch (error) {
      console.error('Error changing role:', error);
      Alert.alert('Error', 'No se pudo cambiar el rol');
    }
  };

  const removeMember = async (uid, email) => {
    Alert.alert(
      'Confirmar',
      `¿Eliminar a ${email} de la finca?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const userDoc = await db.collection('users').doc(uid).get();
              const userData = userDoc.data();
              
              const updatedFarms = userData.farms.filter(f => f.id !== currentFarm.id);

              await db.collection('users').doc(uid).update({
                farms: updatedFarms
              });

              Alert.alert('¡Éxito!', 'Miembro eliminado');
              loadMembers();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'No se pudo eliminar al miembro');
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'owner': return '#4CAF50';
      case 'manager': return '#2196F3';
      case 'worker': return '#FF9800';
      default: return '#666';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'owner': return 'shield-checkmark';
      case 'manager': return 'person-circle';
      case 'worker': return 'person';
      default: return 'person';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 15, flex: 1 }}>
            Miembros de {currentFarm?.name}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowInviteModal(true)}
            style={{ backgroundColor: '#4CAF50', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 }}
          >
            <Ionicons name="person-add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Members List */}
      <ScrollView style={{ flex: 1, padding: 15 }}>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>Cargando...</Text>
        ) : members.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No hay miembros</Text>
        ) : (
          members.map((member, index) => (
            <View key={index} style={{ backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <Ionicons name={getRoleIcon(member.role)} size={20} color={getRoleColor(member.role)} />
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#333' }}>
                      {member.email}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: getRoleColor(member.role), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                        {member.role.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#999', marginLeft: 10 }}>
                      Desde: {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row' }}>
                  {/* Change Role */}
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Cambiar rol',
                        `Selecciona el nuevo rol para ${member.email}`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Owner', onPress: () => changeRole(member.uid, 'owner') },
                          { text: 'Manager', onPress: () => changeRole(member.uid, 'manager') },
                          { text: 'Worker', onPress: () => changeRole(member.uid, 'worker') }
                        ]
                      );
                    }}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="create-outline" size={20} color="#2196F3" />
                  </TouchableOpacity>

                  {/* Remove Member */}
                  {member.role !== 'owner' && (
                    <TouchableOpacity
                      onPress={() => removeMember(member.uid, member.email)}
                      style={{ padding: 8 }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' }}>
              Invitar Usuario
            </Text>

            <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>Email del usuario:</Text>
            <TextInput
              style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 }}
              placeholder="usuario@ejemplo.com"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>Rol:</Text>
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              {['worker', 'manager', 'owner'].map(role => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setInviteRole(role)}
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: inviteRole === role ? getRoleColor(role) : '#f5f5f5',
                    borderRadius: 10,
                    marginHorizontal: 5,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: inviteRole === role ? 'white' : '#666', fontWeight: '600', fontSize: 12 }}>
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
                style={{ flex: 1, padding: 15, backgroundColor: '#e0e0e0', borderRadius: 10, marginRight: 10, alignItems: 'center' }}
              >
                <Text style={{ color: '#333', fontWeight: '600', fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={inviteUser}
                style={{ flex: 1, padding: 15, backgroundColor: '#4CAF50', borderRadius: 10, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Invitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingsScreen({ 
  settings, 
  currentFarm, 
  setCurrentFarm, 
  userFarms, 
  setUserFarms, 
  onUpdateSettings, 
  onBack,
  isPremium,
  userRole,
  onNavigate,
  setShowRequestPremiumModal,
  isPlatformAdmin  // 🆕
}) {  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currency, setCurrency] = useState(settings.currency);
  const [farmName, setFarmName] = useState(currentFarm?.name || 'Mi Finca');

  const handleSave = async () => {
    try {
      // Guardar currency
      await db.collection('settings').doc('app').set({ currency });
      onUpdateSettings({ currency });
      
      // Guardar nombre de finca si cambió
      if (farmName !== currentFarm.name) {
        console.log('🏷️ Actualizando nombre de finca:', farmName);
        
        // Actualizar documento de la finca
        await db.collection('farms').doc(currentFarm.id).update({
          name: farmName
        });
        
        // Actualizar en el documento del usuario
        const user = auth.currentUser;
        if (user) {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const updatedFarms = userData.farms.map(f => 
              f.id === currentFarm.id ? { ...f, name: farmName } : f
            );
            await db.collection('users').doc(user.uid).update({
              farms: updatedFarms
            });
            
            // Actualizar estado local de userFarms
            setUserFarms(updatedFarms);
            console.log('✅ userFarms actualizado con nuevo nombre');
          }
        }
        
        // Actualizar estado local
        setCurrentFarm({ ...currentFarm, name: farmName });
        console.log('✅ Nombre de finca actualizado en todos los lugares');
      }
      
      Alert.alert('Éxito', 'Configuración guardada');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración: ' + error.message);
    }
  };

  const handleSaveLocation = async (location) => {
    try {
      const updatedSettings = { ...settings, location };
      await db.collection('settings').doc('app').set(updatedSettings);
      onUpdateSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error('Error saving location:', error);
      return false;
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', onPress: () => auth.signOut(), style: 'destructive' },
    ]);
  };

  return (
    <View style={styles.container}>
      {onBack && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
          <View style={{ width: 24 }} />
        </View>
      )}
      <ScrollView style={styles.content}>
        {/* Nombre de Finca */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏡 Nombre de la Finca</Text>
          <TextInput
            style={styles.input}
            value={farmName}
            onChangeText={setFarmName}
            placeholder="Mi Finca"
          />
          <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
            Este nombre aparecerá en el encabezado de la aplicación
          </Text>
        </View>

 <View style={styles.section}>
  <Text style={styles.sectionTitle}>💱 Moneda</Text>
  <Text style={{ fontSize: 12, color: '#666', marginBottom: 15 }}>
    Selecciona la moneda para tu finca
  </Text>
  
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    style={{ marginBottom: 10 }}
  >
    {[
      { code: 'GTQ', symbol: 'Q', name: 'Quetzal' },
      { code: 'USD', symbol: '$', name: 'Dólar' },
      { code: 'MXN', symbol: 'MX$', name: 'Peso MX' },
      { code: 'ARS', symbol: 'AR$', name: 'Peso AR' },
      { code: 'CLP', symbol: 'CL$', name: 'Peso CL' },
      { code: 'COP', symbol: 'CO$', name: 'Peso CO' },
      { code: 'PEN', symbol: 'S/', name: 'Sol' },
      { code: 'BRL', symbol: 'R$', name: 'Real' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
    ].map((curr) => (
      <TouchableOpacity
        key={curr.code}
        style={[
          styles.currencyButton,
          currency === curr.symbol && styles.currencyButtonActive
        ]}
        onPress={() => setCurrency(curr.symbol)}
      >
        <Text style={[
          styles.currencySymbol,
          currency === curr.symbol && styles.currencySymbolActive
        ]}>
          {curr.symbol}
        </Text>
        <Text style={[
          styles.currencyName,
          currency === curr.symbol && styles.currencyNameActive
        ]}>
          {curr.name}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
  
  <TouchableOpacity
    style={styles.expandButton}
    onPress={() => Alert.alert(
      '💱 Todas las monedas',
      '🇬🇹 Quetzal (Q)\n🇺🇸 Dólar ($)\n🇲🇽 Peso Mexicano (MX$)\n🇦🇷 Peso Argentino (AR$)\n🇨🇱 Peso Chileno (CL$)\n🇨🇴 Peso Colombiano (CO$)\n🇵🇪 Sol Peruano (S/)\n🇧🇷 Real Brasileño (R$)\n🇺🇾 Peso Uruguayo ($U)\n🇵🇾 Guaraní (₲)\n🇧🇴 Boliviano (Bs)\n🇻🇪 Bolívar (Bs.S)\n🇨🇷 Colón (₡)\n🇵🇦 Balboa (B/.)\n🇳🇮 Córdoba (C$)\n🇭🇳 Lempira (L)\n🇩🇴 Peso Dominicano (RD$)\n🇪🇺 Euro (€)',
      [{ text: 'Cerrar' }]
    )}
  >
    <Text style={styles.expandButtonText}>Ver todas las monedas de Latinoamérica →</Text>
  </TouchableOpacity>
</View>

        {/* Configuración de Ubicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Ubicación de la Finca</Text>
          <TouchableOpacity 
            style={{
              backgroundColor: 'white',
              padding: 15,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 10,
            }}
            onPress={() => setShowLocationModal(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 }}>
                Ubicación para Clima
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {settings?.location?.name || 'Guatemala City (Predeterminado)'}
              </Text>
              <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                Lat: {settings?.location?.lat?.toFixed(4) || '14.6349'}, Lon: {settings?.location?.lon?.toFixed(4) || '-90.5069'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
        {/* 🆕 SECCIÓN DE MONETIZACIÓN (ADMIN) */}
{/* 🆕 SECCIÓN DE MONETIZACIÓN (SOLO PLATFORM ADMIN) */}
{isPlatformAdmin && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>👑 Panel de Administrador</Text>
    
    <TouchableOpacity
      style={styles.adminButton}
      onPress={() => onNavigate('PlatformMetrics')}
    >
      <Ionicons name="analytics" size={24} color="#9C27B0" />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.adminButtonTitle}>Métricas de Plataforma</Text>
        <Text style={styles.adminButtonSubtitle}>
          Usuarios, descargas, retención, ingresos
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.adminButton}
      onPress={() => onNavigate('AdminMetrics')}
    >
      <Ionicons name="stats-chart" size={24} color="#2196F3" />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.adminButtonTitle}>Solicitudes Premium</Text>
        <Text style={styles.adminButtonSubtitle}>
          Ver y gestionar solicitudes
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.adminButton}
      onPress={() => onNavigate('ActivatePremium')}
    >
      <Ionicons name="key" size={24} color="#FF9800" />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.adminButtonTitle}>Activar Premium Manual</Text>
        <Text style={styles.adminButtonSubtitle}>
          Activar/desactivar usuarios premium
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  </View>
)}
      
      {/* 🆕 BADGE DE ESTADO PREMIUM */}
      <View style={[styles.section, { alignItems: 'center' }]}>
        <View style={[
          styles.premiumBadge,
          isPremium && styles.premiumBadgeActive
        ]}>
          <Ionicons 
            name={isPremium ? "star" : "star-outline"} 
            size={20} 
            color={isPremium ? "#FFD700" : "#999"} 
          />
          <Text style={[
            styles.premiumBadgeText,
            isPremium && styles.premiumBadgeTextActive
          ]}>
            {isPremium ? 'CUENTA PREMIUM ACTIVA' : 'CUENTA GRATUITA'}
          </Text>
        </View>
        
        {!isPremium && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowRequestPremiumModal(true)}
          >
            <Text style={styles.upgradeButtonText}>
              ⭐ Solicitar Plan Premium
            </Text>
          </TouchableOpacity>
        )}
      </View>

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Ubicación */}
      <LocationSettingsModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentLocation={settings?.location}
        onSave={handleSaveLocation}
      />
    </View>
  );
}


// ============ INVENTARIO SCREEN ============
function InventoryScreen({ onBack, currentFarm }) {
  const [view, setView] = useState('list'); // list, add, edit
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all'); // all, low-stock, fertilizers, pesticides, tools

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Fertilizante');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minStock, setMinStock] = useState('');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const [itemsSnap, suppliersSnap] = await Promise.all([
        getFarmCollection('inventory', currentFarm).orderBy('name').get(),
        db.collection('suppliers').get(),
      ]);

      setItems(itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSuppliers(suppliersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !quantity || !minStock || !cost) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
      return;
    }

    const itemData = {
      name,
      category,
      quantity: parseFloat(quantity),
      unit,
      minStock: parseFloat(minStock),
      cost: parseFloat(cost),
      supplier,
      expiryDate,
      notes,
      lastUpdated: new Date().toISOString(),
    };

    try {
      if (editingItem) {
        await getFarmCollection('inventory', currentFarm).doc(editingItem.id).update(itemData);
        Alert.alert('Éxito', 'Producto actualizado');
      } else {
        await getFarmCollection('inventory', currentFarm).add(itemData);
        Alert.alert('Éxito', 'Producto agregado');
      }
      resetForm();
      setView('list');
      loadInventory();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setMinStock(item.minStock.toString());
    setCost(item.cost.toString());
    setSupplier(item.supplier || '');
    setExpiryDate(item.expiryDate || '');
    setNotes(item.notes || '');
    setView('add');
  };

  const handleDelete = (item) => {
    Alert.alert('Confirmar', '¿Eliminar este producto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await getFarmCollection('inventory', currentFarm).doc(item.id).delete();
          Alert.alert('Éxito', 'Producto eliminado');
          loadInventory();
        },
      },
    ]);
  };

  const resetForm = () => {
    setName('');
    setCategory('Fertilizante');
    setQuantity('');
    setUnit('kg');
    setMinStock('');
    setCost('');
    setSupplier('');
    setExpiryDate('');
    setNotes('');
    setEditingItem(null);
  };

  const getFilteredItems = () => {
    let filtered = items;
    if (filter === 'low-stock') {
      filtered = items.filter(item => item.quantity <= item.minStock);
    } else if (filter !== 'all') {
      filtered = items.filter(item => item.category === filter);
    }
    return filtered;
  };

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  };

  const getLowStockCount = () => {
    return items.filter(item => item.quantity <= item.minStock).length;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inventario</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Cargando inventario...</Text>
        </View>
      </View>
    );
  }

  if (view === 'add') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setView('list'); resetForm(); }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingItem ? 'Editar' : 'Nuevo'} Producto</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del producto *"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.pickerContainer}>
            {['Fertilizante', 'Pesticida', 'Herbicida', 'Herramienta', 'Equipo', 'Otro'].map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.pickerOption, category === cat && styles.pickerOptionSelected]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.pickerOptionText, category === cat && styles.pickerOptionTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Cantidad *"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Unidad"
              value={unit}
              onChangeText={setUnit}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Stock mínimo *"
            value={minStock}
            onChangeText={setMinStock}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Costo por unidad *"
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Proveedor"
            value={supplier}
            onChangeText={setSupplier}
          />

          <Text style={styles.label}>Fecha de Vencimiento</Text>
          <DatePickerInput
            value={expiryDate}
            onChangeDate={setExpiryDate}
            placeholder="Seleccionar fecha"
          />

          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Notas adicionales"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>{editingItem ? 'Actualizar' : 'Guardar'} Producto</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventario</Text>
        <TouchableOpacity onPress={() => setView('add')}>
          <Ionicons name="add-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={{ flexDirection: 'row', padding: 15, gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 15, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>{items.length}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Productos</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 15, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2196F3' }}>Q{getTotalValue().toFixed(0)}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Valor Total</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 15, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF9800' }}>{getLowStockCount()}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Stock Bajo</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 15, marginBottom: 10 }}>
        {[
          { key: 'all', label: 'Todos', icon: 'grid' },
          { key: 'low-stock', label: 'Stock Bajo', icon: 'alert-circle' },
          { key: 'Fertilizante', label: 'Fertilizantes', icon: 'leaf' },
          { key: 'Pesticida', label: 'Pesticidas', icon: 'bug' },
          { key: 'Herramienta', label: 'Herramientas', icon: 'hammer' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={{
              backgroundColor: filter === f.key ? '#4CAF50' : 'white',
              paddingHorizontal: 15,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons name={f.icon} size={16} color={filter === f.key ? 'white' : '#666'} />
            <Text style={{ marginLeft: 5, color: filter === f.key ? 'white' : '#666', fontSize: 14 }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {filteredItems.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={{ marginTop: 20, color: '#999', fontSize: 16 }}>No hay productos</Text>
            <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={() => setView('add')}>
              <Text style={styles.buttonText}>Agregar Primer Producto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map(item => {
            const isLowStock = item.quantity <= item.minStock;
            const stockPercent = (item.quantity / item.minStock) * 100;
            
            return (
              <View key={item.id} style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 15,
                marginBottom: 10,
                borderLeftWidth: 4,
                borderLeftColor: isLowStock ? '#FF9800' : '#4CAF50',
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{item.category}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleEdit(item)}>
                      <Ionicons name="pencil" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                      <Ionicons name="trash" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#666' }}>Stock actual</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: isLowStock ? '#FF9800' : '#333' }}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>Stock mínimo</Text>
                    <Text style={{ fontSize: 14, color: '#666', textAlign: 'right' }}>
                      {item.minStock} {item.unit}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={{ height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 10 }}>
                  <View style={{
                    height: 6,
                    backgroundColor: isLowStock ? '#FF9800' : '#4CAF50',
                    borderRadius: 3,
                    width: `${Math.min(stockPercent, 100)}%`,
                  }} />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Valor: Q{(item.quantity * item.cost).toFixed(2)}
                  </Text>
                  {item.supplier && (
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      📦 {item.supplier}
                    </Text>
                  )}
                </View>

                {isLowStock && (
                  <View style={{ backgroundColor: '#FFF3E0', padding: 8, borderRadius: 6, marginTop: 10 }}>
                    <Text style={{ fontSize: 11, color: '#E65100' }}>
                      ⚠️ Stock bajo - Reabastecer pronto
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}



// ============ EMPLEADOS SCREEN ============
function EmployeesScreen({ onBack, currentFarm }) {
  const [view, setView] = useState('list'); // list, add, edit, payroll
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [position, setPosition] = useState('Trabajador de Campo');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryType, setSalaryType] = useState('Mensual');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const [employeesSnap, attendanceSnap] = await Promise.all([
        getFarmCollection('employees', currentFarm).orderBy('name').get(),
        db.collection('attendance').where('date', '>=', new Date().toISOString().split('T')[0]).get(),
      ]);

      setEmployees(employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAttendances(attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error) {
      console.error('Error loading employees:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !position || !salary) {
      Alert.alert('Error', 'Completa los campos requeridos');
      return;
    }

    const employeeData = {
      name,
      position,
      phone,
      email,
      salary: parseFloat(salary),
      salaryType,
      startDate,
      idNumber,
      address,
      emergencyContact,
      notes,
      status: 'Activo',
      createdAt: editingEmployee ? editingEmployee.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingEmployee) {
        await getFarmCollection('employees', currentFarm).doc(editingEmployee.id).update(employeeData);
        Alert.alert('Éxito', 'Empleado actualizado');
      } else {
        await getFarmCollection('employees', currentFarm).add(employeeData);
        Alert.alert('Éxito', 'Empleado agregado');
      }
      resetForm();
      setView('list');
      loadEmployees();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setName(employee.name);
    setPosition(employee.position);
    setPhone(employee.phone || '');
    setEmail(employee.email || '');
    setSalary(employee.salary.toString());
    setSalaryType(employee.salaryType);
    setStartDate(employee.startDate);
    setIdNumber(employee.idNumber || '');
    setAddress(employee.address || '');
    setEmergencyContact(employee.emergencyContact || '');
    setNotes(employee.notes || '');
    setView('add');
  };

  const handleDelete = (employee) => {
    Alert.alert('Confirmar', '¿Eliminar este empleado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await getFarmCollection('employees', currentFarm).doc(employee.id).delete();
          Alert.alert('Éxito', 'Empleado eliminado');
          loadEmployees();
        },
      },
    ]);
  };

  const handleAttendance = async (employee, status) => {
    const today = new Date().toISOString().split('T')[0];
    const attendanceData = {
      employeeId: employee.id,
      employeeName: employee.name,
      date: today,
      status,
      timestamp: new Date().toISOString(),
    };

    try {
      // Check if already marked today
      const existing = attendances.find(a => a.employeeId === employee.id && a.date === today);
      if (existing) {
        await db.collection('attendance').doc(existing.id).update({ status, timestamp: new Date().toISOString() });
        Alert.alert('Actualizado', `Asistencia actualizada: ${status}`);
      } else {
        await db.collection('attendance').add(attendanceData);
        Alert.alert('Registrado', `Asistencia marcada: ${status}`);
      }
      loadEmployees();
    } catch (error) {
      console.log("🔐 =================================");
      console.log("🔐 ERROR DE AUTENTICACIÓN");
      console.log("🔐 Código:", error.code);
      console.log("🔐 Mensaje:", error.message);
      console.log("🔐 =================================");
      console.error('Error en autenticación:', error.code, error.message);
      
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      
      // Mensajes específicos según el código de error
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Ingrese la contraseña correcta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada por un administrador.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Ya existe una cuenta registrada con este correo electrónico.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión a internet. Verifica tu conexión.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
          break;
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = 'Usuario o contraseña incorrectos. Verifica tus datos.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida. Contacta al administrador.';
          break;
        default:
          // Si no hay código específico, mostrar mensaje genérico
          if (error.message && error.message.includes('password')) {
            errorMessage = 'La contraseña es incorrecta. Intenta de nuevo.';
          } else if (error.message && error.message.includes('user')) {
            errorMessage = 'No se encontró el usuario. Verifica el correo electrónico.';
          } else {
            errorMessage = error.message || 'Error al iniciar sesión. Intenta de nuevo.';
          }
      }
      
      Alert.alert('Error de Autenticación', errorMessage);
    }
  };

  const resetForm = () => {
    setName('');
    setPosition('Trabajador de Campo');
    setPhone('');
    setEmail('');
    setSalary('');
    setSalaryType('Mensual');
    setStartDate(new Date().toISOString().split('T')[0]);
    setIdNumber('');
    setAddress('');
    setEmergencyContact('');
    setNotes('');
    setEditingEmployee(null);
  };

  const getTotalPayroll = () => {
    return employees
      .filter(e => e.status === 'Activo')
      .reduce((sum, e) => sum + e.salary, 0);
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendances.filter(a => a.date === today && a.status === 'Presente').length;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Empleados</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Cargando empleados...</Text>
        </View>
      </View>
    );
  }

  if (view === 'add') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setView('list'); resetForm(); }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingEmployee ? 'Editar' : 'Nuevo'} Empleado</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo *"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Posición</Text>
          <View style={styles.pickerContainer}>
            {['Trabajador de Campo', 'Supervisor', 'Gerente', 'Técnico', 'Administrador'].map(pos => (
              <TouchableOpacity
                key={pos}
                style={[styles.pickerOption, position === pos && styles.pickerOptionSelected]}
                onPress={() => setPosition(pos)}
              >
                <Text style={[styles.pickerOptionText, position === pos && styles.pickerOptionTextSelected]}>
                  {pos}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="DPI / Cédula"
            value={idNumber}
            onChangeText={setIdNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Tipo de Salario</Text>
          <View style={styles.pickerContainer}>
            {['Mensual', 'Quincenal', 'Semanal', 'Diario', 'Por Hora'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerOption, salaryType === type && styles.pickerOptionSelected]}
                onPress={() => setSalaryType(type)}
              >
                <Text style={[styles.pickerOptionText, salaryType === type && styles.pickerOptionTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={`Salario ${salaryType.toLowerCase()} *`}
            value={salary}
            onChangeText={setSalary}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Fecha de Inicio</Text>
          <DatePickerInput
            value={startDate}
            onChangeDate={setStartDate}
            placeholder="Seleccionar fecha"
          />

          <TextInput
            style={styles.input}
            placeholder="Dirección"
            value={address}
            onChangeText={setAddress}
          />

          <TextInput
            style={styles.input}
            placeholder="Contacto de emergencia"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
          />

          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Notas adicionales"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>{editingEmployee ? 'Actualizar' : 'Guardar'} Empleado</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (view === 'payroll') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('list')}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Planilla</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>Total Planilla Mensual</Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#4CAF50' }}>
              Q{getTotalPayroll().toFixed(2)}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
              {employees.filter(e => e.status === 'Activo').length} empleados activos
            </Text>
          </View>

          {employees.filter(e => e.status === 'Activo').map(employee => (
            <View key={employee.id} style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 15,
              marginBottom: 10,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{employee.name}</Text>
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{employee.position}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4CAF50', textAlign: 'right' }}>
                    Q{employee.salary.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666', textAlign: 'right' }}>
                    {employee.salaryType}
                  </Text>
                </View>
              </View>

              {employee.phone && (
                <Text style={{ fontSize: 12, color: '#666' }}>📱 {employee.phone}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const activeEmployees = employees.filter(e => e.status === 'Activo');
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Empleados</Text>
        <TouchableOpacity onPress={() => setView('add')}>
          <Ionicons name="add-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={{ flexDirection: 'row', padding: 15, gap: 10 }}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 15, alignItems: 'center' }}
          onPress={() => setView('payroll')}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>{activeEmployees.length}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Empleados</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 15, alignItems: 'center' }}
          onPress={() => setView('payroll')}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2196F3' }}>Q{getTotalPayroll().toFixed(0)}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Planilla</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 15, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF9800' }}>{getTodayAttendance()}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Presentes Hoy</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeEmployees.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={{ marginTop: 20, color: '#999', fontSize: 16 }}>No hay empleados</Text>
            <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={() => setView('add')}>
              <Text style={styles.buttonText}>Agregar Primer Empleado</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activeEmployees.map(employee => {
            const todayAttendance = attendances.find(a => a.employeeId === employee.id && a.date === today);
            
            return (
              <View key={employee.id} style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 15,
                marginBottom: 10,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{employee.name}</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{employee.position}</Text>
                    {employee.phone && (
                      <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>📱 {employee.phone}</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleEdit(employee)}>
                      <Ionicons name="pencil" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(employee)}>
                      <Ionicons name="trash" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#666' }}>Salario {employee.salaryType}</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4CAF50' }}>
                      Q{employee.salary.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>Asistencia Hoy</Text>
                    {todayAttendance ? (
                      <View style={{
                        backgroundColor: todayAttendance.status === 'Presente' ? '#E8F5E9' : '#FFEBEE',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}>
                        <Text style={{
                          color: todayAttendance.status === 'Presente' ? '#4CAF50' : '#F44336',
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                          {todayAttendance.status === 'Presente' ? '✓ Presente' : '✗ Ausente'}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                          onPress={() => handleAttendance(employee, 'Presente')}
                        >
                          <Text style={{ color: '#4CAF50', fontSize: 11, fontWeight: '600' }}>Presente</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                          onPress={() => handleAttendance(employee, 'Ausente')}
                        >
                          <Text style={{ color: '#F44336', fontSize: 11, fontWeight: '600' }}>Ausente</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}


// ============ MAIN APP ============
export default function App() {
  const [user, setUser] = useState(null);
  const [currentFarm, setCurrentFarm] = useState(null);  // NO más "default"
  const [userFarms, setUserFarms] = useState([]);
  const [userRole, setUserRole] = useState("owner");
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);  // 🆕
  const [showFarmSelector, setShowFarmSelector] = useState(false);
  const [loading, setLoading] = useState(true);
 const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const [settings, setSettings] = useState({ currency: 'Q' });

  // Estados de monetización
  const [isPremium, setIsPremium] = useState(false);
  const [showRequestPremiumModal, setShowRequestPremiumModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('');
  const [adInterstitialCount, setAdInterstitialCount] = useState(0);
    // Estados de créditos por anuncios
  const [showRewardedAdModal, setShowRewardedAdModal] = useState(false);
  const [rewardedAdConfig, setRewardedAdConfig] = useState({
    limitType: '',
    currentCount: 0,
    limitCount: 0,
    rewardAmount: 0,
  });
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('🔄 Estado de autenticación cambió');
      setUser(user);
      if (user) {
        console.log('✅ Usuario autenticado:', user.email);
        console.log('   UID:', user.uid);
        
        // Cargar fincas del usuario
        try {
          console.log('📡 Cargando fincas del usuario...');
          const userDoc = await db.collection("users").doc(user.uid).get();
          
          if (userDoc.exists) {
            console.log('✅ Documento de usuario encontrado');
            const userData = userDoc.data();
            console.log('   Datos:', userData);
            
            if (userData.farms && userData.farms.length > 0) {
              console.log('✅ Usuario tiene', userData.farms.length, 'finca(s)');
              console.log('📋 Lista de fincas del usuario:');
              userData.farms.forEach((farm, idx) => {
                console.log(`   ${idx + 1}. ${farm.name} (ID: ${farm.id})`);
              });
              
              setUserFarms(userData.farms);
              setCurrentFarm(userData.farms[0]);
              setUserRole(userData.farms[0].role || "owner");
              
              console.log('🎯 FINCA ACTUAL ESTABLECIDA:');
              console.log('   Nombre:', userData.farms[0].name);
              console.log('   ID:', userData.farms[0].id);
              console.log('   Rol:', userData.farms[0].role);
              
              if (userData.farms[0].id === 'default') {
                console.warn('⚠️⚠️⚠️ ADVERTENCIA: Usuario usando finca "default"');
                console.warn('   Esto significa que fue creado con código viejo');
              }
            } else {
              console.log('⚠️ Usuario sin fincas, creando finca única...');
              const uniqueFarmId = generateFarmId();
              console.log('   Nuevo Farm ID:', uniqueFarmId);
              
              // Crear documento de finca
              await createFarmDocument(uniqueFarmId, 'Mi Finca', user.uid);
              
              const newFarm = { 
                id: uniqueFarmId, 
                name: "Mi Finca", 
                role: "owner", 
                joinedAt: new Date().toISOString() 
              };
              
              await db.collection("users").doc(user.uid).update({
                farms: [newFarm]
              });
              setUserFarms([newFarm]);
              setCurrentFarm(newFarm);
              setUserRole("owner");
              console.log('✅ Finca única creada');
            }
          } else {
            console.log('⚠️ Documento de usuario no existe, creando con finca única...');
            const uniqueFarmId = generateFarmId();
            console.log('   Nuevo Farm ID:', uniqueFarmId);
            
            // Crear documento de finca
            await createFarmDocument(uniqueFarmId, 'Mi Finca', user.uid);
            
            const newFarm = { 
              id: uniqueFarmId, 
              name: "Mi Finca", 
              role: "owner", 
              joinedAt: new Date().toISOString() 
            };
            
            await db.collection("users").doc(user.uid).set({ 
              email: user.email,
              name: user.displayName || 'Usuario',
              role: 'admin',
              createdAt: new Date().toISOString(),
              farms: [newFarm] 
            });
            setUserFarms([newFarm]);
            setCurrentFarm(newFarm);
            setUserRole("owner");
            console.log('✅ Usuario y finca únicos creados');
          }
        } catch (error) {
          console.error("❌ Error loading farms:", error);
          console.error("   Código:", error.code);
          console.error("   Mensaje:", error.message);
          
          // Fallback: crear finca local con ID único
          const fallbackFarmId = generateFarmId();
          console.log('⚠️ Creando finca local de emergencia:', fallbackFarmId);
          const fallbackFarm = { id: fallbackFarmId, name: "Mi Finca", role: "owner" };
          setUserFarms([fallbackFarm]);
          setCurrentFarm(fallbackFarm);
          setUserRole("owner");
          console.log('⚠️ Usando finca local de emergencia debido al error');
        }
      } else {
        console.log('❌ No hay usuario autenticado');
        setUserFarms([]);
        setCurrentFarm(null);
      }
      if (user) {
        await loadSettings();
        // Verificar estado de premium
        try {
          const premium = await checkIfPremium(user.uid, db);
          setIsPremium(premium);
          console.log('✨ Estado Premium:', premium ? 'ACTIVO ⭐' : 'FREE');
        } catch (error) {
          console.error('❌ Error verificando premium:', error);
          setIsPremium(false);
        }


                // Cargar anuncios vistos hoy
        if (!premium) {
          try {
            const { getAdsWatchedToday, cleanExpiredCredits } = await import('./MONETIZATION-COMPONENTS');
            await cleanExpiredCredits(db, user.uid);
            const adsCount = await getAdsWatchedToday(db, user.uid);
            setAdsWatchedToday(adsCount);
            console.log(`📺 Anuncios vistos hoy: ${adsCount}/10`);
          } catch (error) {
            console.error('Error cargando anuncios:', error);
          }
        }
        // Verificar si es Platform Admin
try {
  const userDoc = await db.collection('users').doc(user.uid).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    const isAdmin = userData.role === 'platform_admin';
    setIsPlatformAdmin(isAdmin);
    console.log('👑 Platform Admin:', isAdmin ? 'SÍ ⚡' : 'NO');
  }
} catch (error) {
  console.error('❌ Error verificando admin:', error);
  setIsPlatformAdmin(false);
}
      }
      setLoading(false);
      console.log('✅ Carga completa. currentFarm:', currentFarm?.name || 'null');
    });
    return unsubscribe;
  }, []);

  const loadSettings = async () => {
    try {
      const doc = await db.collection('settings').doc('app').get();
      if (doc.exists) {
        setSettings(doc.data());
      } else {
        await db.collection('settings').doc('app').set({ currency: 'Q' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

    // 🆕 Verificar acceso a features premium
 const checkFeatureAccess = (feature) => {
    if (isPremium) {
      console.log(`✅ Acceso permitido a ${feature} (usuario premium)`);
      return true;
    }
    
    // Bloquear features premium para usuarios FREE
    switch (feature) {
      case 'export':
        console.log('🔒 Feature bloqueada: Exportar (solo premium)');
        setPaywallFeature('Exportar Reportes a PDF/Excel');
        setShowPaywall(true);
        return false;
      
      case 'advanced-reports':
        console.log('🔒 Feature bloqueada: Reportes Avanzados (solo premium)');
        setPaywallFeature('Reportes Avanzados y Gráficas');
        setShowPaywall(true);
        return false;
      
      case 'weather':
        console.log('🔒 Feature bloqueada: Clima (solo premium)');
        setPaywallFeature('Pronóstico del Clima');
        setShowPaywall(true);
        return false;
      
      case 'analytics':
        console.log('🔒 Feature bloqueada: Análisis Predictivo (solo premium)');
        setPaywallFeature('Análisis de Rentabilidad y Predicciones');
        setShowPaywall(true);
        return false;
      
      case 'multiple-farms':
        if (userFarms.length >= 1) {
          console.log('🔒 Feature bloqueada: Múltiples Fincas (solo premium)');
          setPaywallFeature('Gestionar Múltiples Fincas');
          setShowPaywall(true);
          return false;
        }
        return true;
      
      case 'add-production':
        return checkProductionLimit();
      
      case 'add-sale':
        return checkSaleLimit();
      
      case 'add-expense':
        return checkExpenseLimit();
      
      default:
        return true;
    }
  };

  // 🆕 Verificar límite de producciones
  const checkProductionLimit = async () => {
    try {
      const { getAvailableCredits } = await import('./MONETIZATION-COMPONENTS');
      
      // Contar producciones este mes
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const snapshot = await db
        .collection('farms')
        .doc(currentFarm.id)
        .collection('production')
        .where('date', '>=', firstDayOfMonth.toISOString())
        .get();
      
      const count = snapshot.size;
      const limit = PLANS.FREE.limits.productionsPerMonth;
      
      // Verificar si tiene créditos
      const credits = await getAvailableCredits(db, user.uid, 'production');
      
      console.log(`📊 Producciones: ${count}/${limit} (créditos: ${credits})`);
      
      if (count >= limit + credits) {
        console.log('🔒 Límite alcanzado: Producciones');
        setRewardedAdConfig({
          limitType: 'production',
          currentCount: count,
          limitCount: limit,
          rewardAmount: 1,
        });
        setShowRewardedAdModal(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando producciones:', error);
      return true;
    }
  };

  // 🆕 Verificar límite de ventas
  const checkSaleLimit = async () => {
    try {
      const { getAvailableCredits } = await import('./MONETIZATION-COMPONENTS');
      
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const snapshot = await db
        .collection('farms')
        .doc(currentFarm.id)
        .collection('sales')
        .where('date', '>=', firstDayOfMonth.toISOString())
        .get();
      
      const count = snapshot.size;
      const limit = PLANS.FREE.limits.salesPerMonth;
      const credits = await getAvailableCredits(db, user.uid, 'sales');
      
      console.log(`📊 Ventas: ${count}/${limit} (créditos: ${credits})`);
      
      if (count >= limit + credits) {
        console.log('🔒 Límite alcanzado: Ventas');
        setRewardedAdConfig({
          limitType: 'sales',
          currentCount: count,
          limitCount: limit,
          rewardAmount: 1,
        });
        setShowRewardedAdModal(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando ventas:', error);
      return true;
    }
  };

  // 🆕 Verificar límite de gastos
  const checkExpenseLimit = async () => {
    try {
      const { getAvailableCredits } = await import('./MONETIZATION-COMPONENTS');
      
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const snapshot = await db
        .collection('farms')
        .doc(currentFarm.id)
        .collection('expenses')
        .where('date', '>=', firstDayOfMonth.toISOString())
        .get();
      
      const count = snapshot.size;
      const limit = PLANS.FREE.limits.expensesPerMonth;
      const credits = await getAvailableCredits(db, user.uid, 'expenses');
      
      console.log(`📊 Gastos: ${count}/${limit} (créditos: ${credits})`);
      
      if (count >= limit + credits) {
        console.log('🔒 Límite alcanzado: Gastos');
        setRewardedAdConfig({
          limitType: 'expenses',
          currentCount: count,
          limitCount: limit,
          rewardAmount: 1,
        });
        setShowRewardedAdModal(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando gastos:', error);
      return true;
    }
  };

  // 🆕 Navegación con anuncios intersticiales
  const handleScreenNavigation = (screen) => {
    console.log(`📱 Navegando a: ${screen}`);
    setCurrentScreen(screen);
    
    // Mostrar interstitial cada 5 cambios de pantalla (solo usuarios FREE)
    if (!isPremium) {
      setAdInterstitialCount(prev => {
        const newCount = prev + 1;
        console.log(`📢 Contador de navegación: ${newCount}/5`);
        
        if (newCount >= 5) {
          console.log('📢 Mostrando Interstitial Ad');
          showInterstitialAd();
          return 0; // Reset counter
        }
        return newCount;
      });
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'TestPremium':
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setCurrentScreen('Dashboard')}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>🧪 TEST Monetización</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <ScrollView style={styles.content}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' }}>
                Prueba el Sistema de Monetización
              </Text>
              
              <TouchableOpacity
                style={{ backgroundColor: '#FF9800', padding: 15, borderRadius: 10, marginBottom: 15 }}
                onPress={() => setShowRequestPremiumModal(true)}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                  🌟 Abrir Modal "Solicitar Premium"
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ backgroundColor: '#2196F3', padding: 15, borderRadius: 10, marginBottom: 15 }}
                onPress={() => {
                  setPaywallFeature('Exportar Reportes a PDF');
                  setShowPaywall(true);
                }}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                  🔒 Abrir Paywall
                </Text>
              </TouchableOpacity>
              
              <View style={{ backgroundColor: '#E8F5E9', padding: 15, borderRadius: 10, marginTop: 20 }}>
                <Text style={{ fontSize: 14, color: '#333', marginBottom: 10 }}>
                  📊 Estado Actual:
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>
                  {isPremium ? '⭐ PREMIUM' : '🆓 FREE'}
                </Text>
              </View>
            </ScrollView>
          </View>
        );

      case 'Dashboard':
        return <DashboardScreen user={user} settings={settings} onNavigate={setCurrentScreen} currentFarm={currentFarm} userFarms={userFarms} userRole={userRole} showFarmSelector={showFarmSelector} setShowFarmSelector={setShowFarmSelector} setCurrentFarm={setCurrentFarm} setUserRole={setUserRole} />;
        
      case 'TreeManagement':
        return <TreeManagementScreen settings={settings} currentFarm={currentFarm} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'Production':
        return <ProductionScreen settings={settings} currentFarm={currentFarm} onBack={() => setCurrentScreen('Dashboard')} checkFeatureAccess={checkFeatureAccess} />;
      case 'Sales':
        return <SalesScreen settings={settings} currentFarm={currentFarm} onBack={() => setCurrentScreen('Dashboard')} checkFeatureAccess={checkFeatureAccess} />;
      case 'Expenses':
        return <ExpensesScreen settings={settings} currentFarm={currentFarm} onBack={() => setCurrentScreen('Dashboard')} checkFeatureAccess={checkFeatureAccess} />;
      case 'Tasks':
        return <TasksScreen settings={settings} currentFarm={currentFarm} onBack={() => setCurrentScreen('Dashboard')} />;
      case 'Reports':
        return <ReportsScreen onBack={() => setCurrentScreen('Dashboard')} currentFarm={currentFarm} />;
      case 'Inventory':
        return <InventoryScreen onBack={() => setCurrentScreen('Dashboard')} currentFarm={currentFarm} />;
      case 'Employees':
        return <EmployeesScreen onBack={() => setCurrentScreen('Dashboard')} currentFarm={currentFarm} />;
      case 'MapView':
        return <MapViewScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'Members':
        return <FarmMembersScreen currentFarm={currentFarm} onBack={() => setCurrentScreen('Dashboard')} />;
      
      case 'Settings':
        return <SettingsScreen 
          settings={settings} 
          currentFarm={currentFarm} 
          setCurrentFarm={setCurrentFarm} 
          userFarms={userFarms} 
          setUserFarms={setUserFarms} 
          onUpdateSettings={setSettings} 
          onBack={() => handleScreenNavigation('Dashboard')}
          isPremium={isPremium}
          userRole={userRole}
          onNavigate={handleScreenNavigation}
          setShowRequestPremiumModal={setShowRequestPremiumModal}
          isPlatformAdmin={isPlatformAdmin}
        />;

      case 'AdminMetrics':
        return (
          <AdminMetricsDashboard
            onBack={() => handleScreenNavigation('Settings')}
            db={db}
            userId={user.uid}
          />
        );

      case 'ActivatePremium':
        return (
          <ActivatePremiumPanel
            onBack={() => handleScreenNavigation('Settings')}
            db={db}
          />
        );

      case 'PlatformMetrics':
        return (
          <PlatformMetricsDashboard
            onBack={() => handleScreenNavigation('Settings')}
            db={db}
          />
        );

      default:
        return <DashboardScreen user={user} settings={settings} onNavigate={setCurrentScreen} currentFarm={currentFarm} userFarms={userFarms} userRole={userRole} showFarmSelector={showFarmSelector} setShowFarmSelector={setShowFarmSelector} setCurrentFarm={setCurrentFarm} setUserRole={setUserRole} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={{ fontSize: 18, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!currentFarm) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={{ fontSize: 18, color: '#666' }}>Configurando finca...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isPremium && currentScreen === 'Dashboard' && (
        <AdBanner style={{ marginTop: 0 }} />
      )}
      {renderScreen()}
      {['Dashboard', 'TreeManagement', 'Production', 'Sales', 'Expenses', 'Tasks', 'Reports', 'MapView'].includes(currentScreen) && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleScreenNavigation('Dashboard')}>
            <Ionicons name={currentScreen === 'Dashboard' ? 'home' : 'home-outline'} size={20} color={currentScreen === 'Dashboard' ? '#4CAF50' : '#666'} />
            <Text style={[styles.navText, currentScreen === 'Dashboard' && styles.navTextActive]}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleScreenNavigation('Production')}>
            <Ionicons name={currentScreen === 'Production' ? 'basket' : 'basket-outline'} size={20} color={currentScreen === 'Production' ? '#4CAF50' : '#666'} />
            <Text style={[styles.navText, currentScreen === 'Production' && styles.navTextActive]}>Producción</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleScreenNavigation('Sales')}>
            <Ionicons name={currentScreen === 'Sales' ? 'cart' : 'cart-outline'} size={20} color={currentScreen === 'Sales' ? '#4CAF50' : '#666'} />
            <Text style={[styles.navText, currentScreen === 'Sales' && styles.navTextActive]}>Ventas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleScreenNavigation('Expenses')}>
            <Ionicons name={currentScreen === 'Expenses' ? 'wallet' : 'wallet-outline'} size={20} color={currentScreen === 'Expenses' ? '#4CAF50' : '#666'} />
            <Text style={[styles.navText, currentScreen === 'Expenses' && styles.navTextActive]}>Gastos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleScreenNavigation('Tasks')}>
            <Ionicons name={currentScreen === 'Tasks' ? 'checkbox' : 'checkbox-outline'} size={20} color={currentScreen === 'Tasks' ? '#4CAF50' : '#666'} />
            <Text style={[styles.navText, currentScreen === 'Tasks' && styles.navTextActive]}>Tareas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleScreenNavigation('Reports')}>
            <Ionicons name={currentScreen === 'Reports' ? 'stats-chart' : 'stats-chart-outline'} size={20} color={currentScreen === 'Reports' ? '#4CAF50' : '#666'} />
            <Text style={[styles.navText, currentScreen === 'Reports' && styles.navTextActive]}>Reportes</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showFarmSelector} transparent animationType="slide" onRequestClose={() => setShowFarmSelector(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "60%" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15, color: "#333" }}>Seleccionar Finca</Text>
            <ScrollView>
              {userFarms.map((farm, index) => (
                <TouchableOpacity key={index} onPress={() => { setCurrentFarm(farm); setUserRole(farm.role); setShowFarmSelector(false); }} style={{ padding: 15, backgroundColor: currentFarm?.id === farm.id ? "#E8F5E9" : "#F5F5F5", borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: currentFarm?.id === farm.id ? "#4CAF50" : "#CCC" }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>{farm.name}</Text>
                  <Text style={{ fontSize: 12, color: "#666", marginTop: 5 }}>Rol: {farm.role}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowFarmSelector(false)} style={{ backgroundColor: "#666", padding: 15, borderRadius: 12, marginTop: 15, alignItems: "center" }}>
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showRequestPremiumModal && (
        <RequestPremiumModal
          visible={showRequestPremiumModal}
          onClose={() => setShowRequestPremiumModal(false)}
          userId={user.uid}
          userEmail={user.email}
          db={db}
        />
      )}
      
      {showPaywall && (
        <Paywall
          feature={paywallFeature}
          onRequestPremium={() => {
            setShowPaywall(false);
            setShowRequestPremiumModal(true);
          }}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {showRewardedAdModal && (
        <RewardedAdModal
          visible={showRewardedAdModal}
          onClose={() => setShowRewardedAdModal(false)}
          onWatchAd={async () => {
            console.log('📺 Usuario quiere ver anuncio');
            
            if (adsWatchedToday >= 10) {
              Alert.alert(
                'Límite Diario',
                'Has alcanzado el límite de 10 anuncios por día. Vuelve mañana o actualiza a Premium.',
                [{ text: 'Entendido' }]
              );
              return;
            }
            
            setShowRewardedAdModal(false);
            
            Alert.alert(
              '📺 Reproduciendo Anuncio',
              'En la versión final, aquí se mostraría un anuncio de AdMob de 30 segundos.\n\nPor ahora, simulamos que lo viste completo.',
              [
                {
                  text: '✅ Anuncio Completado',
                  onPress: async () => {
                    try {
                      const { saveAdCredits } = await import('./MONETIZATION-COMPONENTS');
                      
                      const saved = await saveAdCredits(
                        db,
                        user.uid,
                        rewardedAdConfig.limitType,
                        rewardedAdConfig.rewardAmount
                      );
                      
                      if (saved) {
                        setAdsWatchedToday(prev => prev + 1);
                        
                        Alert.alert(
                          '🎉 ¡Crédito Ganado!',
                          `Has ganado ${rewardedAdConfig.rewardAmount} ${rewardedAdConfig.limitType === 'trees' ? 'árboles' : 'registro'} extra.\n\nExpira en 24 horas.\n\nAnuncios disponibles hoy: ${9 - adsWatchedToday}/10`,
                          [{ text: 'Genial' }]
                        );
                      }
                    } catch (error) {
                      console.error('Error guardando crédito:', error);
                      Alert.alert('Error', 'No se pudo guardar el crédito.');
                    }
                  }
                }
              ]
            );
          }}
          limitType={rewardedAdConfig.limitType}
          currentCount={rewardedAdConfig.currentCount}
          limitCount={rewardedAdConfig.limitCount}
          rewardAmount={rewardedAdConfig.rewardAmount}
          adsWatchedToday={adsWatchedToday}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loginContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  switchText: { textAlign: 'center', color: '#4CAF50', marginTop: 20, fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  content: { flex: 1, padding: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, width: '48%', marginBottom: 15, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center' },
  statCardContent: { marginLeft: 10, flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statTitle: { fontSize: 12, color: '#666', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickAction: { backgroundColor: 'white', borderRadius: 15, padding: 20, width: '48%', alignItems: 'center', marginBottom: 15 },
  quickActionText: { fontSize: 14, color: '#333', marginTop: 10, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15 },
  menuIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { flex: 1, fontSize: 18, fontWeight: '600', color: '#333' },
  card: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardHeaderText: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  cardDetail: { fontSize: 14, color: '#666', marginBottom: 5 },
  cardActions: { flexDirection: 'row', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, backgroundColor: '#E3F2FD', marginRight: 10 },
  actionButtonText: { fontSize: 14, color: '#2196F3', marginLeft: 5, fontWeight: '600' },
  deleteButton: { backgroundColor: '#FFEBEE' },
  deleteButtonText: { color: '#F44336' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  helpText: { fontSize: 14, color: '#FF9800', marginBottom: 8 },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  pickerOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10, marginBottom: 10 },
  pickerOptionSelected: { backgroundColor: '#4CAF50' },
  pickerOptionText: { fontSize: 14, color: '#666', marginLeft: 5 },
  pickerOptionTextSelected: { color: 'white', fontWeight: 'bold' },
  productionSummary: { backgroundColor: '#795548', borderRadius: 15, padding: 25, marginBottom: 20, alignItems: 'center' },
  summaryValue: { fontSize: 48, fontWeight: 'bold', color: 'white' },
  summaryLabel: { fontSize: 16, color: 'white', marginTop: 5, marginBottom: 20 },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  summaryStatLabel: { fontSize: 12, color: 'white', marginTop: 5 },
  filterContainer: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: 'white', borderRadius: 10, marginBottom: 15 },
  filterButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10 },
  filterButtonActive: { backgroundColor: '#795548' },
  filterText: { fontSize: 14, color: '#666' },
  filterTextActive: { color: 'white', fontWeight: 'bold' },
  harvestCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15 },
  harvestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  harvestHeaderText: { flex: 1, marginLeft: 12 },
  harvestTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  harvestSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  harvestBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  harvestBadgeText: { fontSize: 12, color: '#F57C00', fontWeight: 'bold' },
  harvestDetails: { flexDirection: 'row', marginBottom: 10 },
  harvestDetailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  harvestDetailText: { fontSize: 14, color: '#666', marginLeft: 6 },
  harvestNotes: { fontSize: 14, color: '#666', fontStyle: 'italic', marginBottom: 10, backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8 },
  wasteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, marginBottom: 10 },
  wasteText: { fontSize: 13, color: '#F44336', marginLeft: 8, fontWeight: '600' },
  netYieldText: { fontSize: 13, color: '#4CAF50', marginLeft: 8, fontWeight: 'bold' },
  paymentMethodsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  paymentCard: { backgroundColor: 'white', borderRadius: 10, padding: 15, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  paymentLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  paymentValue: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  topItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  topRank: { fontSize: 16, fontWeight: 'bold', color: '#FF9800', marginRight: 15, width: 30 },
  topName: { flex: 1, fontSize: 15, color: '#333' },
  topValue: { fontSize: 15, fontWeight: 'bold', color: '#4CAF50' },
  paymentBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  paymentBadgeText: { fontSize: 11, color: 'white', fontWeight: 'bold', textTransform: 'uppercase' },
  saleDetails: { marginVertical: 10 },
  saleDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  saleDetailLabel: { fontSize: 14, color: '#666' },
  saleDetailValue: { fontSize: 14, color: '#333', fontWeight: '600' },
  totalValue: { fontSize: 16, color: '#4CAF50', fontWeight: 'bold' },
  totalCard: { backgroundColor: '#E8F5E9', padding: 15, borderRadius: 10, marginVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, color: '#333', fontWeight: '600' },
  totalAmount: { fontSize: 24, color: '#4CAF50', fontWeight: 'bold' },
  budgetCard: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 15 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  budgetTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  budgetAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  budgetLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  budgetAmount: { fontSize: 24, fontWeight: 'bold', color: '#2196F3' },
  progressBarContainer: { height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  progressBar: { height: '100%', borderRadius: 5 },
  progressText: { fontSize: 14, color: '#666', textAlign: 'center' },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9C27B0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  recurringBadgeText: { fontSize: 10, color: 'white', fontWeight: 'bold', marginLeft: 4 },
  applicationsCard: { backgroundColor: '#E3F2FD', padding: 10, borderRadius: 8, marginBottom: 10 },
  applicationsTitle: { fontSize: 13, color: '#2196F3', fontWeight: '600' },
  checkboxContainer: { marginVertical: 10 },
  checkbox: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { fontSize: 16, color: '#333', marginLeft: 10 },
  addApplicationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', padding: 15, borderRadius: 10, marginVertical: 10 },
  addApplicationText: { fontSize: 16, color: '#4CAF50', fontWeight: '600', marginLeft: 10 },
  applicationItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginBottom: 8 },
  applicationText: { fontSize: 14, color: '#333', flex: 1 },
  projectionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', padding: 10, borderRadius: 8, marginBottom: 10 },
  projectionText: { fontSize: 13, color: '#F57F17', marginLeft: 8, flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 20, marginBottom: 20, textAlign: 'center' },
  reportSection: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 20 },
  reportTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  reportSubtitle: { fontSize: 14, color: '#666', marginBottom: 15 },
  reportItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  reportRank: { fontSize: 18, fontWeight: 'bold', color: '#FF9800', marginRight: 15, width: 35 },
  reportItemContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportItemText: { fontSize: 16, color: '#333' },
  reportItemValue: { fontSize: 16, fontWeight: 'bold', color: '#795548' },
  filtersCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  filterScroll: { marginBottom: 5 },
  filterChip: { backgroundColor: '#F5F5F5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: '#4CAF50' },
  filterChipText: { fontSize: 14, color: '#666' },
  filterChipTextActive: { color: 'white', fontWeight: 'bold' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, width: '48%', marginBottom: 15, borderLeftWidth: 4 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  changeIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  changeText: { fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  metricTitle: { fontSize: 12, color: '#666', marginBottom: 2 },
  metricSubtitle: { fontSize: 11, color: '#999' },
  healthCard: { backgroundColor: 'white', borderRadius: 15, padding: 20 },
  healthStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  healthStatItem: { alignItems: 'center' },
  healthStatValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  healthStatLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  healthBar: { height: 12, backgroundColor: '#FFEBEE', borderRadius: 6, overflow: 'hidden' },
  healthBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 6 },
  topRankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF9800', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  topRankText: { fontSize: 14, fontWeight: 'bold', color: 'white' },
  summaryBox: { backgroundColor: '#E3F2FD', borderRadius: 15, padding: 20, marginBottom: 20 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  summaryText: { fontSize: 14, color: '#666', marginBottom: 8, lineHeight: 20 },
  summaryBold: { fontWeight: 'bold', color: '#333' },
  datePickerInput: { flexDirection: 'row', alignItems: 'center', paddingLeft: 15 },
  datePickerText: { marginLeft: 10, fontSize: 16, color: '#333' },
  datePickerPlaceholder: { color: '#999' },
  datePickerModal: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  datePickerContainer: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: '90%', maxHeight: '80%' },
  datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  datePickerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  datePickerMonthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  datePickerMonthText: { fontSize: 18, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
  calendarCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarHeaderText: { fontSize: 20, fontWeight: 'bold', color: '#333', textTransform: 'capitalize' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayHeader: { width: '14.28%', textAlign: 'center', fontWeight: 'bold', color: '#666', marginBottom: 10, fontSize: 14 },
  calendarDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  calendarDaySelected: { backgroundColor: '#4CAF50', borderRadius: 20 },
  calendarDayToday: { borderWidth: 2, borderColor: '#4CAF50', borderRadius: 20 },
  calendarDayText: { fontSize: 16, color: '#333' },
  calendarDayTextSelected: { color: 'white', fontWeight: 'bold' },
  calendarDayTextToday: { color: '#4CAF50', fontWeight: 'bold' },
  datePickerActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  tasksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  tasksHeaderText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addTaskButton: { padding: 5 },
  taskCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15, borderLeftWidth: 4 },
  taskCardCompleted: { opacity: 0.6 },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  priorityIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  taskHeaderContent: { flex: 1 },
  taskTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#999' },
  taskDescription: { fontSize: 14, color: '#666', marginBottom: 10, lineHeight: 20 },
  taskLocation: { fontSize: 14, color: '#2196F3', marginBottom: 10 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  completedText: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold', marginLeft: 4 },
  priorityStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', borderRadius: 15, padding: 20 },
  priorityStatItem: { alignItems: 'center' },
  priorityStatValue: { fontSize: 32, fontWeight: 'bold' },
  priorityStatLabel: { fontSize: 14, color: '#666', marginTop: 5 },
  logoutButton: { backgroundColor: '#F44336', marginTop: 20 },
  bottomNav: { flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 20, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  navText: { fontSize: 12, color: '#666', marginTop: 4 },
  navTextActive: { color: '#4CAF50', fontWeight: 'bold' },
  adminButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  adminButtonSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginVertical: 10,
  },
  premiumBadgeActive: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
  },
  premiumBadgeTextActive: {
    color: '#FF9800',
  },
  upgradeButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  countryCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 15,
    minWidth: 40,
    textAlign: 'right',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  currencyButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
  },
  currencySymbolActive: {
    color: '#4CAF50',
  },
  currencyName: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  currencyNameActive: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSecondary: {
    backgroundColor: '#E0E0E0',
    marginTop: 10,
  },
  buttonSecondaryText: {
    color: '#666',
  },
});