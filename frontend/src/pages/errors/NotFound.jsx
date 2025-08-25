import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const { country } = useParams();
  const { t } = useTranslation();
  
  // Default to 'za' if no country in URL
  const currentCountry = country || 'za';

  return (
    <>
      <Helmet>
        <title>Page Not Found - Mallgram</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to our homepage to continue shopping." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg mx-auto"
        >
          {/* 404 Illustration */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <div className="text-9xl font-bold text-navy/20 mb-4">404</div>
            <div className="w-32 h-32 mx-auto bg-navy/10 rounded-full flex items-center justify-center">
              <Search size={48} className="text-navy/40" />
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-gray-500">
              Don't worry, let's get you back on track to find amazing products!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center"
          >
            <Link
              to={`/${currentCountry}`}
              className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center space-x-2"
            >
              <Home size={20} />
              <span>Back to Home</span>
            </Link>
            
            <Link
              to={`/${currentCountry}/products`}
              className="btn btn-outline btn-lg w-full sm:w-auto flex items-center justify-center space-x-2"
            >
              <Search size={20} />
              <span>Browse Products</span>
            </Link>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12 pt-8 border-t border-gray-200"
          >
            <p className="text-sm text-gray-500 mb-4">Popular pages:</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                to={`/${currentCountry}/products/electronics`}
                className="text-navy hover:text-navy/80 transition-colors"
              >
                Electronics
              </Link>
              <Link
                to={`/${currentCountry}/products/fashion`}
                className="text-navy hover:text-navy/80 transition-colors"
              >
                Fashion
              </Link>
              <Link
                to={`/${currentCountry}/products/home-garden`}
                className="text-navy hover:text-navy/80 transition-colors"
              >
                Home & Garden
              </Link>
              <Link
                to={`/${currentCountry}/contact`}
                className="text-navy hover:text-navy/80 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>

          {/* Go Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8"
          >
            <button
              onClick={() => window.history.back()}
              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;
