import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

const HeroBanner = ({ country }) => {
  const { t } = useTranslation();

  const heroContent = {
    za: {
      title: 'Discover Amazing Products at Great Prices',
      subtitle: 'Shop electronics, fashion, home & garden, and more with fast delivery across South Africa',
      image: '/images/hero-za.jpg',
      ctaText: 'Shop Now',
    },
    cm: {
      title: 'Découvrez des Produits Incroyables à Prix Avantageux',
      subtitle: 'Achetez électronique, mode, maison & jardin, et plus avec livraison rapide au Cameroun',
      image: '/images/hero-cm.jpg',
      ctaText: 'Acheter Maintenant',
    },
  };

  const content = heroContent[country] || heroContent.za;

  return (
    <section className="relative bg-gradient-to-br from-navy via-navy/90 to-lightBlue min-h-[70vh] flex items-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-black/20"></div>
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              {content.title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed"
            >
              {content.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to={`/${country}/products`}
                className="btn bg-white text-navy hover:bg-gray-100 btn-lg font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span>{content.ctaText}</span>
                <ArrowRight size={20} />
              </Link>
              
              <button className="btn btn-outline border-white text-white hover:bg-white hover:text-navy btn-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-300">
                <Play size={18} />
                <span>Watch Demo</span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold">10K+</div>
                <div className="text-gray-300 text-sm">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold">5K+</div>
                <div className="text-gray-300 text-sm">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold">24/7</div>
                <div className="text-gray-300 text-sm">Support</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10">
              {/* Placeholder for hero image - replace with actual image */}
              <div className="aspect-square bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-white/80 font-medium">Premium Shopping Experience</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center"
            >
              <span className="text-white font-bold">%</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-3 bg-white/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroBanner;
