import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const Footer = ({ country }) => {
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  
  // Country-specific contact info
  const contactInfo = {
    za: {
      phone: '+27 11 123 4567',
      address: 'Cape Town, South Africa',
      email: 'support@mallgram.co.za'
    },
    cm: {
      phone: '+237 6 12 34 56 78',
      address: 'Douala, Cameroun',
      email: 'support@mallgram.cm'
    }
  };

  const currentContact = contactInfo[country] || contactInfo.za;

  const footerSections = [
    {
      title: t('footer.aboutUs'),
      links: [
        { label: 'Our Story', path: `/${country}/about` },
        { label: 'Careers', path: `/${country}/careers` },
        { label: 'Press', path: `/${country}/press` },
        { label: 'Blog', path: `/${country}/blog` },
      ]
    },
    {
      title: t('footer.customerService'),
      links: [
        { label: 'Contact Us', path: `/${country}/contact` },
        { label: 'FAQ', path: `/${country}/faq` },
        { label: 'Shipping Info', path: `/${country}/shipping` },
        { label: 'Returns', path: `/${country}/returns` },
        { label: 'Size Guide', path: `/${country}/size-guide` },
      ]
    },
    {
      title: t('footer.myAccount'),
      links: [
        { label: t('nav.login'), path: `/${country}/login` },
        { label: t('nav.register'), path: `/${country}/register` },
        { label: t('nav.orders'), path: `/${country}/orders` },
        { label: t('nav.wishlist'), path: `/${country}/wishlist` },
        { label: 'Track Order', path: `/${country}/track` },
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-navy py-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-semibold mb-2">{t('footer.newsletter')}</h3>
              <p className="text-gray-300">{t('footer.newsletterText')}</p>
            </div>
            <form className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-80 px-4 py-3 rounded-l-lg border-0 focus:outline-none focus:ring-2 focus:ring-lightBlue text-gray-900"
              />
              <button
                type="submit"
                className="bg-lightBlue hover:bg-lightBlue/90 px-6 py-3 rounded-r-lg font-medium transition-colors"
              >
                {t('footer.subscribe')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link to={`/${country}`} className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <span className="text-2xl font-bold">Mallgram</span>
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Your premier online shopping destination in Africa. Discover amazing products at great prices with fast, reliable delivery.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <Phone size={16} className="text-lightBlue" />
                  <span>{currentContact.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-lightBlue" />
                  <span>{currentContact.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin size={16} className="text-lightBlue" />
                  <span>{currentContact.address}</span>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        to={link.path}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Media & Payment Methods */}
      <div className="border-t border-gray-800 py-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Social Media Links */}
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <span className="text-gray-400">{t('footer.followUs')}:</span>
              <div className="flex items-center space-x-4">
                <a
                  href="https://facebook.com/mallgram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-lightBlue transition-colors"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://twitter.com/mallgram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-lightBlue transition-colors"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href="https://instagram.com/mallgram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-lightBlue transition-colors"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://youtube.com/mallgram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-lightBlue transition-colors"
                >
                  <Youtube size={20} />
                </a>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Payment Methods:</span>
              <div className="flex items-center space-x-2">
                {country === 'za' ? (
                  <>
                    <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">VISA</div>
                    <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">PayGate</div>
                    <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">PayFast</div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">MTN</div>
                    <div className="bg-orange-500 rounded px-2 py-1 text-xs font-bold text-white">Orange</div>
                    <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">VISA</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black py-4">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <div className="mb-2 md:mb-0">
              {t('footer.copyright').replace('2024', currentYear)}
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/privacy" className="hover:text-white transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                {t('footer.terms')}
              </Link>
              <Link to={`/${country}/contact`} className="hover:text-white transition-colors">
                {t('footer.support')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
