import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const ProductDetail = () => {
  const { country, id } = useParams();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>Product Details - Mallgram</title>
        <meta name="description" content="View detailed product information" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-heading-2 text-gray-900 mb-4">
              Product Details
            </h1>
            <p className="text-body text-gray-600 mb-8">
              Coming Soon - Product detail page for {country?.toUpperCase()}
            </p>
            
            <p className="text-sm text-gray-500">
              Product ID: {id}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
