import React from 'react';
import BestSellers from './BestSellers';

// FeaturedProducts is essentially the same as BestSellers but with different data
// For now, we'll reuse BestSellers component - in a real app, you'd have different data sources

const FeaturedProducts = ({ country, currencySymbol }) => {
  return <BestSellers country={country} currencySymbol={currencySymbol} />;
};

export default FeaturedProducts;
