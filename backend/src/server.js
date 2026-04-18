import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Routes
app.get('/', (req, res) => {
    res.status(200).json({ status: 'API is running' });
});

app.use('/api/v1', routes);

const PORT = process.env.PORT || 8080;
const HTTPS = process.env.NODE_ENV === 'production';

// Start server with HTTPS if available
async function startServer() {
    try {
        const options = HTTPS ? {
            key: fs.readFileSync('certs/private.key'),
            cert: fs.readFileSync('certs/cert.crt')
        } : {};

        https || http).createServer(options, app)
            .listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();
