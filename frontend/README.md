# Mallgram Frontend

A modern, responsive e-commerce frontend built with React + Vite, Tailwind CSS, and Supabase for the African market.

## 🚀 Features

- **Multi-Country Support**: South Africa (English) and Cameroon (French)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **AI Shopping Assistant**: Integrated chatbot for product discovery
- **Real-time Analytics**: User behavior tracking and insights
- **Secure Payments**: Multiple payment gateways for African markets
- **SEO Optimized**: Dynamic meta tags, structured data, and sitemap
- **Progressive Web App**: Offline support and app-like experience

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v3
- **State Management**: Zustand + React Query
- **Backend**: Supabase (Database, Auth, Storage)
- **Internationalization**: react-i18next
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **SEO**: React Helmet Async

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (buttons, modals, etc.)
│   ├── layout/          # Layout components (navbar, footer)
│   ├── forms/           # Form components
│   ├── product/         # Product-related components
│   ├── cart/            # Shopping cart components
│   ├── user/            # User profile components
│   ├── admin/           # Admin dashboard components
│   ├── affiliate/       # Affiliate dashboard components
│   └── ai/              # AI chatbot components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── services/            # API services and integrations
├── store/               # Zustand stores
├── utils/               # Utility functions
├── constants/           # App constants
├── routes/              # Route definitions
├── i18n/                # Internationalization
└── styles/              # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Backend API running (see backend README)

### Installation

1. Clone the repository and navigate to frontend:
```bash
cd mallgram_site/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌍 Multi-Country Setup

The app supports multiple countries with different languages and currencies:

- **South Africa** (`/za`): English, ZAR currency
- **Cameroon** (`/cm`): French, XAF currency

Routes automatically redirect to the appropriate country and language.

## 🎨 Design System

### Colors
- **Primary**: Navy Blue (#1E3A8A), Black, White
- **Secondary**: Light Blue (#3B82F6), Red (#EF4444)
- **Supporting**: Gray shades, Green, Yellow

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800

### Components
All components follow consistent design patterns with:
- Responsive breakpoints
- Hover states and transitions
- Focus states for accessibility
- Loading states
- Error states

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🧩 Key Components

### Layout Components
- **Navbar**: Multi-country navigation with search
- **Footer**: Country-specific footer with payment methods
- **Layout**: Main layout wrapper with SEO

### Product Components
- **ProductCard**: Product display with pricing
- **ProductDetail**: Detailed product view
- **ProductListing**: Grid view with filters

### AI Components
- **ChatWidget**: Floating chat assistant
- **ChatWindow**: Full chat interface

### Form Components
- **ContactForm**: Contact us form
- **AuthForms**: Login/register forms
- **CheckoutForm**: Payment and shipping forms

## 🔌 API Integration

The frontend integrates with:
- **Supabase**: Database, authentication, storage
- **Backend API**: AI services, payments, emails
- **External APIs**: Payment gateways, shipping providers

## 📱 Mobile Optimization

- Mobile-first responsive design
- Touch-friendly interface elements
- Optimized images and lazy loading
- Offline support with service workers

## 🔍 SEO Features

- Dynamic meta tags per page/country
- Structured data (JSON-LD)
- hreflang tags for multi-language
- Automatic sitemap generation
- Open Graph and Twitter Card support

## 🚦 Performance

- Code splitting with React.lazy()
- Image lazy loading
- React Query caching
- Bundle optimization with Vite
- Progressive web app features

## 🧪 Testing

Testing strategy includes:
- Unit tests with Jest + React Testing Library
- Integration tests for user flows
- E2E tests with Cypress
- Performance testing

## 🚀 Deployment

The frontend can be deployed to:
- **Vercel** (recommended for React apps)
- **Netlify** (with continuous deployment)
- **Coolify** (self-hosted)
- **Static hosting** (AWS S3, Azure, etc.)

### Build Commands
```bash
# Production build
npm run build

# Preview build locally
npm run preview
```

## 🤝 Contributing

1. Follow the component structure guidelines
2. Use TypeScript for new components (optional)
3. Write tests for new features
4. Follow the established design patterns
5. Ensure mobile responsiveness

## 📄 License

This project is licensed under the MIT License.