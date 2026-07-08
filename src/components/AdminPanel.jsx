import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  ClipboardList, 
  DollarSign, 
  Package, 
  Eye,
  CheckCircle,
  Clock,
  Truck,
  XCircle
} from 'lucide-react';

export default function AdminPanel({ 
  products, 
  orders, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onUpdateOrderStatus,
  onUploadImage,
  onDeleteOrder
}) {
  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // 'dashboard', 'catalog', 'orders'
  const [editingProduct, setEditingProduct] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State for Adding/Editing
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Mates',
    stock: '',
    description: '',
    image: '',
    material: '',
    virola: '',
    origen: ''
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Dashboard Stats
  const totalSales = orders
    .filter(o => o.status !== 'Cancelado')
    .reduce((sum, order) => sum + order.total, 0);
  
  const lowStockCount = products.filter(p => p.stock <= 3).length;
  
  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const publicUrl = await onUploadImage(file);
      if (publicUrl) {
        setProductForm(prev => ({ ...prev, image: publicUrl }));
      }
    } catch (err) {
      console.error(err);
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: '',
      category: 'Mates',
      stock: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=600&q=80', // Default placeholder unsplash
      material: '',
      virola: '',
      origen: ''
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      description: product.description,
      image: product.image,
      material: product.details?.material || product.details?.capacidad || '',
      virola: product.details?.virola || product.details?.peso || '',
      origen: product.details?.origen || product.details?.termicidad || ''
    });
    setIsFormOpen(true);
  };

  // Submit Product Form
  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || productForm.stock === '') {
      alert('Por favor, completa los campos requeridos (Nombre, Precio y Stock).');
      return;
    }

    const priceNum = parseFloat(productForm.price);
    const stockNum = parseInt(productForm.stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('El precio debe ser un número positivo.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      alert('El stock no puede ser negativo.');
      return;
    }

    const parsedDetails = {};
    if (productForm.category === 'Mates') {
      if (productForm.material) parsedDetails.material = productForm.material;
      if (productForm.virola) parsedDetails.virola = productForm.virola;
      if (productForm.origen) parsedDetails.origen = productForm.origen;
    } else if (productForm.category === 'Termos') {
      if (productForm.material) parsedDetails.capacidad = productForm.material; // Reusado
      if (productForm.virola) parsedDetails.material = productForm.virola; // Reusado
      if (productForm.origen) parsedDetails.termicidad = productForm.origen; // Reusado
    } else {
      if (productForm.material) parsedDetails.peso = productForm.material; // Reusado
      if (productForm.virola) parsedDetails.estacionamiento = productForm.virola; // Reusado
      if (productForm.origen) parsedDetails.sabor = productForm.origen; // Reusado
    }

    const itemData = {
      name: productForm.name,
      price: priceNum,
      category: productForm.category,
      stock: stockNum,
      description: productForm.description,
      image: productForm.image || 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=600&q=80',
      details: parsedDetails
    };

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...itemData });
      alert('Producto actualizado con éxito.');
    } else {
      const newId = productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      onAddProduct({ ...itemData, id: `${newId}-${Date.now().toString().slice(-4)}` });
      alert('Producto creado con éxito.');
    }

    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      onDeleteProduct(id);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pendiente': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Preparando': return <Package className="w-4 h-4 text-blue-500" />;
      case 'Despachado': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'Completado': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Cancelado': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Preparando': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Despachado': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completado': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-brand-arena text-brand-dark';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 items-start">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white rounded-2xl border border-brand-arena p-5 shrink-0 shadow-xs space-y-4">
        <div>
          <h2 className="text-xs font-black uppercase text-brand-gold tracking-widest">Panel de Control</h2>
          <p className="text-[10px] text-brand-gray">Gestión interna de MODO MATE</p>
        </div>
        
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => { setActiveSubTab('dashboard'); setIsFormOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 ${
              activeSubTab === 'dashboard'
                ? 'bg-brand-green-dark text-white shadow-md'
                : 'text-brand-dark hover:bg-brand-arena/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => { setActiveSubTab('catalog'); setIsFormOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 ${
              activeSubTab === 'catalog'
                ? 'bg-brand-green-dark text-white shadow-md'
                : 'text-brand-dark hover:bg-brand-arena/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo</span>
          </button>
          
          <button
            onClick={() => { setActiveSubTab('orders'); setIsFormOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 ${
              activeSubTab === 'orders'
                ? 'bg-brand-green-dark text-white shadow-md'
                : 'text-brand-dark hover:bg-brand-arena/50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Pedidos</span>
            {orders.filter(o => o.status === 'Pendiente').length > 0 && (
              <span className="ml-auto bg-amber-500 text-brand-dark font-black text-[10px] px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status === 'Pendiente').length}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-white rounded-2xl border border-brand-arena p-6 md:p-8 min-h-[550px] shadow-xs">
        
        {/* SUBTAB: DASHBOARD */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-brand-dark">Resumen de Ventas y Estado</h2>
              <p className="text-xs text-brand-gray">Vista global de la actividad comercial simulada.</p>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Stat 1 */}
              <div className="bg-brand-arena/30 rounded-2xl border border-brand-arena p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-brand-gray font-bold uppercase tracking-wider block">Facturación</span>
                  <span className="text-2xl font-black text-brand-green-dark">{formatPrice(totalSales)}</span>
                </div>
              </div>
              
              {/* Stat 2 */}
              <div className="bg-brand-arena/30 rounded-2xl border border-brand-arena p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-brand-gray font-bold uppercase tracking-wider block">Pedidos Realizados</span>
                  <span className="text-2xl font-black text-brand-dark">{orders.length}</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-brand-arena/30 rounded-2xl border border-brand-arena p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-brand-gray font-bold uppercase tracking-wider block">Stock Crítico (≤3)</span>
                  <span className="text-2xl font-black text-brand-dark">{lowStockCount}</span>
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Últimos Pedidos</h3>
              {orders.length === 0 ? (
                <p className="text-xs text-brand-gray italic bg-brand-arena/20 p-4 rounded-xl border border-dashed border-brand-arena">Aún no se han registrado compras simuladas en esta sesión.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-brand-arena">
                  <table className="w-full text-left text-xs divide-y divide-brand-arena">
                    <thead className="bg-brand-arena/30 text-brand-dark font-black">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-arena">
                      {orders.slice(-5).reverse().map(order => (
                        <tr key={order.id} className="hover:bg-brand-arena/10">
                          <td className="p-3 font-bold font-mono text-brand-green-dark">{order.id}</td>
                          <td className="p-3 font-medium">{order.customer}</td>
                          <td className="p-3 text-brand-gray">{order.date}</td>
                          <td className="p-3 font-bold">{formatPrice(order.total)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB: CATALOG MANAGEMENT */}
        {activeSubTab === 'catalog' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-brand-dark">Catálogo de Productos</h2>
                <p className="text-xs text-brand-gray">Crear, actualizar y eliminar productos del e-commerce.</p>
              </div>
              {!isFormOpen && (
                <button
                  onClick={handleOpenCreate}
                  className="bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 self-start sm:self-auto shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Producto</span>
                </button>
              )}
            </div>

            {/* CRUD Form (Visible when isFormOpen === true) */}
            {isFormOpen && (
              <div className="bg-brand-arena/15 rounded-2xl border border-brand-arena p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-brand-arena">
                  <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">
                    {editingProduct ? `Editar: ${editingProduct.name}` : 'Crear Nuevo Producto'}
                  </h3>
                  <button 
                    onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
                
                <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-brand-dark mb-1">Nombre *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={productForm.name}
                      onChange={handleFormChange}
                      placeholder="Ej: Mate Torpedo de Algarrobo"
                      className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-brand-dark mb-1">Precio (ARS) *</label>
                    <input
                      type="number"
                      name="price"
                      required
                      value={productForm.price}
                      onChange={handleFormChange}
                      placeholder="28000"
                      className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-brand-dark mb-1">Stock disponible *</label>
                    <input
                      type="number"
                      name="stock"
                      required
                      value={productForm.stock}
                      onChange={handleFormChange}
                      placeholder="10"
                      className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-brand-dark mb-1">Categoría</label>
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={handleFormChange}
                      className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green"
                    >
                      <option value="Mates">Mates</option>
                      <option value="Termos">Termos</option>
                      <option value="Yerbas">Yerbas</option>
                      <option value="Hierbas">Hierbas</option>
                      <option value="Accesorios">Accesorios</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-brand-dark mb-1">Imagen del Producto *</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isUploading}
                          className="text-xs text-brand-dark file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-brand-green/10 file:text-brand-green-dark hover:file:bg-brand-green/20 file:cursor-pointer"
                        />
                        {isUploading && (
                          <span className="text-xs text-brand-gold font-bold animate-pulse">Subiendo...</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-brand-gray uppercase font-bold">O ingresar URL:</span>
                        <input
                          type="text"
                          name="image"
                          value={productForm.image}
                          onChange={handleFormChange}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-1 bg-white border border-brand-arena rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-green text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-brand-dark mb-1">Descripción</label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleFormChange}
                      placeholder="Detalles sobre el producto, madera, elaboración, etc."
                      rows={3}
                      className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green"
                    />
                  </div>
                  
                  {/* Custom fields depending on category */}
                  <div className="sm:col-span-3 grid grid-cols-3 gap-3 pt-2 border-t border-brand-arena">
                    <div>
                      <label className="block font-semibold text-brand-dark mb-1">
                        {productForm.category === 'Mates' ? 'Material' : productForm.category === 'Termos' ? 'Capacidad' : 'Peso / Contenido'}
                      </label>
                      <input
                        type="text"
                        name="material"
                        value={productForm.material}
                        onChange={handleFormChange}
                        placeholder={productForm.category === 'Mates' ? 'Calabaza / Madera' : productForm.category === 'Termos' ? '1.2 Litros' : '1 kg'}
                        className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-brand-dark mb-1">
                        {productForm.category === 'Mates' ? 'Virola' : productForm.category === 'Termos' ? 'Material' : 'Estacionamiento'}
                      </label>
                      <input
                        type="text"
                        name="virola"
                        value={productForm.virola}
                        onChange={handleFormChange}
                        placeholder={productForm.category === 'Mates' ? 'Alpaca pulida' : productForm.category === 'Termos' ? 'Acero 18/8' : '18 meses'}
                        className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-brand-dark mb-1">
                        {productForm.category === 'Mates' || productForm.category === 'Termos' ? 'Origen / Conservación' : 'Notas de sabor'}
                      </label>
                      <input
                        type="text"
                        name="origen"
                        value={productForm.origen}
                        onChange={handleFormChange}
                        placeholder={productForm.category === 'Mates' ? 'Argentina' : productForm.category === 'Termos' ? 'Caliente 24hs' : 'Sabor ahumado'}
                        className="w-full bg-white border border-brand-arena rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="bg-brand-green hover:bg-brand-green-dark text-white font-bold px-6 py-2 rounded-lg"
                    >
                      {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Catalog Products List */}
            <div className="overflow-x-auto rounded-xl border border-brand-arena">
              <table className="w-full text-left text-xs divide-y divide-brand-arena">
                <thead className="bg-brand-arena/30 text-brand-dark font-black">
                  <tr>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Precio</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-arena">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-brand-arena/10">
                      <td className="p-3 flex items-center gap-3">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-10 h-10 object-cover rounded-lg border border-brand-arena bg-brand-arena shrink-0" 
                        />
                        <span className="font-bold text-brand-dark">{product.name}</span>
                      </td>
                      <td className="p-3">
                        <span className="bg-brand-green-light text-brand-green-dark font-bold px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{formatPrice(product.price)}</td>
                      <td className="p-3">
                        <span className={`font-bold ${product.stock <= 3 ? 'text-amber-600 font-extrabold' : 'text-brand-dark'}`}>
                          {product.stock} u.
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 bg-brand-arena hover:bg-brand-gray/30 text-brand-dark rounded"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-200 text-red-600 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB: ORDERS LIST & MANAGEMENT */}
        {activeSubTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-brand-dark">Gestión de Pedidos</h2>
              <p className="text-xs text-brand-gray">Monitorear y actualizar el estado de los pedidos realizados.</p>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-brand-gray italic bg-brand-arena/20 p-4 rounded-xl border border-dashed border-brand-arena">Aún no se han registrado compras simuladas en esta sesión.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-brand-arena">
                <table className="w-full text-left text-xs divide-y divide-brand-arena">
                  <thead className="bg-brand-arena/30 text-brand-dark font-black">
                    <tr>
                      <th className="p-3">Pedido ID</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Detalles / Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-arena">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-brand-arena/10">
                        <td className="p-3 font-bold font-mono text-brand-green-dark" title={order.id}>
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="p-3 font-medium">{order.customer_name || order.customer}</td>
                        <td className="p-3 text-brand-gray">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : order.date}
                        </td>
                        <td className="p-3 font-bold">{formatPrice(order.total)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1.5 p-1.5 bg-brand-arena hover:bg-brand-gray/30 text-brand-dark rounded font-semibold"
                            title="Ver detalles"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                          
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-white border border-brand-arena rounded p-1 text-[10px] font-bold focus:outline-none focus:border-brand-green"
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Preparando">Preparando</option>
                            <option value="Despachado">Despachado</option>
                            <option value="Completado">Completado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>

                          <button
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de que deseas eliminar este pedido permanentemente de la base de datos?')) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Modal Detail for Order */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-brand-dark/40 backdrop-blur-xs"></div>
                <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-xl p-6 overflow-hidden max-h-[85vh] flex flex-col text-xs space-y-4 animate-scale-up">
                  <div className="flex justify-between items-center pb-2 border-b border-brand-arena">
                    <div>
                      <h3 className="text-sm font-black text-brand-dark">Detalle Pedido: <span className="font-mono text-brand-green-dark">{selectedOrder.id}</span></h3>
                      <p className="text-[10px] text-brand-gray">
                        Fecha: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('es-AR') : selectedOrder.date}
                      </p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="text-brand-gray hover:text-brand-dark">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-brand-green-dark">1. Datos del Cliente</p>
                    <div className="bg-brand-arena/30 rounded-xl p-3 border border-brand-arena space-y-1 text-brand-dark/95">
                      <p><strong>Nombre:</strong> {selectedOrder.customer_name || selectedOrder.customer}</p>
                      <p><strong>Email:</strong> {selectedOrder.customer_email || selectedOrder.email}</p>
                      <p><strong>Teléfono:</strong> {selectedOrder.customer_phone || selectedOrder.phone}</p>
                      <p><strong>Dirección:</strong> {selectedOrder.customer_address || selectedOrder.address}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-brand-green-dark">2. Productos Comprados</p>
                    <div className="border border-brand-arena rounded-xl divide-y divide-brand-arena overflow-hidden">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="p-2.5 flex justify-between bg-white">
                          <div>
                            <p className="font-bold text-brand-dark">{item.name}</p>
                            <p className="text-[10px] text-brand-gray">Cant: {item.quantity} x {formatPrice(item.price)}</p>
                          </div>
                          <span className="font-bold text-brand-dark">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="p-2.5 flex justify-between bg-brand-arena/10 font-bold border-t border-brand-arena text-brand-dark">
                        <span>Total Pedido:</span>
                        <span className="text-brand-green-dark text-sm">{formatPrice(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-brand-arena flex items-center justify-between">
                    <div>
                      <p className="font-bold text-brand-dark">Medio de Pago:</p>
                      <p className="text-brand-gray text-[10px]">{selectedOrder.payment_method || selectedOrder.paymentMethod}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-brand-arena/40 px-3 py-1.5 rounded-full border border-brand-arena font-bold">
                      {getStatusIcon(selectedOrder.status)}
                      <span className="text-[10px] text-brand-dark">{selectedOrder.status}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full bg-brand-green text-white font-bold py-2.5 rounded-xl text-center"
                  >
                    Cerrar Detalles
                  </button>
                </div>
              </div>
            )}
            
          </div>
        )}

      </main>
      
    </div>
  );
}
