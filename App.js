import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, Linking, TextInput, Modal
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

// ==================== CARDAPIO COMPLETO ====================
const MENU_FALLBACK = [
  // XISS
  { id: 1, name: 'Carne de Panela', description: 'Bife, maionese, milho, ervilha, tomate, alface, ovo, queijo', price: 45.50, category: 'Xiss', is_available: true },
  { id: 2, name: 'De Carne', description: 'Bife, maionese, milho, ervilha, tomate, alface, ovo, queijo', price: 27.00, category: 'Xiss', is_available: true },
  { id: 3, name: 'Coração', description: 'Coração, maionese, ervilha, tomate, alface, ovo, queijo', price: 37.50, category: 'Xiss', is_available: true },
  { id: 4, name: 'Coração c/ Bacon', description: 'Coração, bacon, maionese, ervilha, tomate, alface, ovo, queijo', price: 39.90, category: 'Xiss', is_available: true },
  { id: 5, name: 'Bagunça', description: 'Coração, frango, bacon, calabresa, maionese, milho, ervilha, tomate, alface, ovo e queijo', price: 45.50, category: 'Xiss', is_available: true },
  { id: 6, name: 'Frango', description: 'Frango, maionese, milho, ervilha, tomate, alface, ovo, queijo', price: 28.50, category: 'Xiss', is_available: true },
  { id: 7, name: 'Frango c/ Bacon', description: 'Frango, bacon, maionese, milho, ervilha, tomate, alface, ovo, queijo', price: 39.90, category: 'Xiss', is_available: true },
  { id: 8, name: 'Bacon', description: 'Bacon, maionese, milho, ervilha, tomate, alface, ovo, queijo', price: 38.00, category: 'Xiss', is_available: true },
  { id: 9, name: 'Calabresa', description: 'Calabresa, maionese, milho, ervilha, tomate, alface, ovo, queijo', price: 29.50, category: 'Xiss', is_available: true },
  { id: 10, name: 'Acebolado', description: 'Bife, cebola, maionese, milho, ervilha, tomate, alface, ovo, queijo', price: 30.50, category: 'Xiss', is_available: true },
  { id: 11, name: 'Moda da Casa', description: '2 Bifes, alface, milho, ervilha, tomate, maionese temperada no alho, acebolado e queijo', price: 38.50, category: 'Xiss', is_available: true },
  { id: 12, name: 'Strogonoff', description: 'Strogonoff de carne, maionese, milho, ervilha, tomate, alface, ovo, queijo', price: 40.00, category: 'Xiss', is_available: true },
  // DOG E PRENSADO
  { id: 20, name: 'Prensado', description: 'Maionese, presunto, queijo, ovo e bife', price: 22.00, category: 'Dog e Prensado', is_available: true },
  { id: 21, name: 'Cachorro Simples', description: 'Salsicha, maionese, milho, ervilha, tomate', price: 18.00, category: 'Dog e Prensado', is_available: true },
  { id: 22, name: 'Cachorro Especial', description: '2 salsichas, maionese, milho, ervilha, tomate', price: 22.00, category: 'Dog e Prensado', is_available: true },
  { id: 23, name: 'Cachorro Calabresa', description: 'Calabresa, maionese, milho, ervilha, tomate', price: 20.00, category: 'Dog e Prensado', is_available: true },
  // BEBIDAS
  { id: 30, name: 'Refri Lata', description: 'Coca-Cola, Guaraná, Fanta ou Sprite', price: 6.00, category: 'Bebidas', is_available: true },
  { id: 31, name: 'Refri 600ml', description: 'Coca-Cola, Guaraná, Fanta ou Sprite', price: 9.00, category: 'Bebidas', is_available: true },
  { id: 32, name: 'Refri 2L', description: 'Coca-Cola, Guaraná, Fanta ou Sprite', price: 14.00, category: 'Bebidas', is_available: true },
  { id: 33, name: 'Água', description: 'Água mineral sem gás', price: 4.00, category: 'Bebidas', is_available: true },
];

function groupByCategory(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

// ==================== TELA INICIAL ====================
function HomeScreen({ navigation }) {
  const [menuData, setMenuData] = useState({});
  const [loading, setLoading] = useState(true);
  const { itemCount } = useContext(CartContext);
  const isOpen = checkOpenStatus();

  useEffect(() => {
    const grouped = groupByCategory(MENU_FALLBACK);
    setMenuData(grouped);
    setLoading(false);
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
        <Text style={styles.logoText}>Xiss DA CLAUDINHA</Text>
        <TouchableOpacity style={styles.cartIcon} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIconText}>🛒 {itemCount}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>🔥 O Sabor que te Prende!</Text>
          <Text style={styles.bannerSub}>
            {isOpen ? '🟢 Aberto agora! Peça já!' : '🔴 Fechado no momento. Volte a partir das 19h!'}
          </Text>
        </View>

        {Object.keys(menuData).map(category => (
          <View key={category}>
            <Text style={styles.categoryTitle}>
              {category === 'Xiss' ? '🍔' : category === 'Dog e Prensado' ? '🌭' : '🥤'} {category}
            </Text>
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

        {/* Instagram e Feedback */}
        <View style={{ margin: 20, marginTop: 30 }}>
          <TouchableOpacity style={styles.instagramButton} onPress={() => Linking.openURL('https://www.instagram.com/oxissdaclaudinha')}>
            <Text style={styles.instagramText}>📸 Siga @oxissdaclaudinha</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedbackButton} onPress={() => Linking.openURL('https://wa.me/5551989111389?text=Oi Claudinha! Acabei de comer meu Xiss e queria contar como foi! 😋')}>
            <Text style={styles.feedbackText}>💬 Conta pra gente como foi seu Xiss!</Text>
          </TouchableOpacity>
        </View>

        {/* by Midon discreto */}
        <View style={{ alignItems: 'center', marginBottom: 30, marginTop: 10 }}>
          <Text style={{ color: '#444', fontSize: 11 }}>by Midon</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.whatsappButton} onPress={() => Linking.openURL('https://wa.me/5551989111389')}>
        <Text style={styles.whatsappText}>💬 Falar com a Claudinha</Text>
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
    { id: 1, name: '🧀 Queijo, Ovo e Presunto', price: 3.00 },
    { id: 2, name: '🧅 Cebola', price: 3.00 },
    { id: 3, name: '🧀 Cheddar e Catupiry', price: 6.00 },
    { id: 4, name: '🥩 Bife Extra', price: 8.00 },
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
          placeholder="Ex: Sem milho, sem ervilha, sem cebola, sem maionese..."
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
  const { cart, removeFromCart, clearCart, total, itemCount } = useContext(CartContext);

  if (cart.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyCartText}>Seu carrinho está vazio!</Text>
        <Text style={styles.emptyCartSub}>Adicione um Xiss raiz aí! 🍔</Text>
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

// ==================== TELA DE CHECKOUT (OFFLINE) ====================
function CheckoutScreen({ navigation }) {
  const { cart, total, clearCart } = useContext(CartContext);
  const { userInfo, setUserInfo } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [address, setAddress] = useState(userInfo.address || {
    street: '', number: '', complement: '', neighborhood: '', city: 'Viamão', phone: userInfo.phone || ''
  });
  const [showPixModal, setShowPixModal] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address.street || !address.number || !address.phone) {
      Alert.alert('Ops!', 'Preencha o endereço completo e telefone');
      return;
    }

    setUserInfo({ ...userInfo, address, phone: address.phone });

    if (paymentMethod === 'pix') {
      setShowPixModal(true);
    } else {
      sendOrderViaWhatsApp();
    }
  };

  const sendOrderViaWhatsApp = () => {
    setLoading(true);

    let message = `*🍔 NOVO PEDIDO - Xiss da Claudinha*\n\n`;
    message += `*Cliente:* ${address.phone}\n`;
    message += `*Endereço:* ${address.street}, ${address.number}`;
    if (address.complement) message += ` - ${address.complement}`;
    message += `\n*Bairro:* ${address.neighborhood}\n`;
    message += `*Cidade:* ${address.city}\n\n`;
    message += `*📋 ITENS DO PEDIDO:*\n`;

    cart.forEach((item, idx) => {
      message += `\n${idx + 1}. *${item.quantity}x ${item.name}* — ${formatCurrency(item.finalPrice)}\n`;
      if (item.extras.length > 0) {
        item.extras.forEach(ext => {
          message += `   ➕ ${ext.name}\n`;
        });
      }
      if (item.observations) {
        message += `   📝 ${item.observations}\n`;
      }
    });

    message += `\n*💰 TOTAL: ${formatCurrency(total)}*\n`;
    message += `*💳 Pagamento:* ${paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'dinheiro' ? 'Dinheiro na entrega' : 'Cartão na entrega'}\n\n`;
    message += `_via app Xiss da Claudinha_`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5551989111389?text=${encodedMsg}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp. Verifique se está instalado.');
    });

    clearCart();
    setLoading(false);
    navigation.replace('Home');
  };

  const finishPixOrder = () => {
    setShowPixModal(false);
    sendOrderViaWhatsApp();
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
n          </View>
        </View>
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
              <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>(51) 98991-1389</Text>
              <Text style={{ color: '#A9A9A9', fontSize: 12, marginTop: 8 }}>NOME</Text>
              <Text style={{ color: '#FFF', fontSize: 16 }}>Claudinha Lanches</Text>
            </View>
            <TouchableOpacity style={styles.whatsappLargeBtn} onPress={() => Linking.openURL('https://wa.me/5551989111389?text=Oi! Acabei de fazer um pedido via app e vou enviar o comprovante do Pix!')}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>💬 Enviar Comprovante no WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12 }} onPress={finishPixOrder}>
              <Text style={{ color: '#4CAF50', fontSize: 16 }}>Já paguei, enviar pedido →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================== NAVEGAÇÃO E APP ====================
const Stack = createNativeStackNavigator();

export default function App() {
  const [cart, setCart] = useState([]);
  const [userInfo, setUserInfo] = useState({ phone: '', address: {} });

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

  const clearCart = () => setCart([]);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, itemCount }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#FFD700' }}>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Montar Pedido' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: '🛒 Meu Carrinho' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Pagamento' }} />
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

  instagramButton: { backgroundColor: '#E1306C', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  instagramText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  feedbackButton: { backgroundColor: '#333', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#555' },
  feedbackText: { color: '#FFF', fontSize: 14 },

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

  whatsappButton: { position: 'absolute', bottom: 30, left: 20, backgroundColor: '#25D366', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, elevation: 5 },
  whatsappText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
