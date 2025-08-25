import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const ProductListing = () => {
  const { country, category } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>Products - Mallgram</title>
        <meta name="description" content="Browse our wide selection of products" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-heading-2 text-gray-900 mb-4">
              {t('products.title')}
            </h1>
            <p className="text-body text-gray-600 mb-8">
              Coming Soon - Product listing page for {country?.toUpperCase()}
            </p>
            
            {category && (
              <p className="text-sm text-gray-500">
                Category: {category}
              </p>
            )}
            
            {searchParams.get('search') && (
              <p className="text-sm text-gray-500">
                Search: {searchParams.get('search')}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductListing;
