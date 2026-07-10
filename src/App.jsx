import { useState, useEffect } from 'react';
import { initialProducts } from './data/mockProducts';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import { ArrowLeft, Check, Sparkles, Heart, Info, ArrowRight, Truck, CreditCard, Phone, MapPin, LayoutGrid, Leaf, Sprout, Clock, ExternalLink, Store, Mail, Send } from 'lucide-react';
import Logo from './components/Logo';
import { supabase } from './lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  // --- Estados Globales ---
  const [products, setProducts] = useState(initialProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Estados de Autenticación de Supabase
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('customer'); // 'customer' | 'admin'

  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('mm_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'productos' | 'contacto'
  const [currentTab, setCurrentTab] = useState('shop'); // 'shop' | 'product-detail'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Contacto Form States
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSendingContact, setIsSendingContact] = useState(false);

  // Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Simulador de envío en la vista detalle
  const [detailZipCode, setDetailZipCode] = useState('');
  const [detailShippingCost, setDetailShippingCost] = useState(null);
  const [detailZipChecked, setDetailZipChecked] = useState(false);

  // --- Cargar Productos desde la API ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error('Error al obtener productos');
        const data = await response.json();
        setProducts(data.length > 0 ? data : initialProducts);
      } catch (err) {
        console.warn('[API] Error de conexión con el backend, usando fallback local de productos:', err.message);
        setProducts(initialProducts);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // --- Listener de Autenticación de Supabase ---
  useEffect(() => {
    // 1. Obtener sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    // 2. Escuchar cambios en la autenticación (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole('customer');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (profile && !error) {
        setUserRole(profile.role);
      }
    } catch (err) {
      console.error('Error al obtener rol del usuario:', err);
    }
  };

  // --- Cargar Pedidos si el usuario es Administrador ---
  useEffect(() => {
    const fetchOrders = async () => {
      if (userRole === 'admin' && session?.access_token) {
        try {
          const response = await fetch(`${API_URL}/api/orders/admin`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          if (!response.ok) throw new Error('Error al obtener pedidos de administrador');
          const data = await response.json();
          setOrders(data);
        } catch (err) {
          console.error('[API] Error al cargar pedidos:', err.message);
        }
      }
    };
    fetchOrders();
  }, [userRole, session]);

  // --- Sincronización LocalStorage ---
  useEffect(() => {
    localStorage.setItem('mm_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- Handlers de Carrito ---
  const handleAddToCart = (product, quantity = 1) => {
    const existing = cartItems.find(item => item.id === product.id);
    const availableStock = product.stock;

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > availableStock) {
        alert(`Disculpas, solo quedan ${availableStock} unidades disponibles de este producto.`);
        return;
      }
      setCartItems(cartItems.map(item => 
        item.id === product.id ? { ...item, quantity: newQty } : item
      ));
    } else {
      if (quantity > availableStock) {
        alert(`Disculpas, solo quedan ${availableStock} unidades disponibles.`);
        return;
      }
      setCartItems([...cartItems, { ...product, quantity }]);
    }
    
    // Feedback visual rápido
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      alert(`Disculpas, solo quedan ${product.stock} unidades en stock.`);
      return;
    }
    setCartItems(cartItems.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // --- Handlers de Pedidos ---
  const handleAddOrder = async (orderData) => {
    // Si no está logueado, alertar (requerimiento de OAuth)
    if (!user) {
      alert('Debes iniciar sesión con Google para poder finalizar la compra.');
      handleGoogleLogin();
      return null;
    }

    try {
      // 1. Registrar pedido en el backend
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          customer_name: orderData.customer,
          customer_email: orderData.email,
          customer_phone: orderData.phone,
          customer_address: orderData.address,
          customer_city: orderData.customerCity || '',
          customer_zip: orderData.customerZip || '',
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          shipping_cost: orderData.shippingCost || 0,
          payment_method: orderData.paymentMethodType
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al procesar el pedido en el servidor');
      }

      const createdOrder = await response.json();
      setOrders([createdOrder, ...orders]);

      // Si el método de pago es Mercado Pago, generar la preferencia y redirigir
      if (orderData.paymentMethodType === 'mercadopago') {
        const mpResponse = await fetch(`${API_URL}/api/payments/create-preference`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            orderId: createdOrder.id
          })
        });

        if (!mpResponse.ok) {
          throw new Error('Error al generar la preferencia de pago en Mercado Pago');
        }

        const mpData = await mpResponse.json();
        
        // Redirigir al Checkout de Mercado Pago
        if (mpData.init_point) {
          window.location.href = mpData.init_point;
        } else {
          throw new Error('No se obtuvo el enlace de cobro de Mercado Pago.');
        }
      }

      // Devolver la orden creada con su ID real para el modal de éxito (transferencia o simulación)
      return createdOrder;

    } catch (err) {
      console.error('Error al registrar orden:', err);
      alert(err.message || 'Hubo un problema al procesar tu compra. Por favor intenta nuevamente.');
      return null;
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Error al actualizar el estado del pedido');
      
      const updatedOrder = await response.json();
      setOrders(orders.map(order => order.id === orderId ? updatedOrder : order));
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado: ' + err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar el pedido');

      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el pedido: ' + err.message);
    }
  };

  // --- Handlers de Catálogo (Admin CRUD) ---
  const handleAddProduct = async (newProduct) => {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newProduct)
      });

      if (!response.ok) throw new Error('Error al agregar el producto');

      const savedProduct = await response.json();
      setProducts([savedProduct, ...products]);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el producto: ' + err.message);
    }
  };

  const handleUpdateProduct = async (updatedProduct) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updatedProduct)
      });

      if (!response.ok) throw new Error('Error al actualizar el producto');

      const savedProduct = await response.json();
      setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
      if (selectedProduct?.id === savedProduct.id) {
        setSelectedProduct(savedProduct);
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el producto: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar el producto');

      setProducts(products.filter(p => p.id !== productId));
      setCartItems(cartItems.filter(item => item.id !== productId));
      if (selectedProduct?.id === productId) {
        setCurrentTab('shop');
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el producto: ' + err.message);
    }
  };

  // --- Handler para subir imágenes a Supabase Storage ---
  const handleImageUpload = async (file) => {
    try {
      // Generar nombre de archivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir el archivo al bucket 'products'
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading image to Supabase:', err);
      throw new Error('No se pudo subir la imagen. Verifica que el bucket "products" esté creado como público en Supabase.');
    }
  };

  // --- Handler para el Formulario de Contacto ---
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Por favor, completa los campos obligatorios.');
      return;
    }

    try {
      setIsSendingContact(true);
      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`¡Gracias por tu mensaje, ${contactForm.name}! Nos comunicaremos con vos a la brevedad por WhatsApp o correo electrónico.`);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      alert('Ocurrió un error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setIsSendingContact(false);
    }
  };

  // --- Navegación a Detalle de Producto ---
  const handleViewProductDetails = (product) => {
    setSelectedProduct(product);
    setDetailZipCode('');
    setDetailShippingCost(null);
    setDetailZipChecked(false);
    setCurrentTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Filtrado de Productos ---
  const filteredProducts = products.filter(product => {
    const matchesCategory = categoryFilter === 'Todos' || product.category === categoryFilter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Formatear precios en pesos
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  // --- Handlers de Autenticación de Supabase ---
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error al iniciar sesión con Google:', err.message);
      alert('Error al iniciar sesión: ' + err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setUserRole('customer');
      setCurrentPage('home');
      setCurrentTab('shop');
    } catch (err) {
      console.error('Error al cerrar sesión:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-arena/20 flex flex-col font-sans text-brand-dark">
      {/* Navbar Global */}
      <Navbar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        userRole={userRole}
        onLogin={handleGoogleLogin}
        onLogout={handleSignOut}
      />

      {/* RUTA: VISTA ADMINISTRADOR */}
      {userRole === 'admin' ? (
        <AdminPanel 
          products={products}
          orders={orders}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUploadImage={handleImageUpload}
          onDeleteOrder={handleDeleteOrder}
        />
      ) : (
        /* RUTA: VISTA CLIENTE */
        <>
          {/* ================================================================ */}
          {/* PÁGINA: INICIO                                                   */}
          {/* ================================================================ */}
          {currentPage === 'home' && (
            <div className="animate-fade-in flex-1">

              {/* ── Hero Principal ── */}
              <section className="relative overflow-hidden bg-brand-green-dark text-white py-16 sm:py-24 px-4">
                <div className="absolute inset-0 opacity-10 bg-radial-gradient from-white to-transparent"></div>
                {/* Patrón decorativo de hojas */}
                <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.04]">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <path d="M100 10 C60 30, 20 80, 40 120 C60 160, 90 180, 100 190 C110 180, 140 160, 160 120 C180 80, 140 30, 100 10Z" fill="white"/>
                  </svg>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                  <div className="max-w-xl text-center md:text-left space-y-6">
                    <div className="inline-flex items-center gap-1.5 bg-brand-gold/20 text-brand-gold rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Desde 2024 · San Cristóbal, Santa Fe</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] text-white m-0">
                      Tomar mate es <br className="hidden sm:inline" />
                      siempre una <br className="hidden sm:inline" />
                      <span className="text-brand-gold">buena idea.</span>
                    </h2>
                    <p className="text-sm sm:text-base text-brand-green-light/90 leading-relaxed max-w-lg">
                      Mates artesanales, termos premium, yerbas orgánicas y mucho más. Cada producto lleva un pedacito de nuestro corazón.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => { setCurrentPage('productos'); setCurrentTab('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-bold text-sm px-8 py-3.5 rounded-full transition-all hover:scale-[1.03] hover:shadow-lg shadow-brand-gold/30 uppercase tracking-wider"
                      >
                        Ver Productos
                      </button>
                      <a
                        href="https://www.instagram.com/modo__mate/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-2 border-white/30 hover:border-white/60 text-white font-bold text-sm px-8 py-3.5 rounded-full transition-all hover:bg-white/10 text-center uppercase tracking-wider"
                      >
                        Seguinos ✦
                      </a>
                    </div>
                  </div>
                  {/* Logo decorativo grande */}
                  <div className="w-52 h-52 md:w-72 md:h-72 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner relative">
                    <div className="w-40 h-40 md:w-56 md:h-56 text-white">
                      <Logo className="w-full h-full opacity-20" />
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Franja de Beneficios (Trust Badges) ── */}
              <section className="bg-white border-b border-brand-arena py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-brand-arena/20 border border-brand-arena/50 hover:border-brand-green/35 hover:scale-[1.01] hover:shadow-xs transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center text-brand-green-dark shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Envío a Todo el País</h4>
                      <p className="text-[10px] text-brand-gray font-semibold mt-0.5">Gratis superando los $75.000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-brand-arena/20 border border-brand-arena/50 hover:border-brand-green/35 hover:scale-[1.01] hover:shadow-xs transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center text-brand-green-dark shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Pagos Flexibles</h4>
                      <p className="text-[10px] text-brand-gray font-semibold mt-0.5">3 Cuotas sin interés o 10% OFF efectivo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-brand-arena/20 border border-brand-arena/50 hover:border-brand-green/35 hover:scale-[1.01] hover:shadow-xs transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center text-brand-green-dark shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">WhatsApp Directo</h4>
                      <p className="text-[10px] text-brand-gray font-semibold mt-0.5">Asesoramiento personalizado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-brand-arena/20 border border-brand-arena/50 hover:border-brand-green/35 hover:scale-[1.01] hover:shadow-xs transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center text-brand-green-dark shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Local en San Cristóbal</h4>
                      <p className="text-[10px] text-brand-gray font-semibold mt-0.5">J.M. Bullo 1275, Santa Fe</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Sobre Nosotros / Nuestra Historia ── */}
              <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Columna de texto */}
                    <div className="space-y-6">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">Nuestra Historia</span>
                        <h3 className="text-2xl sm:text-3xl font-black text-brand-dark mt-2 leading-tight section-title-accent">
                          Un sueño llamado <br />Modo Mate 🧉
                        </h3>
                      </div>
                      <div className="space-y-4 text-sm text-brand-gray leading-relaxed">
                        <p>
                          En mayo de 2024 nació <strong className="text-brand-dark">Modo Mate</strong> con mucha ilusión, incertidumbre y ganas de crear algo lindo. Lo que empezó como un sueño se convirtió en un espacio donde cada mate que sale de nuestra matería lleva un pedacito de nuestro corazón.
                        </p>
                        <p>
                          Creemos que el mate no es solo un objeto — es <strong className="text-brand-dark">compañía, encuentros, charlas, abrazos y recuerdos</strong>. Por eso, cada producto que ofrecemos está elegido con cuidado, pensando en vos y en esos momentos que te hacen bien.
                        </p>
                        <p>
                          Gracias a cada persona que confió en nosotros, que recomendó nuestro trabajo, que compartió una foto o que simplemente se acercó al local. Ustedes hicieron posible esta historia.
                        </p>
                      </div>
                      {/* Línea de tiempo mini */}
                      <div className="flex items-center gap-4 pt-4">
                        <div className="flex items-center gap-2 bg-brand-arena/40 rounded-full px-4 py-2">
                          <Clock className="w-4 h-4 text-brand-green-dark" />
                          <span className="text-xs font-bold text-brand-dark">Mayo 2024</span>
                        </div>
                        <div className="h-px flex-1 bg-brand-arena"></div>
                        <div className="flex items-center gap-2 bg-brand-green-dark rounded-full px-4 py-2">
                          <Sparkles className="w-4 h-4 text-brand-gold" />
                          <span className="text-xs font-bold text-white">+1 Año ✨</span>
                        </div>
                      </div>
                    </div>
                    {/* Columna de imagen */}
                    <div className="relative">
                      <div className="rounded-3xl overflow-hidden shadow-xl border border-brand-arena">
                        <img 
                          src="/images/local-modo-mate.png" 
                          alt="Interior del local Modo Mate en San Cristóbal, Santa Fe" 
                          className="w-full h-80 sm:h-96 object-cover"
                        />
                      </div>
                      {/* Badge flotante */}
                      <div className="absolute -bottom-4 -left-4 bg-brand-green-dark text-white rounded-2xl px-5 py-3 shadow-lg border-4 border-white">
                        <p className="text-xs font-bold uppercase tracking-wider">🤎 Hecho con amor</p>
                        <p className="text-[10px] text-brand-green-light mt-0.5">San Cristóbal, Santa Fe</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Instagram / Redes Sociales ── */}
              <section className="py-16 sm:py-20 bg-brand-arena/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center space-y-3 mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">Seguinos en Redes</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-brand-dark section-title-accent">
                      @modo__mate
                    </h3>
                    <p className="text-sm text-brand-gray max-w-md mx-auto">
                      Compartimos novedades, promos y todo lo que pasa en el local. ¡Sumate a la comunidad matera!
                    </p>
                  </div>
                  {/* Grid de preview con la foto de productos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <div className="group relative rounded-2xl overflow-hidden shadow-md border border-brand-arena hover-lift-glow cursor-pointer">
                      <img 
                        src="/images/mates-artesanales.png" 
                        alt="Mates artesanales Modo Mate" 
                        className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <p className="text-white text-xs font-bold">🧉 Mates artesanales imperiales con detalles en alpaca</p>
                      </div>
                    </div>
                    <div className="group relative rounded-2xl overflow-hidden shadow-md border border-brand-arena hover-lift-glow cursor-pointer">
                      <img 
                        src="/images/local-modo-mate.png" 
                        alt="Local Modo Mate" 
                        className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <p className="text-white text-xs font-bold">🏪 Nuestro local en San Cristóbal con yerbas a granel</p>
                      </div>
                    </div>
                    <div className="group relative rounded-2xl overflow-hidden shadow-md border border-brand-arena hover-lift-glow cursor-pointer sm:col-span-2 lg:col-span-1">
                      <div className="w-full h-72 bg-brand-green-dark flex flex-col items-center justify-center gap-4 text-white p-8">
                        <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          {/* Instagram SVG inline */}
                          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" />
                            <circle cx="12" cy="12" r="5" />
                            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="font-black text-lg">@modo__mate</p>
                          <p className="text-xs text-brand-green-light/80 mt-1">Seguinos para ver novedades y promos 🌿</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Botón CTA Instagram */}
                  <div className="text-center">
                    <a
                      href="https://www.instagram.com/modo__mate/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-green-dark hover:bg-brand-dark text-white font-bold text-sm px-8 py-3.5 rounded-full transition-all hover:scale-[1.03] hover:shadow-lg uppercase tracking-wider"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <circle cx="12" cy="12" r="5" />
                        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                      </svg>
                      Seguinos en Instagram
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </section>

              {/* ── Ubicación del Local ── */}
              <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center space-y-3 mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">Visitanos</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-brand-dark section-title-accent">
                      Nuestro Local 🏪
                    </h3>
                    <p className="text-sm text-brand-gray max-w-md mx-auto">
                      Vení a conocernos y elegí tu mate favorito en persona
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Info del local */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-brand-arena/30 rounded-2xl p-6 border border-brand-arena space-y-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-green-dark flex items-center justify-center text-white shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-brand-dark">Dirección</h4>
                            <p className="text-xs text-brand-gray mt-0.5">J.M. Bullo 1275</p>
                            <p className="text-xs text-brand-gray">San Cristóbal, Santa Fe</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-green-dark flex items-center justify-center text-white shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-brand-dark">Horarios</h4>
                            <p className="text-xs text-brand-gray mt-0.5">Lunes a Viernes: 9:00 - 13:00 / 17:00 - 21:00</p>
                            <p className="text-xs text-brand-gray">Sábados: 9:00 - 13:00</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-green-dark flex items-center justify-center text-white shrink-0">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-brand-dark">Contacto</h4>
                            <p className="text-xs text-brand-gray mt-0.5">WhatsApp disponible para consultas</p>
                          </div>
                        </div>
                      </div>
                      {/* Botón CTA Productos */}
                      <button
                        onClick={() => { setCurrentPage('productos'); setCurrentTab('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm px-6 py-3.5 rounded-full transition-all hover:scale-[1.02] hover:shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <Store className="w-4 h-4" />
                        Explorar Productos
                      </button>
                    </div>
                    {/* Google Maps embed */}
                    <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-lg border border-brand-arena" style={{ minHeight: '360px' }}>
                      <iframe
                        title="Ubicación MODO MATE - San Cristóbal, Santa Fe"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3449.5!2d-61.2376!3d-30.3103!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSan+Crist%C3%B3bal%2C+Santa+Fe!5e0!3m2!1ses!2sar!4v1700000000000"
                        width="100%"
                        height="100%"
                        style={{ border: 0, minHeight: '360px' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ================================================================ */}
          {/* PÁGINA: PRODUCTOS                                                */}
          {/* ================================================================ */}
          {currentPage === 'productos' && (
            <>
          {/* TAB 1: TIENDA / CATALOGO */}
          {currentTab === 'shop' && (
            <div className="animate-fade-in flex-1">
              
              {/* Hero Banner Compacto de Productos */}
              <section className="relative overflow-hidden bg-brand-green-dark text-white py-8 sm:py-10 px-4">
                <div className="absolute inset-0 opacity-10 bg-radial-gradient from-white to-transparent"></div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="max-w-xl text-center md:text-left space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white m-0">
                      Nuestros <span className="text-brand-gold">Productos</span>
                    </h2>
                    <p className="text-sm text-brand-green-light/80 leading-relaxed">
                      Explorá nuestra selección de mates artesanales imperiales, termos premium y yerbas orgánicas estacionadas.
                    </p>
                  </div>
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-white/20 font-black text-4xl tracking-widest uppercase text-center font-sans select-none leading-tight">MODO<br />MATE</span>
                  </div>
                </div>
              </section>

              {/* Categorías y Filtros */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-brand-arena pb-6 gap-6">
                  <div>
                    <h3 className="text-lg font-black text-brand-dark uppercase tracking-wider section-title-accent">Nuestros Productos</h3>
                    <p className="text-xs text-brand-gray mt-1">Filtrá por categoría para encontrar lo que buscás</p>
                  </div>
                  
                  {/* Grilla Circular de Categorías */}
                  <div className="flex gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none pb-2">
                    {[
                      { name: 'Todos', icon: <LayoutGrid className="w-5 h-5" /> },
                      { 
                        name: 'Mates', 
                        icon: (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 10c0 3.5 2 5.5 5 5.5s5-2 5-5.5c0-1-1.5-1.5-1.5-1.5h-7S7 9 7 10z" />
                            <ellipse cx="12" cy="8.5" rx="5" ry="1.5" />
                            <path d="M12.5 8l2.5-4.5" />
                          </svg>
                        ) 
                      },
                      { 
                        name: 'Termos', 
                        icon: (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="8" y="7" width="8" height="13" rx="2" />
                            <path d="M10 7V4h4v3" />
                            <path d="M8 11h8" />
                          </svg>
                        ) 
                      },
                      { name: 'Yerbas', icon: <Leaf className="w-5 h-5" /> },
                      { name: 'Hierbas', icon: <Sprout className="w-5 h-5" /> },
                      { 
                        name: 'Accesorios', 
                        icon: (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M12 8v5" />
                            <circle cx="12" cy="15" r="1" />
                          </svg>
                        ) 
                      }
                    ].map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setCategoryFilter(cat.name)}
                        className={`category-circle-btn ${categoryFilter === cat.name ? 'active' : ''}`}
                      >
                        <div className="circle-icon-wrapper">
                          {cat.icon}
                        </div>
                        <span className="circle-label">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Total productos mostrados */}
                  <span className="text-xs font-bold text-brand-dark bg-brand-arena px-3.5 py-2 rounded-xl border border-brand-arena/80 self-start md:self-auto shrink-0 shadow-2xs">
                    🏷️ {filteredProducts.length} productos
                  </span>
                </div>
              </section>

              {/* Grid de Productos */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-brand-arena p-8 max-w-md mx-auto space-y-4">
                    <p className="text-sm font-bold text-brand-dark">No encontramos productos que coincidan con tu búsqueda.</p>
                    <p className="text-xs text-brand-gray">Probá ingresando otras palabras clave o cambiando la categoría seleccionada.</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setCategoryFilter('Todos'); }}
                      className="bg-brand-green text-white font-bold text-xs px-5 py-2 rounded-full"
                    >
                      Restaurar Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                    {filteredProducts.map(product => (
                      <ProductCard 
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onViewDetails={handleViewProductDetails}
                      />
                    ))}
                  </div>
                )}
              </section>

            </div>
          )}

          {/* TAB 2: DETALLE DE PRODUCTO */}
          {currentTab === 'product-detail' && selectedProduct && (
            <div className="animate-fade-in flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              {/* Botón Volver */}
              <button 
                onClick={() => { setCurrentTab('shop'); setSelectedProduct(null); }}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-green-dark hover:text-brand-green mb-6 border border-brand-arena bg-white py-2 px-4 rounded-xl shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Catálogo</span>
              </button>

              {/* Split Screen Detail */}
              <div className="bg-white rounded-3xl border border-brand-arena overflow-hidden flex flex-col md:flex-row gap-8 p-6 md:p-8 shadow-xs">
                {/* Left: Product Image */}
                <div className="w-full md:w-1/2 aspect-square rounded-2xl overflow-hidden bg-brand-arena border border-brand-arena shrink-0">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right: Product Meta & Purchase info */}
                <div className="flex-1 flex flex-col gap-6 py-2">
                  <div className="space-y-2">
                    <span className="bg-brand-green-light text-brand-green-dark text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-brand-green/20">
                      {selectedProduct.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-brand-dark leading-tight">{selectedProduct.name}</h2>
                    
                    {/* Prices */}
                    <div className="pt-2 flex items-baseline gap-4">
                      <span className="text-2xl sm:text-3xl font-black text-brand-green-dark">
                        {formatPrice(selectedProduct.price)}
                      </span>
                      <div className="text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                        💬 {formatPrice(selectedProduct.price * 0.9)} en efectivo/transferencia
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-brand-gray leading-relaxed border-t border-brand-arena pt-4">
                    {selectedProduct.description}
                  </p>

                  {/* Ficha técnica o detalles dinámicos */}
                  {selectedProduct.details && (
                    <div className="bg-brand-arena/20 rounded-2xl border border-brand-arena p-4 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green-dark flex items-center gap-1.5">
                        <Info className="w-4 h-4" />
                        <span>Ficha Técnica</span>
                      </h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        {Object.entries(selectedProduct.details).map(([key, val]) => (
                          <div key={key} className="flex flex-col sm:flex-row sm:justify-between border-b border-brand-arena pb-1 capitalize">
                            <dt className="text-brand-gray font-semibold">{key.replace('_', ' ')}:</dt>
                            <dd className="font-bold text-brand-dark">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Simulador de Envío en Detalle (Inspirado en PlatinoGear) */}
                  <div className="bg-brand-arena/20 p-4 rounded-2xl border border-brand-arena space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green-dark flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      <span>Calcular Costo de Envío</span>
                    </h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Código Postal (Ej: 1425)"
                        value={detailZipCode}
                        onChange={(e) => setDetailZipCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="flex-1 bg-white border border-brand-arena rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-green"
                      />
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          if (!detailZipCode) return;
                          if (selectedProduct.price >= 95000) {
                            setDetailShippingCost(0);
                          } else {
                            const code = parseInt(detailZipCode) || 0;
                            // A) Santa Fe (Local)
                            const isSantaFe = (code >= 2000 && code <= 2699) || (code >= 3000 && code <= 3099);
                            
                            // B) Regional
                            const isRegional = 
                              (code >= 1000 && code <= 1999) || // CABA y GBA
                              (code >= 2700 && code <= 2999) || // Norte de Buenos Aires
                              (code >= 3100 && code <= 3399) || // Entre Ríos y Misiones
                              (code >= 3400 && code <= 3499) || // Corrientes
                              (code >= 3500 && code <= 3799) || // Chaco, Formosa, Reconquista
                              (code >= 5000 && code <= 5999) || // Córdoba y San Luis
                              (code >= 6000 && code <= 8199);   // Interior de Buenos Aires
                              
                            if (isSantaFe) {
                              setDetailShippingCost(9900); // Provincial (Santa Fe)
                            } else if (isRegional) {
                              setDetailShippingCost(11500); // Regional
                            } else {
                              setDetailShippingCost(13000); // Nacional
                            }
                          }
                          setDetailZipChecked(true);
                        }}
                        className="bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        Calcular
                      </button>
                    </div>
                    {detailZipChecked && (
                      <div className="text-xs font-semibold px-1 flex justify-between">
                        <span className="text-brand-gray">Costo de entrega:</span>
                        <span className={detailShippingCost === 0 ? "text-green-600 font-extrabold" : "text-brand-dark"}>
                          {detailShippingCost === 0 ? "¡Envío GRATIS!" : formatPrice(detailShippingCost)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Purchase Selector & Call to Action */}
                  <div className="mt-auto border-t border-brand-arena pt-6 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-brand-gray">Disponibilidad en local:</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        selectedProduct.stock === 0 
                          ? 'bg-red-100 text-red-800' 
                          : selectedProduct.stock <= 3 
                          ? 'bg-amber-100 text-amber-800 font-extrabold' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedProduct.stock === 0 ? 'Sin stock' : selectedProduct.stock <= 3 ? `¡Sólo quedan ${selectedProduct.stock} unidades!` : `${selectedProduct.stock} unidades`}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      {/* Add to Cart button */}
                      <button
                        disabled={selectedProduct.stock === 0}
                        onClick={() => handleAddToCart(selectedProduct, 1)}
                        className={`flex-1 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                          selectedProduct.stock === 0
                            ? 'bg-brand-arena text-brand-gray/50 cursor-not-allowed shadow-none'
                            : 'bg-brand-green text-white hover:bg-brand-green-dark shadow-brand-green/20'
                        }`}
                      >
                        <span>Agregar al Carrito</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related products list */}
              <section className="mt-12 space-y-6">
                <h3 className="text-lg font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2 section-title-accent">
                  <Heart className="w-5 h-5 text-brand-gold fill-brand-gold" />
                  <span>Otros Productos Relacionados</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products
                    .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                    .slice(0, 4)
                    .map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onViewDetails={handleViewProductDetails}
                      />
                    ))
                  }
                  {products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).length === 0 && (
                    <p className="text-xs text-brand-gray italic">No hay otros productos en esta categoría por el momento.</p>
                  )}
                </div>
              </section>
            </div>
          )}
          </>
          )}

          {/* ================================================================ */}
          {/* PÁGINA: CONTACTO                                                 */}
          {/* ================================================================ */}
          {currentPage === 'contacto' && (
            <div className="animate-fade-in flex-1 bg-brand-arena/10 py-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Cabecera Minimalista */}
                <div className="text-center max-w-xl mx-auto space-y-4">
                  <span className="inline-flex items-center gap-1 bg-brand-green/10 text-brand-green-dark px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Contacto</span>
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-widest text-brand-dark uppercase">Ponte en Contacto</h2>
                  <p className="text-sm text-brand-gray font-medium leading-relaxed">
                    ¿Tenés alguna duda, consulta o querés realizar un pedido especial? Escribinos y te responderemos lo antes posible.
                  </p>
                </div>

                {/* Formulario y Tarjeta de Detalles */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Bloque Formulario */}
                  <div className="bg-white p-6 sm:p-8 border border-brand-arena shadow-xs space-y-6">
                    <h3 className="text-lg font-bold text-brand-dark uppercase tracking-wider border-b border-brand-arena pb-3">Envianos un mensaje</h3>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Juan Pérez"
                          className="w-full bg-white border border-brand-arena px-4 py-2.5 focus:outline-none focus:border-brand-green text-sm text-brand-dark transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Correo Electrónico *</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="juan@email.com"
                          className="w-full bg-white border border-brand-arena px-4 py-2.5 focus:outline-none focus:border-brand-green text-sm text-brand-dark transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Teléfono / WhatsApp</label>
                        <input
                          type="text"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="3408 67-1408"
                          className="w-full bg-white border border-brand-arena px-4 py-2.5 focus:outline-none focus:border-brand-green text-sm text-brand-dark transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Mensaje *</label>
                        <textarea
                          required
                          rows="4"
                          value={contactForm.message}
                          onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Hola, me gustaría saber si tienen stock de..."
                          className="w-full bg-white border border-brand-arena px-4 py-2.5 focus:outline-none focus:border-brand-green text-sm text-brand-dark transition-all resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingContact}
                        className="w-full bg-brand-green-dark text-white hover:bg-brand-green font-bold text-xs uppercase tracking-widest py-3.5 transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSendingContact ? 'Enviando...' : 'Enviar Mensaje'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Bloque Información de Contacto */}
                  <div className="space-y-6">
                    
                    {/* Tarjeta de Canales */}
                    <div className="bg-white p-6 sm:p-8 border border-brand-arena shadow-xs space-y-6">
                      <h3 className="text-lg font-bold text-brand-dark uppercase tracking-wider border-b border-brand-arena pb-3">Nuestros Canales</h3>
                      
                      <div className="space-y-4">
                        {/* WhatsApp */}
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-brand-gray uppercase tracking-wider">WhatsApp Directo</p>
                            <p className="text-sm font-semibold text-brand-dark">+54 9 3408 67-1408</p>
                            <a
                              href="https://wa.me/5493408671408"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#25D366] font-bold hover:underline"
                            >
                              <span>Chatear ahora</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Local Físico */}
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green-dark shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-brand-gray uppercase tracking-wider">Local Físico</p>
                            <p className="text-sm font-semibold text-brand-dark">J.M. Bullo 1275, San Cristóbal, Santa Fe</p>
                          </div>
                        </div>

                        {/* Horarios */}
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-brand-gray uppercase tracking-wider">Horarios de Atención</p>
                            <p className="text-sm font-semibold text-brand-dark">Lunes a Viernes: 9:00 - 13:00 / 17:00 - 21:00</p>
                            <p className="text-sm font-semibold text-brand-dark">Sábados: 9:00 - 13:00</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mapa embebido */}
                    <div className="bg-white border border-brand-arena overflow-hidden h-72 shadow-xs relative">
                      <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3434.721469145695!2d-61.1685412!3d-30.3020286!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x944a95ef3963fdab%3A0xe9f798e4d3db2529!2sJ.%20M.%20Bullo%201275%2C%20S3040%20San%20Crist%C3%B3bal%2C%20Santa%20Fe!5e0!3m2!1ses-419!2sar!4v1720098000000!5m2!1ses-419!2sar" 
                        className="w-full h-full border-none"
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Global */}
      <Footer setCurrentTab={setCurrentTab} setCurrentPage={setCurrentPage} />

      {/* CART DRAWER PANEL */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* CHECKOUT MODAL PASARELA */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onClearCart={handleClearCart}
        onAddOrder={handleAddOrder}
      />
    </div>
  );
}

export default App;
