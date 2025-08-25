import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react';

const BestSellers = ({ country, currencySymbol }) => {
  // Mock data - replace with actual API call
  const bestSellers = [
    {
      id: 1,
      title: 'Wireless Bluetooth Headphones',
      titleFr: 'Écouteurs Bluetooth Sans Fil',
      price: country === 'za' ? 899 : 45000,
      originalPrice: country === 'za' ? 1299 : 65000,
      rating: 4.8,
      reviews: 342,
      image: '/images/products/headphones.jpg',
      category: 'Electronics',
      inStock: true,
      discount: 31,
      isNew: false,
      isBestSeller: true,
    },
    {
      id: 2,
      title: 'Smart Fitness Watch',
      titleFr: 'Montre de Fitness Intelligente',
      price: country === 'za' ? 1599 : 80000,
      originalPrice: country === 'za' ? 2199 : 110000,
      rating: 4.6,
      reviews: 256,
      image: '/images/products/smartwatch.jpg',
      category: 'Electronics',
      inStock: true,
      discount: 27,
      isNew: true,
      isBestSeller: true,
    },
    {
      id: 3,
      title: 'Premium Cotton T-Shirt',
      titleFr: 'T-Shirt en Coton Premium',
      price: country === 'za' ? 299 : 15000,
      originalPrice: null,
      rating: 4.9,
      reviews: 189,
      image: '/images/products/tshirt.jpg',
      category: 'Fashion',
      inStock: true,
      discount: 0,
      isNew: false,
      isBestSeller: true,
    },
    {
      id: 4,
      title: 'LED Desk Lamp',
      titleFr: 'Lampe de Bureau LED',
      price: country === 'za' ? 449 : 22500,
      originalPrice: country === 'za' ? 599 : 30000,
      rating: 4.5,
      reviews: 134,
      image: '/images/products/lamp.jpg',
      category: 'Home & Garden',
      inStock: true,
      discount: 25,
      isNew: false,
      isBestSeller: true,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const formatPrice = (price) => {
    if (country === 'za') {
      return `R${price.toLocaleString()}`;
    } else {
      return `${price.toLocaleString()} FCFA`;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {bestSellers.map((product) => {
        const displayTitle = country === 'cm' ? product.titleFr : product.title;
        
        return (
          <motion.div key={product.id} variants={itemVariants}>
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {/* Placeholder image */}
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <ShoppingCart size={24} />
                    </div>
                    <p className="text-sm">Product Image</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.discount > 0 && (
                    <span className="bg-discount text-white text-xs font-bold px-2 py-1 rounded">
                      -{product.discount}%
                    </span>
                  )}
                  {product.isNew && (
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                      NEW
                    </span>
                  )}
                  {product.isBestSeller && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                      BEST
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
                    <Heart size={16} className="text-gray-600" />
                  </button>
                  <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
                    <Eye size={16} className="text-gray-600" />
                  </button>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Category */}
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {product.category}
                </p>

                {/* Title */}
                <Link to={`/${country}/product/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-navy transition-colors mb-2 line-clamp-2">
                    {displayTitle}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviews})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button className="w-full bg-navy hover:bg-navy/90 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
                  <ShoppingCart size={16} />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default BestSellers;
