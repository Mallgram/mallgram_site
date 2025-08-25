import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const AdminDashboard = () => {
  const { country } = useParams();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Mallgram</title>
        <meta name="description" content="Admin dashboard for managing the platform" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-heading-2 text-gray-900 mb-4">
              Admin Dashboard
            </h1>
            <p className="text-body text-gray-600 mb-8">
              Coming Soon - Admin dashboard for {country?.toUpperCase()}
            </p>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <p className="text-gray-500">Admin management interface will be available here</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
