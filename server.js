import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import stripe from 'stripe';
import paypal from 'paypal-rest-sdk';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import https from 'https';

// Load environment variables
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (NODE_ENV === 'production') {
    const requiredEnv = [
        'STRIPE_SECRET_KEY',
        'PAYPAL_CLIENT_ID',
        'PAYPAL_CLIENT_SECRET',
        'PAYPAL_WEBHOOK_ID',
        'JWT_SECRET',
        'ADMIN_USERNAME',
        'ADMIN_PASSWORD_HASH',
    ];

    const missing = requiredEnv.filter(key => !process.env[key]);
    if (missing.length) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;

// Initialize Express app
const app = express();

// ==================== SECURITY MIDDLEWARE ====================

// Helmet: Set security HTTP headers (CSP set below)
app.use(helmet({
    contentSecurityPolicy: false,
    strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

// CSP nonce generator
app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
});

// Content Security Policy with reporting
app.use((req, res, next) => {
    const nonce = res.locals.cspNonce;
    const reportEndpoint = '/api/csp-report';

    const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://www.paypal.com https://static.parastorage.com https://connect.facebook.net`,
        "style-src 'self'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.stripe.com https://api.paypal.com https://www.paypal.com",
        "frame-src 'self' https://js.stripe.com https://www.paypal.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        `report-uri ${reportEndpoint}`,
        "report-to csp-endpoint",
    ].join('; ');

    const reportTo = {
        group: 'csp-endpoint',
        max_age: 10886400,
        endpoints: [{ url: reportEndpoint }],
    };

    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('Report-To', JSON.stringify(reportTo));
    res.setHeader('Reporting-Endpoints', `csp-endpoint="${reportEndpoint}"`);
    next();
});

// CORS: Cross-Origin Resource Sharing
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // limit authentication attempts
    skipSuccessfulRequests: true,
});

const paymentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit payment requests
});

app.use(limiter);

// Body Parser & Sanitization
app.use(express.json({
    limit: '10mb',
    type: ['application/json', 'application/csp-report', 'application/reports+json'],
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ key }) => {
        console.warn(`Potentially malicious data in ${key} was sanitized`);
    },
}));

// ==================== PAYMENT GATEWAY SETUP ====================

// Stripe Configuration
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// PayPal Configuration
paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// ==================== AUTHENTICATION ====================

// Generate JWT Token
function generateToken(userId, expiresIn = '24h') {
    return jwt.sign(
        { userId, iat: Date.now() },
        JWT_SECRET,
        { expiresIn }
    );
}

// Verify JWT Token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// Authentication Middleware
// eslint-disable-next-line no-unused-vars
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.userId = decoded.userId;
    next();
}

// ==================== ADMIN LOGIN ====================

app.post('/api/admin/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Verify admin credentials (in production, use database)
        if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
            return res.status(500).json({ error: 'Admin credentials not configured' });
        }

        const adminUsername = ADMIN_USERNAME;
        const adminPasswordHash = ADMIN_PASSWORD_HASH;

        const isValidUsername = username === adminUsername;
        const isValidPassword = await bcryptjs.compare(password, adminPasswordHash);

        if (!isValidUsername || !isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken('admin_user');
        res.json({ 
            token, 
            expiresIn: '24h',
            message: 'Login successful' 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ==================== PAYMENT ROUTES ====================

// Create Stripe Payment Intent
app.post('/api/payments/stripe/create-intent', paymentLimiter, async (req, res) => {
    try {
        const { amount, currency, orderId, customerEmail, description } = req.body;

        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        if (!customerEmail || !customerEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Create payment intent
        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency || 'usd',
            description: description || `Order ${orderId}`,
            receipt_email: customerEmail,
            metadata: {
                orderId: orderId || uuidv4(),
                customerEmail: customerEmail,
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Confirm Stripe Payment
app.post('/api/payments/stripe/confirm', paymentLimiter, async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment intent ID required' });
        }

        const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            res.json({
                success: true,
                transactionId: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                message: 'Payment successful',
            });
        } else {
            res.status(400).json({
                success: false,
                error: `Payment ${paymentIntent.status}`,
            });
        }
    } catch (error) {
        console.error('Stripe confirmation error:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

async function verifyStripePayment(paymentIntentId, expectedTotal) {
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    const expectedAmount = Math.round(Number(expectedTotal) * 100);

    if (paymentIntent.status !== 'succeeded') {
        return { valid: false, error: `Payment ${paymentIntent.status}` };
    }

    if (Number.isNaN(expectedAmount) || expectedAmount <= 0) {
        return { valid: false, error: 'Invalid order total' };
    }

    if (paymentIntent.amount !== expectedAmount) {
        return { valid: false, error: 'Order total does not match payment amount' };
    }

    return { valid: true, paymentIntent };
}

// Create PayPal Payment
app.post('/api/payments/paypal/create', paymentLimiter, async (req, res) => {
    try {
        const { amount, orderId, customerEmail, items, returnUrl, cancelUrl } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const paymentDetails = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal',
                email: customerEmail,
            },
            redirect_urls: {
                return_url: returnUrl || `${process.env.CLIENT_URL}/checkout?status=success`,
                cancel_url: cancelUrl || `${process.env.CLIENT_URL}/checkout?status=cancelled`,
            },
            transactions: [
                {
                    amount: {
                        total: amount.toFixed(2),
                        currency: 'USD',
                        details: {
                            subtotal: amount.toFixed(2),
                        },
                    },
                    description: `Order ${orderId}`,
                    invoice_number: orderId,
                    item_list: {
                        items: items || [],
                    },
                },
            ],
        };

        return new Promise((resolve, reject) => {
            paypal.payment.create(paymentDetails, (error, payment) => {
                if (error) {
                    console.error('PayPal error:', error);
                    reject({ error: 'Failed to create PayPal payment' });
                } else {
                    const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
                    resolve({
                        paymentId: payment.id,
                        approvalUrl: approvalUrl.href,
                    });
                }
            });
        }).then(result => res.json(result)).catch(error => res.status(500).json(error));
    } catch (error) {
        console.error('PayPal payment creation error:', error);
        res.status(500).json({ error: 'Failed to create PayPal payment' });
    }
});

// Execute PayPal Payment
app.post('/api/payments/paypal/execute', paymentLimiter, async (req, res) => {
    try {
        const { paymentId, payerId } = req.body;

        if (!paymentId || !payerId) {
            return res.status(400).json({ error: 'Payment ID and Payer ID required' });
        }

        return new Promise((resolve, reject) => {
            paypal.payment.execute(paymentId, { payer_id: payerId }, (error, payment) => {
                if (error) {
                    console.error('PayPal execution error:', error);
                    reject({ error: 'Failed to execute payment' });
                } else if (payment.state === 'approved') {
                    resolve({
                        success: true,
                        transactionId: payment.id,
                        amount: payment.transactions[0].amount.total,
                        currency: payment.transactions[0].amount.currency,
                        message: 'Payment successful',
                    });
                } else {
                    reject({ error: `Payment ${payment.state}` });
                }
            });
        }).then(result => res.json(result)).catch(error => res.status(500).json(error));
    } catch (error) {
        console.error('PayPal execution error:', error);
        res.status(500).json({ error: 'Failed to execute payment' });
    }
});

// ==================== ORDER ROUTES ====================

// Create Order
app.post('/api/orders', paymentLimiter, async (req, res) => {
    try {
        const { items, total, customer, paymentMethod, paymentIntentId } = req.body;

        // Validate input
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain items' });
        }

        if (!total || total <= 0) {
            return res.status(400).json({ error: 'Invalid order total' });
        }

        if (!customer || !customer.email || !customer.name) {
            return res.status(400).json({ error: 'Customer information required' });
        }

        if (!paymentMethod) {
            return res.status(400).json({ error: 'Payment method required' });
        }

        if (paymentMethod === 'stripe') {
            if (!paymentIntentId) {
                return res.status(400).json({ error: 'Payment intent ID required' });
            }

            const verification = await verifyStripePayment(paymentIntentId, total);
            if (!verification.valid) {
                return res.status(400).json({ error: verification.error });
            }
        }

        const orderId = `ORDER-${Date.now()}-${uuidv4().substring(0, 8)}`;

        const order = {
            id: orderId,
            items,
            total,
            customer,
            paymentMethod,
            paymentIntentId,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        // In production, save to database
        // await Order.create(order);

        res.json({
            success: true,
            orderId: order.id,
            message: 'Order created successfully',
            order,
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get Order Status
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID required' });
        }

        // In production, fetch from database
        // const order = await Order.findById(orderId);

        res.json({
            orderId,
            status: 'completed',
            message: 'Order found',
        });
    } catch (error) {
        console.error('Order retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve order' });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ==================== CSP REPORTING ====================

app.post('/api/csp-report', (req, res) => {
    console.warn('CSP Violation Report:', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        report: req.body,
    });
    res.status(204).end();
});

// ==================== ERROR HANDLING ====================

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 3000;

if (isMain) {
    if (NODE_ENV === 'production' && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
        // HTTPS Server
        const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
        const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
        const credentials = { key: privateKey, cert: certificate };

        https.createServer(credentials, app).listen(PORT, () => {
            console.log(`🔒 Secure server running on https://localhost:${PORT}`);
            console.log(`Environment: ${NODE_ENV}`);
        });
    } else {
        // HTTP Server (development only)
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`Environment: ${NODE_ENV}`);
            if (NODE_ENV !== 'production') {
                console.log('⚠️  WARNING: Running in development mode. Use HTTPS in production!');
            }
        });
    }
}

export default app;
