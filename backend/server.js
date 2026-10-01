// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection } from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import emailRoutes from './src/routes/email.routes.js';
import statusRoutes from './src/routes/status.routes.js';
import accountsRoutes from './src/routes/accounts.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion BDD (non bloquante)
testConnection().catch((err) => {
    console.warn('MySQL non configuré ou hors ligne, fonctionnement mode fichier persistant.');
});

// Middlewares CORS permissif pour le réseau azim404 et le dev
app.use(cors({
    origin: (origin, callback) => {
        // Autorise les requêtes sans origine (curl, scripts), localhost ou domaines azim404
        if (!origin || /azim404\.com$/.test(new URL(origin).hostname) || /localhost|127\.0\.0\.1/.test(origin)) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
}));

app.use(express.json());

// Logger (dev)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
        next();
    });
}

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Azim404 API Hub', status: 'online', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/site-status', statusRoutes);
app.use('/api/private-accounts', accountsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route non trouvée' }));

// Démarrage
app.listen(PORT, () => {
    console.log(`Serveur Azim404 API actif sur le port ${PORT}`);
});
