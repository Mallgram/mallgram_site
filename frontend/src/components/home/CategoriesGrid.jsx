import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Shirt, 
  Home, 
  Gamepad2, 
  Heart, 
  Book,
  ArrowRight 
} from 'lucide-react';

const CategoriesGrid = ({ country }) => {
  const categories = [
    {
      id: 'electronics',
      name: 'Electronics',
      nameFr: 'Électronique',
      icon: Smartphone,
      color: 'bg-blue-500',
      count: '2,500+ items',
      image: '/images/categories/electronics.jpg'
    },
    {
      id: 'fashion',
      name: 'Fashion',
      nameFr: 'Mode',
      icon: Shirt,
      color: 'bg-pink-500',
      count: '3,200+ items',
      image: '/images/categories/fashion.jpg'
    },
    {
      id: 'home-garden',
      name: 'Home & Garden',
      nameFr: 'Maison & Jardin',
      icon: Home,
      color: 'bg-green-500',
      count: '1,800+ items',
      image: '/images/categories/home.jpg'
    },
    {
      id: 'sports',
      name: 'Sports & Outdoors',
      nameFr: 'Sports & Plein Air',
      icon: Gamepad2,
      color: 'bg-orange-500',
      count: '1,200+ items',
      image: '/images/categories/sports.jpg'
    },
    {
      id: 'beauty',
      name: 'Beauty & Health',
      nameFr: 'Beauté & Santé',
      icon: Heart,
      color: 'bg-red-500',
      count: '900+ items',
      image: '/images/categories/beauty.jpg'
    },
    {
      id: 'books',
      name: 'Books & Media',
      nameFr: 'Livres & Médias',
      icon: Book,
      color: 'bg-purple-500',
      count: '1,500+ items',
      image: '/images/categories/books.jpg'
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
    >
      {categories.map((category) => {
        const IconComponent = category.icon;
        const displayName = country === 'cm' ? category.nameFr : category.name;
        
        return (
          <motion.div key={category.id} variants={itemVariants}>
            <Link
              to={`/${country}/products?category=${category.id}`}
              className="group block"
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Category Image */}
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {/* Placeholder background with icon */}
                  <div className={`absolute inset-0 ${category.color} opacity-10`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconComponent size={48} className={`text-gray-400 group-hover:text-white transition-colors`} />
                    <div className={`absolute inset-0 ${category.color} opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex items-center justify-center`}>
                      <IconComponent size={48} className="text-white" />
                    </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  
                  {/* Arrow Icon */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                      <ArrowRight size={16} className="text-gray-700" />
                    </div>
                  </div>
                </div>

                {/* Category Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-navy transition-colors text-sm md:text-base">
                    {displayName}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    {category.count}
                  </p>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default CategoriesGrid;
