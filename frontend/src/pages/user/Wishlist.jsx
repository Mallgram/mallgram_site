import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const Wishlist = () => {
  const { country } = useParams();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>Wishlist - Mallgram</title>
        <meta name="description" content="View your saved items" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-heading-2 text-gray-900 mb-4">
              My Wishlist
            </h1>
            <p className="text-body text-gray-600 mb-8">
              Coming Soon - Wishlist page for {country?.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Wishlist;
