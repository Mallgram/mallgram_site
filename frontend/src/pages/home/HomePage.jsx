import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import HeroBanner from '@/components/home/HeroBanner';
import CategoriesGrid from '@/components/home/CategoriesGrid';
import BestSellers from '@/components/home/BestSellers';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import NewsletterSection from '@/components/home/NewsletterSection';

const HomePage = () => {
  const { country } = useParams();
  const { t } = useTranslation();

  // Country-specific content
  const getCountryContent = () => {
    const content = {
      za: {
        title: 'Mallgram South Africa - Premium Online Shopping',
        description: 'Discover amazing products at great prices in South Africa. Shop electronics, fashion, home & garden with fast delivery.',
        currency: 'ZAR',
        currencySymbol: 'R',
      },
      cm: {
        title: 'Mallgram Cameroun - Boutique en Ligne Premium',
        description: 'Découvrez des produits incroyables à prix avantageux au Cameroun. Achetez électronique, mode, maison avec livraison rapide.',
        currency: 'XAF',
        currencySymbol: 'FCFA',
      },
    };

    return content[country] || content.za;
  };

  const countryContent = getCountryContent();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>{countryContent.title}</title>
        <meta name="description" content={countryContent.description} />
        <meta property="og:title" content={countryContent.title} />
        <meta property="og:description" content={countryContent.description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/${country}`} />
        
        {/* Structured Data for Homepage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Mallgram",
            "alternateName": `Mallgram ${country === 'za' ? 'South Africa' : 'Cameroun'}`,
            "url": `${window.location.origin}/${country}`,
            "description": countryContent.description,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${window.location.origin}/${country}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen"
      >
        {/* Hero Banner */}
        <motion.section variants={sectionVariants}>
          <HeroBanner country={country} />
        </motion.section>

        {/* Categories Section */}
        <motion.section variants={sectionVariants} className="section-padding bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-heading-2 text-gray-900 mb-4">
                {t('home.categories')}
              </h2>
              <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">
                Explore our wide range of product categories and find exactly what you're looking for.
              </p>
            </div>
            <CategoriesGrid country={country} />
          </div>
        </motion.section>

        {/* Best Sellers Section */}
        <motion.section variants={sectionVariants} className="section-padding">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-heading-2 text-gray-900 mb-2">
                  {t('home.bestSellers')}
                </h2>
                <p className="text-body text-gray-600">
                  Most popular products loved by our customers
                </p>
              </div>
            </div>
            <BestSellers country={country} currencySymbol={countryContent.currencySymbol} />
          </div>
        </motion.section>

        {/* Featured Products Section */}
        <motion.section variants={sectionVariants} className="section-padding bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-heading-2 text-gray-900 mb-4">
                {t('home.recommended')}
              </h2>
              <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">
                Handpicked products just for you based on your preferences and shopping history.
              </p>
            </div>
            <FeaturedProducts country={country} currencySymbol={countryContent.currencySymbol} />
          </div>
        </motion.section>

        {/* Newsletter Section */}
        <motion.section variants={sectionVariants}>
          <NewsletterSection country={country} />
        </motion.section>

        {/* Trust Indicators */}
        <motion.section variants={sectionVariants} className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">
                  Quick and reliable delivery across {country === 'za' ? 'South Africa' : 'Cameroon'}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Quality Guaranteed</h3>
                <p className="text-gray-600">
                  All products are verified and come with quality assurance
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
                <p className="text-gray-600">
                  Multiple secure payment options for your convenience
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
};

export default HomePage;
