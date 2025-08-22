# Mallgram Backend Architecture Summary

## 🎯 **Refactored Focus**

The backend has been streamlined to handle only the core backend-specific features as requested:

### ✅ **What Backend Handles:**
1. **Product Synchronization** - Daily sync from Alibaba/AliExpress APIs
2. **Payment Processing** - Multi-gateway African payment support
3. **AI Services** - OpenAI chatbot and recommendations 
4. **Email Services** - Transactional email sending
5. **Cron Jobs** - Automated background tasks

### ❌ **What Frontend Handles (via Supabase):**
- User Authentication & Registration
- User Profile Management
- Order Management (CRUD)
- Affiliate System
- User Events Tracking
- Admin Dashboard Functions

## 📁 **Current File Structure**

```
mallgram_site/
├── 📄 server.js                    # Main Express server
├── 📄 package.json                 # Dependencies
├── 📄 .env.example                 # Environment template
├── 📄 README.md                    # Documentation
├── 📁 config/
│   ├── supabase.js                 # Database config
│   └── logger.js                   # Winston logging
├── 📁 middleware/
│   ├── auth.js                     # JWT auth (minimal)
│   ├── errorHandler.js             # Error handling
│   └── requestLogger.js            # Request logging
├── 📁 routes/
│   ├── payments.js                 # 💳 Payment processing
│   ├── ai.js                       # 🤖 AI services
│   └── emails.js                   # 📧 Email services
├── 📁 services/
│   ├── aiService.js                # OpenAI integration
│   ├── emailService.js             # Email handling
│   └── payments/                   # Payment gateways
│       ├── koraPayService.js       # Kora Pay
│       ├── mtnService.js           # MTN Mobile Money
│       ├── orangeService.js        # Orange Money
│       ├── payGateService.js       # PayGate (SA)
│       └── payFastService.js       # PayFast (SA)
├── 📁 scripts/
│   ├── cron-manager.js             # Cron job manager
│   ├── productSync.js              # Product sync job
│   └── deliveryTracking.js         # Delivery tracking
└── 📁 docs/
    └── architect_backend.md        # Architecture docs
```

## 🛠 **API Endpoints**

### Payment Routes (`/api/v1/payments`)
- Initialize payments with African gateways
- Handle payment webhooks
- Verify payment status
- Support multiple currencies and methods

### AI Routes (`/api/v1/ai`)
- Process chatbot conversations
- Generate product recommendations
- Enhance search results
- Analyze product reviews

### Email Routes (`/api/v1/emails`)
- Send transactional emails
- Handle contact forms
- Process affiliate requests
- Send promotional emails

## 🔄 **Cron Jobs**

1. **Product Sync** (Daily 2:00 AM)
   - Fetch from Alibaba/AliExpress APIs
   - Update product database
   - Handle B2C and B2B products

2. **Delivery Tracking** (Every 6 hours)
   - Update order status via carrier APIs
   - Send tracking notifications
   - Handle delivery confirmations

3. **Bulk Shipping** (Hourly)
   - Process orders after 48h delay
   - Create bulk shipments
   - Send to carriers

4. **Database Cleanup** (Daily 3:00 AM)
   - Clean old logs
   - Optimize database
   - Remove inactive products

## 🌍 **Payment Gateways**

### African Markets
- **Kora Pay** - Pan-African card payments
- **MTN Mobile Money** - Cameroon, Ghana, Uganda
- **Orange Money** - West/Central Africa
- **PayGate** - South Africa cards/EFT
- **PayFast** - South Africa comprehensive

### Supported Countries
- 🇿🇦 South Africa
- 🇨🇲 Cameroon  
- 🇳🇬 Nigeria
- 🇰🇪 Kenya
- 🇬🇭 Ghana

## 🤖 **AI Features**

- **Chatbot** - Customer support automation
- **Recommendations** - Personalized product suggestions
- **Search Enhancement** - Improved search results
- **Review Analysis** - Sentiment analysis
- **Product Inquiries** - Specific product questions

## 📧 **Email Types**

- Welcome emails
- Order confirmations
- Payment notifications
- Tracking updates
- Contact form submissions
- Affiliate applications
- Promotional campaigns

## 🚀 **Deployment Ready**

- Environment-based configuration
- Docker-friendly structure
- Coolify deployment support
- Health check endpoints
- Comprehensive logging
- Error handling

## 🔧 **Next Steps**

1. Configure environment variables
2. Set up payment gateway accounts
3. Deploy database schema
4. Configure email SMTP
5. Deploy to Coolify
6. Set up monitoring

The backend is now focused and ready for production deployment! 🎉
