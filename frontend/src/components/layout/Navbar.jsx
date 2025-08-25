import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Heart, 
  Menu, 
  X,
  Globe,
  ChevronDown
} from 'lucide-react';

const Navbar = ({ country }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/${country}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const countries = [
    { code: 'za', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
    { code: 'cm', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF' },
  ];

  const currentCountry = countries.find(c => c.code === country) || countries[0];

  const mainNavItems = [
    { key: 'home', path: `/${country}`, label: t('nav.home') },
    { key: 'products', path: `/${country}/products`, label: t('nav.products') },
    { key: 'categories', path: `/${country}/products`, label: t('nav.categories'), hasDropdown: true },
  ];

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Beauty & Health',
    'Books & Media',
  ];

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-navy text-white py-2">
        <div className="container-custom">
          <div className="flex justify-between items-center text-sm">
            <div className="hidden md:block">
              Free delivery on orders over {currentCountry.currency === 'ZAR' ? 'R500' : '50,000 FCFA'}
            </div>
            
            {/* Country Selector */}
            <div className="relative">
              <button
                onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
                className="flex items-center space-x-2 hover:text-lightBlue transition-colors"
              >
                <Globe size={16} />
                <span>{currentCountry.flag} {currentCountry.name}</span>
                <ChevronDown size={14} />
              </button>
              
              {isCountryMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 bg-white text-gray-900 rounded-lg shadow-lg py-2 min-w-48 border"
                >
                  {countries.map((countryItem) => (
                    <Link
                      key={countryItem.code}
                      to={`/${countryItem.code}`}
                      className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsCountryMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{countryItem.flag}</span>
                        <div>
                          <div className="font-medium">{countryItem.name}</div>
                          <div className="text-sm text-gray-500">{countryItem.currency}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container-custom">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to={`/${country}`} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold text-navy">Mallgram</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.search')}
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-navy transition-colors"
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          {/* Desktop Navigation Items */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Account Menu */}
            <Link
              to={`/${country}/profile`}
              className="flex items-center space-x-1 text-gray-700 hover:text-navy transition-colors"
            >
              <User size={20} />
              <span>{t('nav.account')}</span>
            </Link>

            {/* Wishlist */}
            <Link
              to={`/${country}/wishlist`}
              className="flex items-center space-x-1 text-gray-700 hover:text-navy transition-colors relative"
            >
              <Heart size={20} />
              <span className="hidden lg:inline">{t('nav.wishlist')}</span>
              {/* Wishlist count badge */}
              <span className="absolute -top-2 -right-2 bg-discount text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Cart */}
            <Link
              to={`/${country}/cart`}
              className="flex items-center space-x-1 text-gray-700 hover:text-navy transition-colors relative"
            >
              <ShoppingCart size={20} />
              <span className="hidden lg:inline">{t('nav.cart')}</span>
              {/* Cart count badge */}
              <span className="absolute -top-2 -right-2 bg-discount text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-navy transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Main Navigation */}
        <div className="hidden md:flex items-center space-x-8 pb-4 border-b border-gray-100">
          {mainNavItems.map((item) => (
            <div key={item.key} className="relative group">
              <Link
                to={item.path}
                className="text-gray-700 hover:text-navy transition-colors font-medium"
              >
                {item.label}
              </Link>
              
              {/* Categories Dropdown */}
              {item.hasDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg py-2 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/${country}/products?category=${category.toLowerCase().replace(' ', '-')}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-navy transition-colors"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-gray-200"
        >
          <div className="container-custom py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.search')}
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-navy transition-colors"
              >
                <Search size={20} />
              </button>
            </form>

            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {mainNavItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.path}
                  className="block py-2 text-gray-700 hover:text-navy transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <Link
                to={`/${country}/profile`}
                className="block py-2 text-gray-700 hover:text-navy transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.account')}
              </Link>
              
              <Link
                to={`/${country}/wishlist`}
                className="block py-2 text-gray-700 hover:text-navy transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.wishlist')}
              </Link>
              
              <Link
                to={`/${country}/cart`}
                className="block py-2 text-gray-700 hover:text-navy transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.cart')}
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
