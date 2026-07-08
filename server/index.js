const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173', // Entorno de desarrollo local
  'https://modo-mate.pages.dev', // URL del hosting definitivo en Cloudflare
  'https://modo-mate.franciscochaulet011.workers.dev', // URL actual temporal
  'https://modomate1.com.ar', // Dominio de producción oficial
  'https://www.modomate1.com.ar' // Dominio de producción con www
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como apps móviles o curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'La política CORS de este sitio no permite el acceso desde el origen especificado.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Rate Limiter para proteger contra ataques de denegación de servicio (DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 solicitudes por IP
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta nuevamente más tarde.' }
});

app.use(limiter);

// Rutas de la API
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));

// Ruta base de chequeo de salud (Health Check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[SERVER] Servidor MODO MATE corriendo en el puerto ${PORT}`);
});
