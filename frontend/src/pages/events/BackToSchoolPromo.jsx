import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const BackToSchoolPromo = () => {
  const { country } = useParams();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>Back to School Promotions - Mallgram</title>
        <meta name="description" content="Special back to school deals and promotions" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-heading-2 text-gray-900 mb-4">
              📚 Back to School Promotions
            </h1>
            <p className="text-body text-gray-600 mb-8">
              Coming Soon - Special back to school deals for {country?.toUpperCase()}
            </p>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <p className="text-gray-500">Back to school promotional campaigns will be available here</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BackToSchoolPromo;
