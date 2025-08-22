# Mallgram Backend

## Overview

Mallgram Backend is a focused Node.js service that handles core backend operations for the Mallgram e-commerce platform. The frontend handles authentication, user management, orders, and affiliate features directly with Supabase.

## Backend Features

### 🔄 **Product Synchronization**
- Daily sync from Alibaba and AliExpress APIs
- Automatic product categorization (B2C and B2B)
- Stock and price updates
- Product data enrichment

### 💳 **Payment Processing**
- Multi-gateway support for African markets
- Kora Pay, MTN Mobile Money, Orange Money
- PayGate and PayFast for South Africa
- Webhook handling and verification
- Transaction logging and reporting

### 🤖 **AI Services**
- OpenAI-powered chatbot
- Product recommendations
- Search enhancement
- Review analysis
- Natural language processing

### 📧 **Email Services**
- Transactional emails (welcome, orders, notifications)
- Contact form processing
- Abuse report handling
- Affiliate request management
- HTML email templates

### ⏰ **Cron Jobs**
- Product synchronization (daily)
- Delivery tracking updates (every 6 hours)
- Bulk shipping processing (hourly)
- Database cleanup (daily)

## API Endpoints

### Payments (`/api/v1/payments`)
- `GET /methods` - Get available payment methods
- `POST /initialize` - Initialize payment
- `POST /webhook` - Payment webhook handler
- `GET /status/:id` - Check payment status
- `POST /verify` - Verify payment

### AI Services (`/api/v1/ai`)
- `POST /chat` - Process chatbot conversation
- `POST /recommendations` - Get product recommendations  
- `POST /search-enhance` - Enhance search with AI
- `POST /product-inquiry` - Handle product questions
- `POST /analyze-review` - Analyze review sentiment
- `GET /health` - Check AI service health

### Email Services (`/api/v1/emails`)
- `POST /welcome` - Send welcome email
- `POST /order-confirmation` - Send order confirmation
- `POST /contact` - Send contact form email
- `POST /inquiry` - Send AI assistant inquiry
- `POST /abuse-report` - Send abuse report
- `POST /affiliate-request` - Send affiliate request
- `POST /promotional` - Send promotional email
- `POST /password-reset` - Send password reset
- `POST /order-tracking` - Send tracking update

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Email**: Nodemailer
- **Payments**: Multiple African gateways
- **Cron**: node-cron
- **Logging**: Winston

## Environment Variables

Key environment variables needed:

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# AI
OPENAI_API_KEY=your_openai_key

# Email
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password

# Payment Gateways
KORA_PAY_SECRET_KEY=your_kora_key
MTN_API_KEY=your_mtn_key
ORANGE_API_KEY=your_orange_key
PAYGATE_ID=your_paygate_id
PAYFAST_MERCHANT_ID=your_payfast_id

# External APIs
ALIBABA_API_KEY=your_alibaba_key
ALIEXPRESS_API_KEY=your_aliexpress_key
```

## Installation & Deployment

### Local Development
```bash
npm install
npm run dev
```

### Production Deployment (Coolify)
```bash
npm install
npm start
```

### Cron Jobs
```bash
npm run cron
```

## Architecture

The backend is designed as a microservice focused on:

1. **External API Integration** - Alibaba/AliExpress product sync
2. **Payment Processing** - Multi-gateway African payment support  
3. **AI Services** - OpenAI-powered features
4. **Email Services** - Transactional email handling
5. **Background Jobs** - Automated tasks and maintenance

Frontend handles:
- User authentication (Supabase Auth)
- Order management (Supabase direct)
- User profiles (Supabase direct)
- Affiliate system (Supabase direct)

## Security

- API rate limiting
- CORS protection
- Security headers (Helmet)
- Input validation
- Environment-based configuration
- Secure payment webhook verification

## Monitoring & Logging

- Winston logger with file rotation
- Request/response logging
- Error tracking
- Performance monitoring
- Health check endpoints

## Contributing

1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

## License

MIT License - see LICENSE file for details.