import React, { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget from '@/components/ai/ChatWidget';
import { setLanguageByCountry } from '@/i18n';

const Layout = () => {
  const { country } = useParams();
  const { t } = useTranslation();

  // Set language based on country
  useEffect(() => {
    if (country) {
      setLanguageByCountry(country);
    }
  }, [country]);

  // Get country-specific metadata
  const getCountryMetadata = () => {
    const metadata = {
      za: {
        title: 'Mallgram South Africa - Premium Online Shopping',
        description: 'Discover amazing products at great prices in South Africa. Shop electronics, fashion, home & garden with fast delivery.',
        currency: 'ZAR',
        language: 'en',
        hreflang: 'en-ZA',
      },
      cm: {
        title: 'Mallgram Cameroun - Boutique en Ligne Premium',
        description: 'Découvrez des produits incroyables à prix avantageux au Cameroun. Achetez électronique, mode, maison avec livraison rapide.',
        currency: 'XAF',
        language: 'fr',
        hreflang: 'fr-CM',
      },
    };

    return metadata[country] || metadata.za;
  };

  const countryData = getCountryMetadata();

  return (
    <>
      <Helmet>
        <html lang={countryData.language} />
        <title>{countryData.title}</title>
        <meta name="description" content={countryData.description} />
        <meta name="currency" content={countryData.currency} />
        
        {/* hreflang for SEO */}
        <link rel="alternate" hrefLang="en-ZA" href={`${window.location.origin}/za`} />
        <link rel="alternate" hrefLang="fr-CM" href={`${window.location.origin}/cm`} />
        <link rel="alternate" hrefLang="x-default" href={`${window.location.origin}/za`} />
        
        {/* Open Graph meta tags */}
        <meta property="og:title" content={countryData.title} />
        <meta property="og:description" content={countryData.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/${country}`} />
        <meta property="og:image" content={`${window.location.origin}/og-image-${country}.jpg`} />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={countryData.title} />
        <meta name="twitter:description" content={countryData.description} />
        <meta name="twitter:image" content={`${window.location.origin}/twitter-image-${country}.jpg`} />
        
        {/* Structured Data for Local Business */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Mallgram",
            "url": `${window.location.origin}/${country}`,
            "logo": `${window.location.origin}/logo.png`,
            "description": countryData.description,
            "address": {
              "@type": "PostalAddress",
              "addressCountry": country.toUpperCase()
            },
            "sameAs": [
              "https://facebook.com/mallgram",
              "https://twitter.com/mallgram",
              "https://instagram.com/mallgram"
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-white">
        {/* Navigation */}
        <Navbar country={country} />
        
        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer country={country} />
        
        {/* AI Chat Widget */}
        <ChatWidget />
      </div>
    </>
  );
};

export default Layout;
