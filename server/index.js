const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Render (y la mayoría de los hosts) corren detrás de un proxy inverso.
// Sin esto, Express no puede identificar la IP real de cada visitante y
// el rate limiter termina agrupando a TODOS los usuarios bajo la misma IP.
app.set('trust proxy', 1);

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
// Las lecturas públicas (GET) no cuentan: no tiene sentido limitar la
// navegación del catálogo con el mismo balde que las escrituras de admin.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Límite de 300 solicitudes de escritura por IP
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta nuevamente más tarde.' },
  skip: (req) => req.method === 'GET'
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
