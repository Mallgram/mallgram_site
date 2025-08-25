const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // AI Services
  async chatWithAI(message, context = {}) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getRecommendations(userId, productId = null, context = {}) {
    return this.request('/ai/recommendations', {
      method: 'POST',
      body: JSON.stringify({ userId, productId, context }),
    });
  }

  async enhanceSearch(query, filters = {}) {
    return this.request('/ai/search-enhance', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    });
  }

  async analyzeReview(reviewText) {
    return this.request('/ai/analyze-review', {
      method: 'POST',
      body: JSON.stringify({ reviewText }),
    });
  }

  // Payment Services
  async initializePayment(paymentData) {
    return this.request('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async verifyPayment(paymentReference) {
    return this.request(`/payments/verify/${paymentReference}`, {
      method: 'GET',
    });
  }

  async getPaymentStatus(paymentId) {
    return this.request(`/payments/status/${paymentId}`, {
      method: 'GET',
    });
  }

  // Email Services
  async sendWelcomeEmail(userData) {
    return this.request('/emails/welcome', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async sendOrderConfirmation(orderData) {
    return this.request('/emails/order-confirmation', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async sendContactForm(formData) {
    return this.request('/emails/contact', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  }

  async sendInquiry(inquiryData) {
    return this.request('/emails/inquiry', {
      method: 'POST',
      body: JSON.stringify(inquiryData),
    });
  }

  async reportAbuse(reportData) {
    return this.request('/emails/abuse-report', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async requestAffiliate(affiliateData) {
    return this.request('/emails/affiliate-request', {
      method: 'POST',
      body: JSON.stringify(affiliateData),
    });
  }

  async sendPromotional(promoData) {
    return this.request('/emails/promotional', {
      method: 'POST',
      body: JSON.stringify(promoData),
    });
  }

  async sendOrderTracking(trackingData) {
    return this.request('/emails/order-tracking', {
      method: 'POST',
      body: JSON.stringify(trackingData),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
