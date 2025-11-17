/**
 * ========================================
 * SISTEMA DE MONETIZACIÓN - COMPONENTES
 * ========================================
 * 
 * INCLUYE:
 * ✅ Constantes de planes (FREE, PREMIUM)
 * ✅ Componentes de AdMob (Banners, Interstitials, Rewarded)
 * ✅ Modal "Solicitar Premium"
 * ✅ Paywall Component
 * ✅ Admin Dashboard de Métricas
 * ✅ Sistema de Activación Manual
 * 
 * USO:
 * Importa estos componentes en tu APP-MULTIFINCA-CON-ESTRUCTURA.js
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ========================================
// CONSTANTES DE PLANES
// ========================================

export const PLANS = {
  FREE: {
    name: 'Plan Gratuito',
    price: 0,
    limits: {
      farms: 1,
      trees: 20,              // 🆕 Reducido de 50 a 20
      workers: 1,             // 🆕 Nuevo límite
      managers: 1,            // 🆕 Nuevo límite
      productionsPerMonth: 3, // 🆕 Nuevo límite
      salesPerMonth: 5,       // 🆕 Nuevo límite
      expensesPerMonth: 10,   // 🆕 Nuevo límite
    },
    features: [
      '1 finca',
      '20 árboles máximo',
      '1 worker',
      '1 manager',
      '3 producciones/mes',
      '5 ventas/mes',
      '10 gastos/mes',
      'Reportes básicos',
      'Con anuncios',
    ]
  },
  PREMIUM: {
    name: 'Plan Premium',
    price: 9.99,
    limits: {
      farms: Infinity,
      trees: Infinity,
      workers: Infinity,
      managers: Infinity,
      productionsPerMonth: Infinity,
      salesPerMonth: Infinity,
      expensesPerMonth: Infinity,
    },
    features: [
      'Fincas ilimitadas',
      'Árboles ilimitados',
      'Workers ilimitados',
      'Managers ilimitados',
      'Registros ilimitados',
      'Reportes avanzados y gráficas',
      'Exportar a Excel/PDF',
      'Pronóstico del clima',
      'Análisis de rentabilidad',
      'Predicción de cosechas',
      'Soporte prioritario',
      'Sin anuncios',
    ]
  }
};


// ============================================
// SISTEMA DE CRÉDITOS POR ANUNCIOS RECOMPENSADOS
// ============================================

// Guardar créditos ganados
export const saveAdCredits = async (db, userId, creditType, amount) => {
  try {
    const userDoc = db.collection('users').doc(userId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
    
    await userDoc.collection('ad_credits').add({
      type: creditType, // 'production', 'sales', 'expenses', 'trees'
      amount: amount,
      earnedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
    });
    
    console.log(`💰 Crédito ganado: +${amount} ${creditType} (expira en 24hrs)`);
    return true;
  } catch (error) {
    console.error('Error guardando créditos:', error);
    return false;
  }
};

// Obtener créditos disponibles
export const getAvailableCredits = async (db, userId, creditType) => {
  try {
    const now = new Date();
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('ad_credits')
      .where('type', '==', creditType)
      .where('used', '==', false)
      .where('expiresAt', '>', now.toISOString())
      .get();
    
    let totalCredits = 0;
    snapshot.forEach(doc => {
      totalCredits += doc.data().amount || 0;
    });
    
    console.log(`💳 Créditos disponibles de ${creditType}: ${totalCredits}`);
    return totalCredits;
  } catch (error) {
    console.error('Error obteniendo créditos:', error);
    return 0;
  }
};

// Usar un crédito
export const useAdCredit = async (db, userId, creditType, amount = 1) => {
  try {
    const now = new Date();
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('ad_credits')
      .where('type', '==', creditType)
      .where('used', '==', false)
      .where('expiresAt', '>', now.toISOString())
      .orderBy('earnedAt', 'asc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No hay créditos disponibles');
      return false;
    }
    
    const creditDoc = snapshot.docs[0];
    const creditData = creditDoc.data();
    
    if (creditData.amount >= amount) {
      if (creditData.amount === amount) {
        // Marcar como usado
        await creditDoc.ref.update({ used: true });
      } else {
        // Reducir cantidad
        await creditDoc.ref.update({ amount: creditData.amount - amount });
      }
      console.log(`✅ Crédito usado: -${amount} ${creditType}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error usando crédito:', error);
    return false;
  }
};

// Contar anuncios vistos hoy
export const getAdsWatchedToday = async (db, userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('ad_credits')
      .where('earnedAt', '>=', today.toISOString())
      .get();
    
    const count = snapshot.size;
    console.log(`📺 Anuncios vistos hoy: ${count}/10`);
    return count;
  } catch (error) {
    console.error('Error contando anuncios:', error);
    return 0;
  }
};

// Limpiar créditos expirados
export const cleanExpiredCredits = async (db, userId) => {
  try {
    const now = new Date();
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('ad_credits')
      .where('expiresAt', '<', now.toISOString())
      .get();
    
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`🗑️ ${snapshot.size} créditos expirados eliminados`);
  } catch (error) {
    console.error('Error limpiando créditos:', error);
  }
};
// ========================================
// HELPER: Verificar si usuario es premium
// ========================================

export const checkIfPremium = async (userId, db) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData.isPremium === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

// ========================================
// ADMOB BANNER COMPONENT (Placeholder)
// ========================================

export const AdBanner = ({ style }) => {
  // En producción, aquí iría el componente real de AdMob
  // Para desarrollo, mostramos un placeholder
  
  return (
    <View style={[styles.adBanner, style]}>
      <Text style={styles.adBannerText}>📢 Espacio para anuncio (AdMob Banner)</Text>
      <Text style={styles.adBannerSmall}>320x50 - Banner ad</Text>
    </View>
  );
};

// Nota: Para implementar AdMob real, necesitas:
// 1. Instalar: expo install expo-ads-admob
// 2. Configurar App ID en app.json
// 3. Reemplazar AdBanner con:
/*
import { AdMobBanner } from 'expo-ads-admob';

export const AdBanner = ({ style }) => {
  return (
    <AdMobBanner
      bannerSize="banner"
      adUnitID="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" // Tu Ad Unit ID
      servePersonalizedAds={false}
      style={style}
      onDidFailToReceiveAdWithError={(error) => console.log('Ad error:', error)}
    />
  );
};
*/

// ========================================
// ADMOB INTERSTITIAL (Placeholder)
// ========================================

export const showInterstitialAd = async () => {
  console.log('📢 Mostrando Interstitial Ad (placeholder)');
  // En producción: cargar y mostrar anuncio intersticial
  return Promise.resolve();
};

// Nota: Para implementar Interstitial real:
/*
import { AdMobInterstitial } from 'expo-ads-admob';

export const showInterstitialAd = async () => {
  try {
    await AdMobInterstitial.setAdUnitID('ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX');
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: false });
    await AdMobInterstitial.showAdAsync();
  } catch (error) {
    console.log('Interstitial ad error:', error);
  }
};
*/

// ========================================
// ADMOB REWARDED AD (Placeholder)
// ========================================

export const showRewardedAd = async (onRewarded) => {
  console.log('📢 Mostrando Rewarded Ad (placeholder)');
  // En producción: mostrar anuncio con recompensa
  // Simular recompensa
  setTimeout(() => {
    if (onRewarded) onRewarded();
  }, 1000);
};

// Nota: Para implementar Rewarded real:
/*
import { AdMobRewarded } from 'expo-ads-admob';

export const showRewardedAd = async (onRewarded) => {
  try {
    await AdMobRewarded.setAdUnitID('ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX');
    await AdMobRewarded.requestAdAsync({ servePersonalizedAds: false });
    await AdMobRewarded.showAdAsync();
    
    AdMobRewarded.addEventListener('rewardedVideoUserDidEarnReward', () => {
      if (onRewarded) onRewarded();
    });
  } catch (error) {
    console.log('Rewarded ad error:', error);
  }
};
*/

// ========================================
// MODAL: SOLICITAR PREMIUM
// ========================================

export const RequestPremiumModal = ({ visible, onClose, userId, userEmail, db }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail || '',
    phone: '',
    farmName: '',
    numFarms: '1',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.name || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      // Guardar solicitud en Firebase
      const requestData = {
        userId,
        ...formData,
        requestDate: new Date().toISOString(),
        status: 'pending', // pending, contacted, converted, rejected
        source: 'mobile-app',
      };

      await db.collection('premium_requests').add(requestData);

      // Aquí puedes agregar una Cloud Function para enviar email automático
      // Por ahora, solo guardamos en Firebase

      console.log('✅ Solicitud de premium enviada:', requestData);

      Alert.alert(
        '¡Solicitud Enviada!',
        'Gracias por tu interés en el Plan Premium. Nos pondremos en contacto contigo por WhatsApp en las próximas 24 horas.',
        [
          {
            text: 'Entendido',
            onPress: () => {
              setFormData({
                name: '',
                email: userEmail || '',
                phone: '',
                farmName: '',
                numFarms: '1',
                reason: '',
              });
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { height: '85%', backgroundColor: 'white' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🌟 Solicitar Plan Premium</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.premiumDescription}>
              Completa el formulario y nos pondremos en contacto contigo por WhatsApp para activar tu Plan Premium.
            </Text>

            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Juan Pérez"
              editable={!loading}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="juan@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <Text style={styles.label}>Teléfono (WhatsApp) *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+502 5555-5555"
              keyboardType="phone-pad"
              editable={!loading}
            />

            <Text style={styles.label}>Nombre de tu finca principal</Text>
            <TextInput
              style={styles.input}
              value={formData.farmName}
              onChangeText={(text) => setFormData({ ...formData, farmName: text })}
              placeholder="Finca La Esperanza"
              editable={!loading}
            />

            <Text style={styles.label}>¿Cuántas fincas manejas?</Text>
            <View style={styles.pickerContainer}>
              {['1', '2-5', '6-10', '10+'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.pickerOption,
                    formData.numFarms === num && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, numFarms: num })}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.numFarms === num && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>¿Por qué necesitas el Plan Premium?</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={formData.reason}
              onChangeText={(text) => setFormData({ ...formData, reason: text })}
              placeholder="Necesito gestionar múltiples fincas y exportar reportes..."
              multiline
              numberOfLines={4}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ========================================
// PAYWALL COMPONENT
// ========================================

export const Paywall = ({ feature, onRequestPremium, onClose }) => {
  return (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.paywallHeader}>
            <Ionicons name="lock-closed" size={50} color="#FF9800" />
            <Text style={styles.paywallTitle}>Feature Premium</Text>
            <Text style={styles.paywallSubtitle}>{feature}</Text>
          </View>

          <View style={styles.paywallFeatures}>
            <Text style={styles.paywallFeaturesTitle}>Con el Plan Premium obtienes:</Text>
            {PLANS.PREMIUM.features.map((feat, idx) => (
              <Text key={idx} style={styles.paywallFeature}>
                {feat}
              </Text>
            ))}
          </View>

          <View style={styles.paywallPrice}>
            <Text style={styles.paywallPriceLabel}>Solo</Text>
            <Text style={styles.paywallPriceAmount}>
              ${PLANS.PREMIUM.price}/mes
            </Text>
            <Text style={styles.paywallPriceNote}>o $99/año (ahorra 2 meses)</Text>
          </View>

          <TouchableOpacity style={styles.paywallButton} onPress={onRequestPremium}>
            <Text style={styles.paywallButtonText}>🌟 Solicitar Plan Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.paywallButtonSecondary} onPress={onClose}>
            <Text style={styles.paywallButtonSecondaryText}>Tal vez después</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ========================================
// ADMIN DASHBOARD - MÉTRICAS
// ========================================

export const AdminMetricsDashboard = ({ onBack, db, userId }) => {
const [metrics, setMetrics] = useState({
  totalUsers: 0,
  freeUsers: 0,
  premiumUsers: 0,
  totalFarms: 0,
  totalTrees: 0,
  conversionRate: 0,
  usersByCountry: {},  // 🆕 NUEVO
  loading: true,
});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const snapshot = await db
        .collection('premium_requests')
        .orderBy('requestDate', 'desc')
        .get();

      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const pending = requests.filter((r) => r.status === 'pending').length;
      const contacted = requests.filter((r) => r.status === 'contacted').length;
      const converted = requests.filter((r) => r.status === 'converted').length;
      const total = requests.length;
      const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

      setMetrics({
        totalRequests: total,
        pendingRequests: pending,
        contactedRequests: contacted,
        convertedRequests: converted,
        conversionRate,
        requests,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactRequest = async (requestId) => {
    try {
      await db.collection('premium_requests').doc(requestId).update({
        status: 'contacted',
        contactedDate: new Date().toISOString(),
      });
      Alert.alert('Éxito', 'Marcado como contactado');
      loadMetrics();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar: ' + error.message);
    }
  };

  const handleConvertRequest = async (requestId) => {
    try {
      await db.collection('premium_requests').doc(requestId).update({
        status: 'converted',
        convertedDate: new Date().toISOString(),
      });
      Alert.alert('Éxito', 'Marcado como convertido (pagó)');
      loadMetrics();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar: ' + error.message);
    }
  };

  const handleWhatsApp = (phone, name) => {
    const message = `Hola ${name}, gracias por tu interés en el Plan Premium de nuestra app agrícola. ¿Cuándo podemos agendar una llamada para mostrarte todas las funcionalidades?`;
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Métricas</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContent}>
          <Text>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Métricas Premium</Text>
        <TouchableOpacity onPress={loadMetrics}>
          <Ionicons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Resumen de métricas */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="mail-unread" size={24} color="#2196F3" />
            <Text style={styles.metricValue}>{metrics.totalRequests}</Text>
            <Text style={styles.metricLabel}>Total Solicitudes</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="time" size={24} color="#FF9800" />
            <Text style={styles.metricValue}>{metrics.pendingRequests}</Text>
            <Text style={styles.metricLabel}>Pendientes</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="call" size={24} color="#9C27B0" />
            <Text style={styles.metricValue}>{metrics.contactedRequests}</Text>
            <Text style={styles.metricLabel}>Contactados</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.metricValue}>{metrics.convertedRequests}</Text>
            <Text style={styles.metricLabel}>Convertidos</Text>
          </View>
        </View>

        <View style={styles.conversionCard}>
          <Text style={styles.conversionLabel}>Tasa de Conversión</Text>
          <Text style={styles.conversionValue}>{metrics.conversionRate}%</Text>
          <Text style={styles.conversionNote}>
            {metrics.convertedRequests} de {metrics.totalRequests} solicitudes
          </Text>
        </View>

        {/* Lista de solicitudes */}
        <Text style={styles.sectionTitle}>Solicitudes Recientes</Text>

        {metrics.requests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View>
                <Text style={styles.requestName}>{request.name}</Text>
                <Text style={styles.requestEmail}>{request.email}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  request.status === 'pending' && styles.statusPending,
                  request.status === 'contacted' && styles.statusContacted,
                  request.status === 'converted' && styles.statusConverted,
                ]}
              >
                <Text style={styles.statusText}>
                  {request.status === 'pending' && '⏳ Pendiente'}
                  {request.status === 'contacted' && '📞 Contactado'}
                  {request.status === 'converted' && '✅ Convertido'}
                </Text>
              </View>
            </View>

            <Text style={styles.requestDetail}>📱 {request.phone}</Text>
            {request.farmName && (
              <Text style={styles.requestDetail}>🏡 {request.farmName}</Text>
            )}
            <Text style={styles.requestDetail}>📊 {request.numFarms} finca(s)</Text>
            {request.reason && (
              <Text style={styles.requestReason}>💬 "{request.reason}"</Text>
            )}
            <Text style={styles.requestDate}>
              📅 {new Date(request.requestDate).toLocaleDateString('es-GT')}
            </Text>

            <View style={styles.requestActions}>
              {request.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleWhatsApp(request.phone, request.name)}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <Text style={styles.actionBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleContactRequest(request.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#2196F3" />
                    <Text style={styles.actionBtnText}>Marcar Contactado</Text>
                  </TouchableOpacity>
                </>
              )}
              {request.status === 'contacted' && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleConvertRequest(request.id)}
                >
                  <Ionicons name="cash" size={16} color="#4CAF50" />
                  <Text style={styles.actionBtnText}>Marcar Convertido</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {metrics.requests.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="inbox" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>No hay solicitudes todavía</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ========================================
// ADMIN PANEL - ACTIVAR PREMIUM
// ========================================

export const ActivatePremiumPanel = ({ onBack, db }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!email) {
      Alert.alert('Error', 'Ingresa un email');
      return;
    }

    setLoading(true);

    try {
      // Buscar usuario por email
      const usersSnapshot = await db
        .collection('users')
        .where('email', '==', email)
        .get();

      if (usersSnapshot.empty) {
        Alert.alert('Error', 'No se encontró usuario con ese email');
        return;
      }

      const userId = usersSnapshot.docs[0].id;

      // Activar premium
      await db.collection('users').doc(userId).update({
        isPremium: true,
        premiumActivatedDate: new Date().toISOString(),
        premiumActivatedBy: 'manual',
      });

      Alert.alert('Éxito', `Premium activado para ${email}`);
      setEmail('');
    } catch (error) {
      console.error('Error activating premium:', error);
      Alert.alert('Error', 'No se pudo activar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!email) {
      Alert.alert('Error', 'Ingresa un email');
      return;
    }

    Alert.alert(
      'Confirmar',
      `¿Desactivar premium para ${email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const usersSnapshot = await db
                .collection('users')
                .where('email', '==', email)
                .get();

              if (usersSnapshot.empty) {
                Alert.alert('Error', 'No se encontró usuario');
                return;
              }

              const userId = usersSnapshot.docs[0].id;

              await db.collection('users').doc(userId).update({
                isPremium: false,
                premiumDeactivatedDate: new Date().toISOString(),
              });

              Alert.alert('Éxito', `Premium desactivado para ${email}`);
              setEmail('');
            } catch (error) {
              Alert.alert('Error', 'No se pudo desactivar: ' + error.message);
            } finally {
              setLoading(false);
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
        <Text style={styles.headerTitle}>🔐 Activar Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activar/Desactivar Premium Manualmente</Text>
          <Text style={styles.cardDescription}>
            Ingresa el email del usuario para activar o desactivar su plan premium.
          </Text>

          <Text style={styles.label}>Email del usuario</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="usuario@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleActivate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Procesando...' : '✅ Activar Premium'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleDeactivate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>❌ Desactivar Premium</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.cardTitle}>⚠️ Instrucciones</Text>
          <Text style={styles.instructionText}>
            1. Usuario solicita premium desde la app
          </Text>
          <Text style={styles.instructionText}>
            2. Revisas solicitud en "Métricas Premium"
          </Text>
          <Text style={styles.instructionText}>
            3. Contactas al usuario por WhatsApp
          </Text>
          <Text style={styles.instructionText}>
            4. Usuario te transfiere/deposita el pago
          </Text>
          <Text style={styles.instructionText}>
            5. Activas su premium aquí con su email
          </Text>
          <Text style={styles.instructionText}>
            6. Usuario verifica que ya tiene premium en la app
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  // Base styles
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 15,
  },

  // Ad Banner
  adBanner: {
    height: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginVertical: 10,
  },
  adBannerText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  adBannerSmall: {
    fontSize: 10,
    color: '#666',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  premiumDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  pickerOption: {
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonSecondaryText: {
    color: '#666',
  },
  buttonDanger: {
    backgroundColor: '#F44336',
  },

  // Paywall
  paywallHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  paywallTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  paywallSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  paywallFeatures: {
    paddingVertical: 20,
  },
  paywallFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  paywallFeature: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
    paddingLeft: 10,
  },
  paywallPrice: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 20,
  },
  paywallPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  paywallPriceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 5,
  },
  paywallPriceNote: {
    fontSize: 12,
    color: '#999',
  },
  paywallButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  paywallButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  paywallButtonSecondary: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  paywallButtonSecondaryText: {
    color: '#666',
    fontSize: 14,
  },

  // Metrics Dashboard
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  conversionCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  conversionLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  conversionValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 5,
  },
  conversionNote: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  requestEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusContacted: {
    backgroundColor: '#E1F5FE',
  },
  statusConverted: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  requestDetail: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
  },
  requestReason: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  requestDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  requestActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Activate Premium Panel
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    marginVertical: 5,
    lineHeight: 20,
  },
});

export const PlatformMetricsDashboard = ({ onBack, db }) => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    totalFarms: 0,
    totalTrees: 0,
    conversionRate: 0,
    loading: true,
  });

  useEffect(() => {
    loadPlatformMetrics();
  }, []);

  const loadPlatformMetrics = async () => {
    try {
      // Total usuarios
      const usersSnapshot = await db.collection('users').get();
      const totalUsers = usersSnapshot.size;

      // Usuarios premium
      const premiumSnapshot = await db.collection('premium_users').get();
      const premiumUsers = premiumSnapshot.size;
      const freeUsers = totalUsers - premiumUsers;

      // Total fincas
      const farmsSnapshot = await db.collection('farms').get();
      const totalFarms = farmsSnapshot.size;

      // Total árboles (aproximado sumando de todas las fincas)
      let totalTrees = 0;
      for (const farm of farmsSnapshot.docs) {
        const treesSnapshot = await db
          .collection('farms')
          .doc(farm.id)
          .collection('trees')
          .get();
        totalTrees += treesSnapshot.size;
      }

      // Conversion rate
      const conversionRate = totalUsers > 0 
        ? ((premiumUsers / totalUsers) * 100).toFixed(1)
        : 0;

      // Usuarios por país (basado en la ubicación de sus fincas)
const usersByCountry = {};
for (const farm of farmsSnapshot.docs) {
  const farmData = farm.data();
  const country = farmData.country || farmData.location?.country || 'No especificado';
  usersByCountry[country] = (usersByCountry[country] || 0) + 1;
}

// Ordenar países por cantidad de usuarios (descendente)
const sortedCountries = Object.entries(usersByCountry)
  .sort((a, b) => b[1] - a[1])
  .reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});

    setMetrics({
      totalUsers,
      freeUsers,
      premiumUsers,
      totalFarms,
      totalTrees,
      conversionRate,
      usersByCountry: sortedCountries,  // 🆕 NUEVO
      loading: false,
    });

      console.log('📊 Métricas de plataforma cargadas');
    } catch (error) {
      console.error('Error cargando métricas:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  if (metrics.loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cargando...</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👑 Métricas de Plataforma</Text>
        <TouchableOpacity onPress={loadPlatformMetrics}>
          <Ionicons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* RESUMEN GENERAL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Resumen General</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{metrics.totalUsers}</Text>
              <Text style={styles.metricLabel}>Total Usuarios</Text>
            </View>
            
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                {metrics.premiumUsers}
              </Text>
              <Text style={styles.metricLabel}>Premium</Text>
            </View>
            
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: '#FF9800' }]}>
                {metrics.freeUsers}
              </Text>
              <Text style={styles.metricLabel}>Free</Text>
            </View>
            
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: '#2196F3' }]}>
                {metrics.conversionRate}%
              </Text>
              <Text style={styles.metricLabel}>Conversión</Text>
            </View>
          </View>
        </View>

        {/* MÉTRICAS DE USO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌾 Métricas de Uso</Text>
          
          <View style={styles.statRow}>
            <Ionicons name="business" size={24} color="#795548" />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.statLabel}>Fincas Registradas</Text>
              <Text style={styles.statValue}>{metrics.totalFarms}</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <Ionicons name="leaf" size={24} color="#4CAF50" />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.statLabel}>Árboles Totales</Text>
              <Text style={styles.statValue}>{metrics.totalTrees}</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <Ionicons name="calculator" size={24} color="#9C27B0" />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.statLabel}>Árboles por Finca (Promedio)</Text>
              <Text style={styles.statValue}>
                {metrics.totalFarms > 0 
                  ? Math.round(metrics.totalTrees / metrics.totalFarms)
                  : 0}
              </Text>
            </View>
          </View>
        </View>


      {/* DISTRIBUCIÓN POR PAÍS */}
<View style={styles.card}>
  <Text style={styles.cardTitle}>🌍 Usuarios por País</Text>
  
  {Object.keys(metrics.usersByCountry).length === 0 ? (
    <Text style={{ color: '#999', textAlign: 'center', padding: 20 }}>
      No hay datos de ubicación disponibles
    </Text>
  ) : (
    Object.entries(metrics.usersByCountry).map(([country, count]) => (
      <View key={country} style={styles.countryRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.countryName}>{country}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(count / metrics.totalFarms) * 100}%`,
                  backgroundColor: '#4CAF50'
                }
              ]} 
            />
          </View>
        </View>
        <Text style={styles.countryCount}>{count}</Text>
      </View>
    ))
  )}
  
  <View style={[styles.card, { backgroundColor: '#FFF3E0', marginTop: 15 }]}>
    <Text style={{ fontSize: 12, color: '#F57C00', lineHeight: 18 }}>
      💡 <Text style={{ fontWeight: 'bold' }}>Tip:</Text> Para tener datos más precisos, 
      asegúrate de que las fincas tengan el campo "country" o "location.country" en Firestore.
    </Text>
  </View>
</View>
        {/* PROYECCIÓN DE INGRESOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Proyección de Ingresos</Text>
          
          <View style={styles.revenueBox}>
            <Text style={styles.revenueLabel}>MRR (Monthly Recurring Revenue)</Text>
            <Text style={styles.revenueValue}>
              ${(metrics.premiumUsers * 9.99).toFixed(2)}
            </Text>
            <Text style={styles.revenueSubtext}>
              {metrics.premiumUsers} usuarios × $9.99/mes
            </Text>
          </View>
          
          <View style={styles.revenueBox}>
            <Text style={styles.revenueLabel}>ARR (Annual Recurring Revenue)</Text>
            <Text style={styles.revenueValue}>
              ${(metrics.premiumUsers * 9.99 * 12).toFixed(2)}
            </Text>
            <Text style={styles.revenueSubtext}>
              Proyección anual
            </Text>
          </View>
          
          <View style={styles.revenueBox}>
            <Text style={styles.revenueLabel}>Potencial Total (si todos fueran premium)</Text>
            <Text style={[styles.revenueValue, { color: '#FF9800' }]}>
              ${(metrics.totalUsers * 9.99 * 12).toFixed(2)}
            </Text>
            <Text style={styles.revenueSubtext}>
              Oportunidad de crecimiento: ${((metrics.totalUsers - metrics.premiumUsers) * 9.99 * 12).toFixed(2)}/año
            </Text>
          </View>
        </View>

        {/* NOTA */}
        <View style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
          <Text style={{ fontSize: 12, color: '#1976D2', lineHeight: 18 }}>
            ℹ️ <Text style={{ fontWeight: 'bold' }}>Nota:</Text> Las métricas de descargas, 
            desinstalaciones y tiempo de uso se pueden integrar con Firebase Analytics 
            o Google Play Console. Estas métricas requieren configuración adicional.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ============================================
// MODAL DE ANUNCIO RECOMPENSADO
// ============================================

export const RewardedAdModal = ({ 
  visible, 
  onClose, 
  onWatchAd, 
  limitType, 
  currentCount, 
  limitCount,
  rewardAmount,
  adsWatchedToday 
}) => {
  const maxAdsPerDay = 10;
  const adsRemaining = maxAdsPerDay - adsWatchedToday;
  
  const getLimitTypeLabel = () => {
    switch (limitType) {
      case 'production': return 'Producción';
      case 'sales': return 'Ventas';
      case 'expenses': return 'Gastos';
      case 'trees': return 'Árboles';
      default: return 'Registros';
    }
  };
  
  const getRewardLabel = () => {
    if (limitType === 'trees') {
      return `+${rewardAmount} árboles`;
    }
    return `+${rewardAmount} registro`;
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { maxHeight: '70%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔒 Límite Alcanzado</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Estado actual */}
            <View style={{ backgroundColor: '#FFF3E0', padding: 15, borderRadius: 12, marginBottom: 20 }}>
              <Text style={{ fontSize: 16, color: '#F57C00', fontWeight: '600', marginBottom: 8 }}>
                {getLimitTypeLabel()}: {currentCount}/{limitCount} usados este mes
              </Text>
              <Text style={{ fontSize: 14, color: '#666', lineHeight: 20 }}>
                Has alcanzado el límite del Plan FREE.
              </Text>
            </View>

            {/* Opción 1: Ver anuncio */}
            {adsRemaining > 0 ? (
              <TouchableOpacity
                style={{
                  backgroundColor: '#4CAF50',
                  padding: 20,
                  borderRadius: 15,
                  marginBottom: 15,
                  alignItems: 'center',
                }}
                onPress={onWatchAd}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="play-circle" size={32} color="white" />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginLeft: 10 }}>
                    Ver Anuncio
                  </Text>
                </View>
                <Text style={{ fontSize: 16, color: 'white', marginBottom: 5 }}>
                  Mira un video de 30 segundos
                </Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFF9C4' }}>
                  {getRewardLabel()}
                </Text>
                
                {/* Contador de anuncios */}
                <View style={{ marginTop: 15, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}>
                  <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>
                    📺 Anuncios disponibles hoy: {adsRemaining}/{maxAdsPerDay}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{
                backgroundColor: '#FFEBEE',
                padding: 20,
                borderRadius: 15,
                marginBottom: 15,
                alignItems: 'center',
              }}>
                <Ionicons name="timer-outline" size={32} color="#F44336" />
                <Text style={{ fontSize: 16, color: '#F44336', fontWeight: '600', marginTop: 10, textAlign: 'center' }}>
                  Límite diario de anuncios alcanzado
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' }}>
                  Vuelve mañana para ver más anuncios o actualiza a Premium
                </Text>
              </View>
            )}

            {/* Opción 2: Plan Premium */}
            <TouchableOpacity
              style={{
                backgroundColor: '#FF9800',
                padding: 20,
                borderRadius: 15,
                marginBottom: 15,
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#FFD54F',
              }}
              onPress={() => {
                onClose();
                // Aquí se abrirá el modal de solicitar premium
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="star" size={32} color="white" />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginLeft: 10 }}>
                  Plan Premium
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: 'white', textAlign: 'center', marginBottom: 10 }}>
                Registros ilimitados
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontSize: 14, color: 'white' }}>Solo </Text>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>$9.99</Text>
                <Text style={{ fontSize: 14, color: 'white' }}>/mes</Text>
              </View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
                Sin anuncios • Sin límites • Reportes avanzados
              </Text>
            </TouchableOpacity>

            {/* Info de expiración */}
            <View style={{ backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10 }}>
              <Text style={{ fontSize: 12, color: '#1976D2', textAlign: 'center', lineHeight: 18 }}>
                ℹ️ Los créditos ganados expiran en 24 horas
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default {
  PLANS,
  checkIfPremium,
  AdBanner,
  showInterstitialAd,
  showRewardedAd,
  RequestPremiumModal,
  Paywall,
  AdminMetricsDashboard,
  ActivatePremiumPanel,
};
