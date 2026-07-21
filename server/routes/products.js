const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Cliente de Supabase con permisos de admin para saltar RLS cuando sea necesario en el servidor
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 1. Obtener todos los productos (Público)
router.get('/', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    // Mapear image_url a image para compatibilidad con el frontend
    const formattedProducts = products.map(p => ({
      ...p,
      image: p.image_url
    }));

    res.json(formattedProducts);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener los productos.' });
  }
});

// 2. Obtener un producto por ID (Público)
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.json({
      ...product,
      image: product.image_url
    });
  } catch (err) {
    console.error('Error al obtener producto:', err);
    res.status(500).json({ error: 'Error al obtener el producto.' });
  }
});

// 3. Crear un nuevo producto (Solo Admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, price, category, image, image_url, stock, details } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, precio, categoría).' });
  }

  const finalImageUrl = image || image_url || 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=600&q=80';

  try {
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([{ name, description, price, category, image_url: finalImageUrl, stock, details }])
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({
      ...newProduct,
      image: newProduct.image_url
    });
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ error: 'Error al crear el producto.', detail: err.message });
  }
});

// 4. Actualizar un producto (Solo Admin)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, price, category, image, image_url, stock, details } = req.body;
  const finalImageUrl = image || image_url;

  try {
    const updateData = { name, description, price, category, stock, details };
    if (finalImageUrl) {
      updateData.image_url = finalImageUrl;
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...updatedProduct,
      image: updatedProduct.image_url
    });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: 'Error al actualizar el producto.', detail: err.message });
  }
});

// 5. Eliminar un producto (Solo Admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Producto eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar el producto.', detail: err.message });
  }
});

module.exports = router;
