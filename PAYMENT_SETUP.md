# threepeakviews.com - Secure E-Commerce Platform

> Production-ready e-commerce platform with integrated payment processing (Stripe & PayPal), advanced security features, and deployment-ready backend.

## 🚀 Features

### Payment Processing
- 💳 **Stripe Integration**: Credit/Debit card payments
- 🅿️ **PayPal Integration**: PayPal express checkout
- 🔒 **Secure Transactions**: PCI DSS compliant
- 📱 **Responsive Checkout**: Mobile-friendly payment forms
- 🔐 **SSL/HTTPS**: All communications encrypted

### Security
- 🛡️ **Helmet.js**: Security headers
- 🔑 **JWT Authentication**: Secure admin sessions
- ⏱️ **Rate Limiting**: DDoS protection
- 🧹 **Input Sanitization**: NoSQL injection prevention
- 🔒 **Password Hashing**: BCrypt encryption
- 📦 **CORS Protection**: Cross-origin security

### Backend
- ⚡ **Express.js**: Fast, reliable server
- 🌐 **RESTful APIs**: Clean API design
- 📊 **Payment Webhooks**: Real-time transaction updates
- 🗂️ **Modular Architecture**: Easy to maintain

### Admin Portal
- ➕ **Add Products**: Easily add new items
- ✏️ **Edit Prices**: Update product pricing in real-time
- 🗑️ **Manage Inventory**: Delete or modify products
- 📈 **Secure Access**: Protected admin dashboard

---

## 📦 Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Version control
- **Stripe Account**: https://stripe.com
- **PayPal Account**: https://paypal.com

### Quick Start

1. **Clone the Repository**
```bash
git clone <your-repo-url>
cd Ecommerce
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

4. **Start Development Server**
```bash
npm run dev
```

5. **Access the Application**
```
Frontend: http://localhost:3000
Admin Portal: http://localhost:3000/admin.html
API Health: http://localhost:3000/api/health
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-random-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$...

# SSL/HTTPS (Production)
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key

# CORS Settings
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Configuration
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_CLIENT_SECRET

# Client URL
CLIENT_URL=https://yourdomain.com
```

### Generating Secure Passwords

```bash
# Generate JWT Secret
openssl rand -hex 32

# Generate bcrypt password hash
node -e "require('bcryptjs').hash('YourPassword123!', 10).then(console.log)"
```

---

## 🛳️ Deployment

### Option 1: Heroku (Recommended for Beginners)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set configuration
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set STRIPE_SECRET_KEY=sk_live_...

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: DigitalOcean App Platform

```bash
# Push to GitHub
git push origin main

# In DigitalOcean:
# 1. Create new App from GitHub
# 2. Connect your repository
# 3. Set environment variables in Settings
# 4. Deploy
```

### Option 3: AWS Elastic Beanstalk

```bash
pip install awsebcli
eb init
eb create production
eb config
eb deploy
```

### Option 4: VPS (Ubuntu/Linux)

See [DEPLOYMENT_SECURITY_GUIDE.md](./DEPLOYMENT_SECURITY_GUIDE.md) for detailed VPS setup instructions.

---

## 💳 Payment Setup

### Stripe Setup

1. **Sign Up**: https://stripe.com
2. **Go to Dashboard**: https://dashboard.stripe.com
3. **Get API Keys**:
   - Developers > API Keys
   - Copy Publishable Key (pk_...) and Secret Key (sk_...)
4. **Set Webhook**:
   - Developers > Webhooks
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `charge.refunded`

### PayPal Setup

1. **Sign Up**: https://paypal.com/business
2. **Get Sandbox Credentials** (for testing):
   - Developer Dashboard > Apps & Credentials
   - Sandbox Client ID and Secret
3. **Get Live Credentials**:
   - Switch to Live tab
   - Copy Client ID and Secret
4. **Set Webhook**:
   - Webhooks > Create webhook
   - URL: `https://yourdomain.com/api/webhooks/paypal`

---

## 🧪 Testing

### Test Stripe Cards

```
Success:           4242 4242 4242 4242
Card Declined:     4000 0000 0000 0002
Requires 3D Auth:  4000 0025 0000 3155
Expired:           4000 0000 0000 0069
```

### Test PayPal Sandbox

1. Use sandbox business account created during setup
2. Log in with test credentials
3. Complete payment in sandbox environment

---

## 📚 API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- Request: `{ username, password }`
- Response: `{ token, expiresIn }`

### Payments
- `POST /api/payments/stripe/create-intent` - Create Stripe payment
- `POST /api/payments/stripe/confirm` - Confirm Stripe payment
- `POST /api/payments/paypal/create` - Create PayPal payment
- `POST /api/payments/paypal/execute` - Execute PayPal payment

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:orderId` - Get order status

### Health
- `GET /api/health` - Server health check

---

## 🔐 Security Features

### Implemented
- ✅ HTTPS/SSL encryption
- ✅ HSTS security headers
- ✅ CSP (Content Security Policy)
- ✅ Rate limiting
- ✅ JWT authentication
- ✅ Password hashing (BCrypt)
- ✅ Input sanitization
- ✅ CORS protection
- ✅ XSS prevention
- ✅ CSRF protection

### Compliance
- ✅ PCI DSS Level 1 (via Stripe/PayPal)
- ✅ GDPR compliant
- ✅ CCPA compliant
- ✅ No card data storage

---

## 📊 Monitoring

### Check Server Health
```bash
curl http://localhost:3000/api/health
```

### Monitor Logs
```bash
# Development
npm run dev

# Production (with PM2)
pm2 logs majestic-views
pm2 monit
```

### Check SSL Certificate
```bash
openssl s_client -connect yourdomain.com:443
```

---

## 🐛 Troubleshooting

### Payment Not Processing
1. Check Stripe/PayPal API keys in .env
2. Verify webhook settings
3. Check server logs: `npm run dev`
4. Test with sandbox credentials first

### HTTPS Certificate Error
```bash
# Check certificate
openssl x509 -in your-cert.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal
```

### Port Already in Use
```bash
# Linux/Mac: Kill process on port
lsof -i :3000
kill -9 <PID>

# Windows: Use different port
PORT=3001 npm run dev
```

---

## 📝 Project Structure

```
Ecommerce/
├── server.js                    # Main server file
├── webhooks.js                  # Payment webhooks
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── checkout-secure.html         # Secure checkout page
├── order-confirmation.html      # Order confirmation
├── admin.html                   # Admin portal
├── shop.html                    # Product shop
├── styles.css                   # Global styles
├── scripts.js                   # Frontend scripts
└── DEPLOYMENT_SECURITY_GUIDE.md # Deployment guide
```

---

## 📖 Documentation

- [Deployment & Security Guide](./DEPLOYMENT_SECURITY_GUIDE.md)
- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Documentation](https://developer.paypal.com)
- [Express.js Guide](https://expressjs.com)

---

## 🤝 Support

### Getting Help
1. Check [DEPLOYMENT_SECURITY_GUIDE.md](./DEPLOYMENT_SECURITY_GUIDE.md)
2. Review Stripe/PayPal documentation
3. Check server logs for errors

### Stripe Support
- Email: support@stripe.com
- Dashboard: https://dashboard.stripe.com

### PayPal Support
- Help: https://www.paypal.com/smarthelp
- Developer Docs: https://developer.paypal.com

---

## ⚖️ License

MIT License - feel free to use this project for commercial purposes.

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Stripe API keys set and tested
- [ ] PayPal credentials configured and tested
- [ ] SSL certificate installed
- [ ] Admin password changed from default
- [ ] HTTPS enabled
- [ ] Rate limiting tested
- [ ] Error handling verified
- [ ] Logs monitored
- [ ] Backup strategy in place
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Contact/Support page available

---

## 🚀 Quick Start Commands

```bash
# Install
npm install

# Develop
npm run dev

# Test Payments (Sandbox)
# Use test Stripe/PayPal cards in checkout

# Deploy
npm run secure-start

# Health Check
curl http://localhost:3000/api/health
```

---

**Version**: 1.0.0  
**Last Updated**: February 8, 2026  
**Status**: Production Ready ✅

For detailed deployment instructions, see [DEPLOYMENT_SECURITY_GUIDE.md](./DEPLOYMENT_SECURITY_GUIDE.md)



