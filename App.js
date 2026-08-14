import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, Linking, TextInput, Modal, Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createClient } from '@supabase/supabase-js';
import MapView, { Marker } from 'react-native-maps';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// ==================== CONFIGURAÇÃO DO SUPABASE ====================
const supabaseUrl = 'https://ovvagkmfotubgpcspjns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dmFna21mb3R1YmdwY3Nwam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDAwMTEsImV4cCI6MjEwMTA3NjAxMX0.GmmFIKggh7kSguDY-OKPEG8qLmQShQp3sbl11ImdTzQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== NOTIFICAÇÕES ====================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Pedidos Xis da Claudinha',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus === 'granted') {
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e) {
        console.log('Push token error:', e);
      }
    }
  }
  return token;
}

// ==================== CONTEXTOS ====================
const CartContext = createContext(null);
const UserContext = createContext(null);

// ==================== UTILIDADES ====================
function formatCurrency(value) {
  if (value === undefined || value === null) return 'R$ 0,00';
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function checkOpenStatus() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  if (day >= 1 && day <= 4) {
    if (hour >= 19 || hour < 2) return true;
  }
  if (day === 5 || day === 6 || day === 0) {
    if (hour >= 19 || hour < 4) return true;
  }
  return false;
}

const STATUS_LABELS = {
  pendente: { label: '⏳ Pendente', color: '#FFA000' },
  confirmado: { label: '✅ Confirmado', color: '#4CAF50' },
  preparando: { label: '👨‍🍳 Preparando', color: '#FF6F00' },
  saiu_entrega: { label: '🛵 Saiu para entrega', color: '#2196F3' },
  entregue: { label: '🎉 Entregue!', color: '#4CAF50' },
  cancelado: { label: '❌ Cancelado', color: '#F44336' },
  RECEIVED: { label: '⏳ Recebido', color: '#FFA000' },
  PENDING: { label: '⏳ Pendente', color: '#FFA000' },
  CONFIRMED: { label: '✅ Confirmado', color: '#4CAF50' },
  PREPARING: { label: '👨‍🍳 Preparando', color: '#FF6F00' },
  OUT_FOR_DELIVERY: { label: '🛵 Saiu para entrega', color: '#2196F3' },
  DELIVERED: { label: '🎉 Entregue!', color: '#4CAF50' },
  CANCELLED: { label: '❌ Cancelado', color: '#F44336' },
};

// ==================== TELA INICIAL ====================
function HomeScreen({ navigation }) {
  const [menuData, setMenuData] = useState({});
  const [loading, setLoading] = useState(true);
  const { cart, itemCount } = useContext(CartContext);
  const isOpen = checkOpenStatus();

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('is_available', true);
        if (error) {
          console.log('Erro ao buscar produtos:', error);
          const fallbackData = [
            { id: 1, name: 'Xis Salada', description: 'Hambúrguer, queijo, alface, tomate e maionese', price: 28.00, category: 'Xiss', is_available: true },
            { id: 2, name: 'Xis Bacon', description: 'Hambúrguer, queijo, bacon crocante e maionese', price: 32.00, category: 'Xiss', is_available: true },
            { id: 3, name: 'Xis Egg', description: 'Hambúrguer, queijo, ovo e maionese', price: 30.00, category: 'Xiss', is_available: true },
            { id: 4, name: 'Xis Completo', description: 'Hambúrguer, queijo, bacon, ovo, alface, tomate', price: 38.00, category: 'Xiss', is_available: true },
            { id: 5, name: 'Xis Tudo', description: 'Hambúrguer duplo, queijo, bacon, ovo, calabresa, alface, tomate', price: 45.00, category: 'Xiss', is_available: true },
            { id: 6, name: 'Dog Simples', description: 'Salsicha, molho e batata palha', price: 15.00, category: 'Cachorro-Quente', is_available: true },
            { id: 7, name: 'Dog Completo', description: 'Salsicha, queijo, bacon, molho e batata palha', price: 22.00, category: 'Cachorro-Quente', is_available: true },
          ];
          const grouped = fallbackData.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
          }, {});
          setMenuData(grouped);
        } else if (data) {
          const grouped = data.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
          }, {});
          setMenuData(grouped);
        }
      } catch (e) {
        console.log('Erro fetchMenu:', e);
      }
      setLoading(false);
    }
    fetchMenu();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{ color: '#FFF', marginTop: 10 }}>Carregando cardápio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logoText}>Xis DA CLAUDINHA</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.headerIconText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartIcon} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.cartIconText}>🛒 {itemCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>🔥 O Xis Raiz do Jeitinho que a Gente Gosta!</Text>
          <Text style={styles.bannerSub}>
            {isOpen ? '🟢 Aberto agora! Peça já!' : '🔴 Fechado no momento. Volte a partir das 19h!'}
          </Text>
        </View>

        {Object.keys(menuData).map(category => (
          <View key={category}>
            <Text style={styles.categoryTitle}>{category === 'Xiss' ? '🍔' : '🌭'} {category}</Text>
            {menuData[category].map(item => (
              <TouchableOpacity key={item.id} style={styles.productCard} onPress={() => navigation.navigate('Detail', { product: item })}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productDesc}>{item.description}</Text>
                </View>
                <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.whatsappButton} onPress={() => Linking.openURL('https://wa.me/5551989111389')}>
        <Text style={styles.whatsappText}>💬 Falar com Claudinha</Text>
      </TouchableOpacity>
    </View>
  );
}

// ==================== TELA DE DETALHES ====================
function DetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart } = useContext(CartContext);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [obs, setObs] = useState('');
  const [quantity, setQuantity] = useState(1);

  const extrasList = [
    { id: 1, name: '🧀 Queijo Cheddar', price: 4.00 },
    { id: 2, name: '🥓 Bacon Extra', price: 5.00 },
    { id: 3, name: '🧅 Cebola Caramelizada', price: 2.00 },
    { id: 4, name: '🥩 Bife Extra', price: 7.00 },
    { id: 5, name: '🥚 Ovo', price: 2.50 },
  ];

  const toggleExtra = (extra) => {
    if (selectedExtras.find(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const unitTotal = product.price + extrasTotal;
  const itemTotal = unitTotal * quantity;

  const handleAdd = () => {
    const cartItem = {
      id: `${product.id}_${Date.now()}`,
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      extras: selectedExtras,
      observations: obs,
      unitPrice: unitTotal,
      quantity,
      finalPrice: itemTotal,
    };
    addToCart(cartItem);
    Alert.alert("Adicionado! 🔥", `${quantity}x ${product.name} no carrinho!`);
    navigation.goBack();
  };

  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailImagePlaceholder}>
        <Text style={styles.detailImageText}>📸 {product.name}</Text>
      </View>

      <ScrollView style={styles.detailContent}>
        <Text style={styles.detailName}>{product.name}</Text>
        <Text style={styles.detailDesc}>{product.description}</Text>

        <View style={styles.quantityRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Adicionais</Text>
        {extrasList.map(extra => {
          const isSelected = selectedExtras.find(e => e.id === extra.id);
          return (
            <TouchableOpacity
              key={extra.id}
              style={[styles.extraItem, isSelected && styles.extraItemSelected]}
              onPress={() => toggleExtra(extra)}
            >
              <Text style={[styles.extraName, isSelected && styles.extraNameSelected]}>{extra.name}</Text>
              <Text style={styles.extraPrice}>+ {formatCurrency(extra.price)}</Text>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sectionTitle}>Observações</Text>
        <TextInput
          style={styles.obsInput}
          placeholder="Ex: Sem maionese, cortar ao meio, ponto da carne..."
          placeholderTextColor="#777"
          value={obs}
          onChangeText={setObs}
          multiline
        />
      </ScrollView>

      <View style={styles.detailFooter}>
        <View>
          <Text style={styles.detailTotal}>{formatCurrency(itemTotal)}</Text>
          {quantity > 1 && <Text style={styles.detailUnit}>{formatCurrency(unitTotal)} cada</Text>}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==================== TELA DO CARRINHO ====================
function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateQuantity, clearCart, total, itemCount } = useContext(CartContext);

  if (cart.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyCartText}>Seu carrinho está vazio!</Text>
        <Text style={styles.emptyCartSub}>Adicione um Xis raiz aí! 🍔</Text>
        <TouchableOpacity style={styles.backToMenuBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backToMenuText}>Ver Cardápio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cartContainer}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 180 }}>
        {cart.map((item, index) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.cartItemName}>{item.quantity}x {item.name}</Text>
                <TouchableOpacity onPress={() => removeFromCart(index)}>
                  <Text style={styles.removeText}>🗑️</Text>
                </TouchableOpacity>
              </View>
              {item.extras.map(ext => <Text key={ext.id} style={styles.cartItemExtra}>➕ {ext.name}</Text>)}
              {item.observations ? <Text style={styles.cartItemObs}>📝 {item.observations}</Text> : null}
              <Text style={styles.cartItemPrice}>{formatCurrency(item.finalPrice)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.cartFooter}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: '#A9A9A9' }}>{itemCount} item(s)</Text>
          <TouchableOpacity onPress={clearCart}>
            <Text style={{ color: '#F44336' }}>Limpar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cartTotalText}>Total: {formatCurrency(total)}</Text>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutButtonText}>Ir para Pagamento →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==================== TELA DE CHECKOUT ====================
function CheckoutScreen({ navigation }) {
  const { cart, total, clearCart } = useContext(CartContext);
  const { userInfo, setUserInfo } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [address, setAddress] = useState(userInfo.address || {
    street: '', number: '', complement: '', neighborhood: '', city: 'Viamão', phone: userInfo.phone || ''
  });
  const [showPixModal, setShowPixModal] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [debugError, setDebugError] = useState('');

  const handlePlaceOrder = async () => {
    setDebugError('');

    if (!address.street || !address.number || !address.phone) {
      Alert.alert('Ops!', 'Preencha o endereço completo e telefone');
      return;
    }

    setUserInfo({ ...userInfo, address, phone: address.phone });
    setLoading(true);

    try {
      const orderItems = cart.map(item => ({
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        extras: item.extras.map(e => e.name),
        observations: item.observations,
      }));

      const orderData = {
        items: orderItems,
        total: total,
        status: 'pendente',
        payment_method: paymentMethod,
        payment_status: 'pendente',
        address: address,
        customer_phone: address.phone,
        delivery_location: null,
      };

      console.log('=== ENVIANDO PARA SUPABASE ===');
      console.log('Dados:', JSON.stringify(orderData, null, 2));

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      console.log('=== RESPOSTA SUPABASE ===');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        if (error.message && (error.message.includes('column') || error.message.includes('does not exist'))) {
          console.log('Tentando estrutura antiga...');
          const oldOrderData = {
            user_phone: address.phone,
            total: total,
            status: 'RECEIVED',
            payment_method: paymentMethod.toUpperCase(),
          };

          const { data: oldData, error: oldError } = await supabase
            .from('orders')
            .insert(oldOrderData)
            .select()
            .single();

          if (oldError) {
            console.log('Erro estrutura antiga:', oldError);
            setDebugError(`ERRO BANCO (antigo): ${oldError.message}\nCódigo: ${oldError.code}`);
            Alert.alert('Erro no Banco', `Não foi possível salvar.\n\nDetalhe: ${oldError.message}`);
            setLoading(false);
            return;
          }

          console.log('Sucesso com estrutura antiga:', oldData);
          data = oldData;
        } else {
          console.log('Erro estrutura nova:', error);
          setDebugError(`ERRO BANCO (novo): ${error.message}\nCódigo: ${error.code}`);
          Alert.alert('Erro no Banco', `Não foi possível salvar.\n\nDetalhe: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      console.log('Pedido criado com sucesso:', data);

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Pedido Recebido! 🍔',
            body: `Seu pedido #${data.id.slice(0, 8)} foi enviado!`,
            data: { screen: 'OrderTracking', orderId: data.id },
          },
          trigger: null,
        });
      } catch (notifErr) {
        console.log('Erro notificação (não crítico):', notifErr);
      }

      if (paymentMethod === 'pix') {
        setOrderId(data.id);
        setShowPixModal(true);
      } else {
        Alert.alert('Pedido Confirmado!', 'Pagamento na entrega selecionado.');
        clearCart();
        navigation.replace('OrderTracking', { orderId: data.id });
      }
    } catch (err) {
      console.log('Erro geral:', err);
      setDebugError(`ERRO GERAL: ${err.message || 'Desconhecido'}`);
      Alert.alert('Erro', `Não foi possível finalizar o pedido.\n\n${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const finishPixOrder = () => {
    setShowPixModal(false);
    clearCart();
    navigation.replace('OrderTracking', { orderId });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 160 }}>
        <Text style={styles.checkoutTitle}>Finalizar Pedido</Text>

        <Text style={styles.checkoutSection}>📍 Endereço de Entrega</Text>
        <TextInput style={styles.checkoutInput} placeholder="Telefone (WhatsApp)" placeholderTextColor="#777" keyboardType="phone-pad" value={address.phone} onChangeText={t => setAddress({ ...address, phone: t })} />
        <TextInput style={styles.checkoutInput} placeholder="Rua / Avenida" placeholderTextColor="#777" value={address.street} onChangeText={t => setAddress({ ...address, street: t })} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput style={[styles.checkoutInput, { flex: 1 }]} placeholder="Número" placeholderTextColor="#777" keyboardType="numeric" value={address.number} onChangeText={t => setAddress({ ...address, number: t })} />
          <TextInput style={[styles.checkoutInput, { flex: 2 }]} placeholder="Complemento" placeholderTextColor="#777" value={address.complement} onChangeText={t => setAddress({ ...address, complement: t })} />
        </View>
        <TextInput style={styles.checkoutInput} placeholder="Bairro" placeholderTextColor="#777" value={address.neighborhood} onChangeText={t => setAddress({ ...address, neighborhood: t })} />
        <TextInput style={styles.checkoutInput} placeholder="Cidade" placeholderTextColor="#777" value={address.city} onChangeText={t => setAddress({ ...address, city: t })} />

        <Text style={styles.checkoutSection}>💳 Forma de Pagamento</Text>
        <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'pix' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('pix')}>
          <Text style={styles.paymentOptionText}>📱 Pix</Text>
          {paymentMethod === 'pix' && <Text style={{ color: '#FFD700' }}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'dinheiro' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('dinheiro')}>
          <Text style={styles.paymentOptionText}>💵 Dinheiro na entrega</Text>
          {paymentMethod === 'dinheiro' && <Text style={{ color: '#FFD700' }}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'cartao' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('cartao')}>
          <Text style={styles.paymentOptionText}>💳 Cartão na entrega</Text>
          {paymentMethod === 'cartao' && <Text style={{ color: '#FFD700' }}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.checkoutSummary}>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Resumo</Text>
          {cart.map(item => (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ color: '#A9A9A9' }}>{item.quantity}x {item.name}</Text>
              <Text style={{ color: '#FFF' }}>{formatCurrency(item.finalPrice)}</Text>
            </View>
          ))}
          <View style={{ borderTopWidth: 1, borderColor: '#333', marginTop: 10, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#FFD700', fontSize: 18, fontWeight: 'bold' }}>Total</Text>
            <Text style={{ color: '#FFD700', fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {debugError ? (
          <View style={{ backgroundColor: '#330000', padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#F44336' }}>
            <Text style={{ color: '#F44336', fontSize: 11 }}>DEBUG: {debugError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.checkoutFooter}>
        <TouchableOpacity style={styles.confirmButton} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? <ActivityIndicator color="#121212" /> : <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={showPixModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ color: '#FFD700', fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>Pagamento via Pix</Text>
            <Text style={{ color: '#FFF', textAlign: 'center', marginBottom: 20 }}>
              Envie {formatCurrency(total)} para a chave Pix da Claudinha e anexe o comprovante no WhatsApp.
            </Text>
            <View style={{ backgroundColor: '#1E1E1E', padding: 16, borderRadius: 10, marginBottom: 20, width: '100%' }}>
              <Text style={{ color: '#A9A9A9', fontSize: 12 }}>CHAVE PIX (CELULAR)</Text>
              <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>51 99111-1389</Text>
              <Text style={{ color: '#A9A9A9', fontSize: 12, marginTop: 8 }}>NOME</Text>
              <Text style={{ color: '#FFF', fontSize: 16 }}>Claudinha Lanches</Text>
            </View>
            <TouchableOpacity style={styles.whatsappLargeBtn} onPress={() => Linking.openURL('https://wa.me/5551989111389?text=Olá! Acabei de fazer um pedido via app e vou enviar o comprovante do Pix!')}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>💬 Enviar Comprovante no WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12 }} onPress={finishPixOrder}>
              <Text style={{ color: '#4CAF50', fontSize: 16 }}>Já paguei, acompanhar pedido →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================== TELA DE MEUS PEDIDOS ====================
function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.log('Erro buscar pedidos:', error);
        setErrorMsg(`Erro: ${error.message}`);
      } else {
        setOrders(data || []);
        setErrorMsg('');
      }
    } catch (e) {
      setErrorMsg(`Erro: ${e.message}`);
    }
    setLoading(false);
  }

  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#FFD700" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: '#FFD700', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Meus Pedidos</Text>

        {errorMsg ? (
          <View style={{ backgroundColor: '#330000', padding: 12, borderRadius: 8, marginBottom: 20 }}>
            <Text style={{ color: '#F44336' }}>{errorMsg}</Text>
          </View>
        ) : null}

        {orders.length === 0 && (
          <Text style={{ color: '#A9A9A9', textAlign: 'center', marginTop: 40 }}>Nenhum pedido ainda 🍔</Text>
        )}

        {orders.map(order => {
          const status = STATUS_LABELS[order.status] || { label: order.status || 'Desconhecido', color: '#999' };
          const orderTotal = order.total || 0;
          const itemCount = order.items ? (Array.isArray(order.items) ? order.items.length : 1) : 1;

          return (
            <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Pedido #{order.id ? order.id.slice(0, 8) : '???'}</Text>
                <Text style={{ color: status.color, fontWeight: 'bold' }}>{status.label}</Text>
              </View>
              <Text style={{ color: '#A9A9A9', fontSize: 12 }}>
                {order.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : 'Data desconhecida'}
              </Text>
              <Text style={{ color: '#FFD700', marginTop: 6, fontSize: 16, fontWeight: 'bold' }}>
                {formatCurrency(orderTotal)}
              </Text>
              <Text style={{ color: '#A9A9A9', fontSize: 12, marginTop: 4 }}>
                {itemCount} item(s) • {(order.payment_method || 'PIX').toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ==================== TELA DE RASTREAMENTO ====================
function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: -30.0819,
    longitude: -51.2450,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    fetchOrder();

    let subscription = null;
    try {
      subscription = supabase
        .channel(`order-${orderId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        }, payload => {
          setOrder(payload.new);
          if (payload.new.delivery_location) {
            const loc = payload.new.delivery_location;
            setDeliveryLocation(loc);
            setMapRegion({
              latitude: loc.latitude,
              longitude: loc.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            });
          }
          if (payload.new.status !== payload.old?.status) {
            const st = STATUS_LABELS[payload.new.status];
            if (st) {
              try {
                Notifications.scheduleNotificationAsync({
                  content: { title: 'Atualização do Pedido 📦', body: `Seu pedido agora está: ${st.label}` },
                  trigger: null,
                });
              } catch (e) {}
            }
          }
        })
        .subscribe();
    } catch (e) {
      console.log('Erro ao criar subscription:', e);
    }

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.log('Erro ao unsubscribe:', e);
        }
      }
    };
  }, [orderId]);

  async function fetchOrder() {
    try {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (data) {
        setOrder(data);
        if (data.delivery_location) {
          setDeliveryLocation(data.delivery_location);
          setMapRegion({
            latitude: data.delivery_location.latitude,
            longitude: data.delivery_location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      }
    } catch (e) {
      console.log('Erro fetchOrder:', e);
    }
    setLoading(false);
  }

  if (loading || !order) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#FFD700" /></View>;
  }

  const status = STATUS_LABELS[order.status] || { label: order.status || 'Desconhecido', color: '#999' };

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      {!mapError ? (
        <MapView 
          style={{ flex: 1 }} 
          region={mapRegion}
          onError={(e) => { console.log('Map error:', e); setMapError(true); }}
        >
          {deliveryLocation && (
            <Marker coordinate={deliveryLocation} title="Entregador">
              <View style={{ backgroundColor: '#FF6B00', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' }}>
                <Text style={{ fontSize: 18 }}>🛵</Text>
              </View>
            </Marker>
          )}
          <Marker coordinate={{ latitude: -30.0819, longitude: -51.2450 }} title="Xis da Claudinha">
            <View style={{ backgroundColor: '#D32F2F', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFD700' }}>
              <Text style={{ fontSize: 18 }}>🍔</Text>
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' }}>
          <Text style={{ color: '#A9A9A9', fontSize: 16 }}>🗺️ Mapa indisponível</Text>
          <Text style={{ color: '#666', fontSize: 12, marginTop: 8 }}>O rastreamento continua funcionando</Text>
        </View>
      )}

      <View style={styles.trackingCard}>
        <Text style={{ color: '#FFD700', fontSize: 18, fontWeight: 'bold' }}>Pedido #{order.id ? order.id.slice(0, 8) : '???'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={{ color: '#FFF', fontSize: 16, marginLeft: 8, fontWeight: '600' }}>{status.label}</Text>
        </View>
        <Text style={{ color: '#A9A9A9', marginTop: 8 }}>
          Pagamento: {(order.payment_method || 'PIX').toUpperCase()} • {(order.payment_status || 'PENDENTE').toUpperCase()}
        </Text>
        <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>
          {formatCurrency(order.total)}
        </Text>
        {order.status === 'entregue' && (
          <TouchableOpacity style={styles.rateBtn} onPress={() => Linking.openURL('https://wa.me/5551989111389?text=Oi! Recebi meu pedido, queria deixar um feedback!')}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>⭐ Avaliar no WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ==================== NAVEGAÇÃO E APP ====================
const Stack = createNativeStackNavigator();

export default function App() {
  const [cart, setCart] = useState([]);
  const [userInfo, setUserInfo] = useState({ phone: '', address: {} });
  const notificationListener = useRef();
  const responseListener = useRef();

  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = cart.reduce((sum, item) => sum + (item.finalPrice || 0), 0);

  const addToCart = (product) => {
    setCart(prev => [...prev, product]);
  };

  const removeFromCart = (index) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const newCart = [...prev];
      const newQty = (newCart[index].quantity || 1) + delta;
      if (newQty <= 0) {
        newCart.splice(index, 1);
      } else {
        newCart[index] = {
          ...newCart[index],
          quantity: newQty,
          finalPrice: (newCart[index].unitPrice || newCart[index].finalPrice || 0) * newQty,
        };
      }
      return newCart;
    });
  };

  const clearCart = () => setCart([]);

  useEffect(() => {
    registerForPushNotificationsAsync();
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Resposta notificação:', response);
    });
    return () => {
      try {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      } catch (e) {
        console.log('Erro ao remover subscription:', e);
      }
    };
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#FFD700' }}>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Montar Pedido' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: '🛒 Meu Carrinho' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Pagamento' }} />
            <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: '📋 Meus Pedidos' }} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: '📍 Rastreamento' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartContext.Provider>
    </UserContext.Provider>
  );
}

// ==================== ESTILOS ====================
const styles = StyleSheet.create({
  homeContainer: { flex: 1, backgroundColor: '#121212' },
  detailContainer: { flex: 1, backgroundColor: '#121212' },
  cartContainer: { flex: 1, backgroundColor: '#121212' },
  centerContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1E1E1E', paddingTop: 50 },
  logoText: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  headerIconBtn: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerIconText: { fontSize: 16 },
  cartIcon: { backgroundColor: '#D32F2F', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  cartIconText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 100 },
  banner: { margin: 20, padding: 20, borderRadius: 15, backgroundColor: '#D32F2F' },
  bannerTitle: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  bannerSub: { color: '#FFF', marginTop: 5, fontSize: 14, fontWeight: 'bold' },
  categoryTitle: { color: '#FFD700', fontSize: 22, fontWeight: 'bold', marginLeft: 20, marginTop: 20, marginBottom: 10 },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 10, borderLeftWidth: 4, borderColor: '#FF6F00' },
  productInfo: { flex: 1, marginRight: 10 },
  productName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  productDesc: { color: '#A9A9A9', fontSize: 12, marginTop: 5 },
  productPrice: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },

  detailImagePlaceholder: { height: 220, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  detailImageText: { color: '#FFD700', fontSize: 24, fontWeight: 'bold' },
  detailContent: { padding: 20, flex: 1 },
  detailName: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  detailDesc: { color: '#A9A9A9', fontSize: 16, marginTop: 5, marginBottom: 16 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  qtyBtn: { backgroundColor: '#D32F2F', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  qtyText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginHorizontal: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  extraItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  extraItemSelected: { backgroundColor: '#D32F2F', borderColor: '#FFD700' },
  extraName: { color: '#FFF', fontSize: 16 },
  extraNameSelected: { color: '#FFD700', fontWeight: 'bold' },
  extraPrice: { color: '#FFD700', fontSize: 16 },
  obsInput: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 15, borderRadius: 8, minHeight: 80, borderWidth: 1, borderColor: '#333', textAlignVertical: 'top' },
  detailFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1E1E1E', borderTopWidth: 1, borderColor: '#333' },
  detailTotal: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  detailUnit: { color: '#A9A9A9', fontSize: 12 },
  addButton: { backgroundColor: '#D32F2F', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10 },
  addButtonText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },

  emptyCartText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  emptyCartSub: { color: '#A9A9A9', fontSize: 16, marginTop: 10 },
  backToMenuBtn: { backgroundColor: '#D32F2F', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, marginTop: 20 },
  backToMenuText: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  cartItem: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 10, marginBottom: 10 },
  cartItemName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cartItemExtra: { color: '#A9A9A9', fontSize: 12, marginTop: 2 },
  cartItemObs: { color: '#FFD700', fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  cartItemPrice: { color: '#FFD700', fontSize: 16, marginTop: 5 },
  removeText: { fontSize: 18 },
  cartFooter: { padding: 20, backgroundColor: '#1E1E1E', borderTopWidth: 1, borderColor: '#333', position: 'absolute', bottom: 0, left: 0, right: 0 },
  cartTotalText: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  checkoutButton: { backgroundColor: '#4CAF50', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  checkoutButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  checkoutTitle: { color: '#FFD700', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  checkoutSection: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  checkoutInput: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 10, fontSize: 15 },
  paymentOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 16, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  paymentOptionActive: { borderColor: '#FFD700', backgroundColor: '#2A1A00' },
  paymentOptionText: { color: '#FFF', fontSize: 16 },
  checkoutSummary: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#333' },
  checkoutFooter: { padding: 20, backgroundColor: '#1E1E1E', borderTopWidth: 1, borderColor: '#333', position: 'absolute', bottom: 0, left: 0, right: 0 },
  confirmButton: { backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: '#121212', fontSize: 18, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', padding: 24, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  whatsappLargeBtn: { backgroundColor: '#25D366', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },

  orderCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#333' },

  trackingCard: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  rateBtn: { backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },

  whatsappButton: { position: 'absolute', bottom: 30, left: 20, backgroundColor: '#25D366', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, elevation: 5 },
  whatsappText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
