import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const SearchResults = () => {
  const { country } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const query = searchParams.get('q') || '';

  return (
    <>
      <Helmet>
        <title>Search Results - Mallgram</title>
        <meta name="description" content="Search results for your query" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-heading-2 text-gray-900 mb-4">
              Search Results
            </h1>
            <p className="text-body text-gray-600 mb-8">
              Coming Soon - Search results page for {country?.toUpperCase()}
            </p>
            
            {query && (
              <p className="text-sm text-gray-500">
                Search Query: "{query}"
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResults;
