const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware para verificar que el usuario está logueado
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Falta token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Validar token con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Error en autenticación:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Middleware para verificar que el usuario es administrador
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  try {
    // Consultar el rol del usuario en la tabla profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    next();
  } catch (err) {
    console.error('Error al verificar admin:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = {
  requireAuth,
  requireAdmin
};
