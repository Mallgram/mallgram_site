/**
 * Product Synchronization Cron Job
 * 
 * Fetches products from Alibaba and AliExpress APIs and stores them
 * in the database. Handles both B2C and B2B products.
 * 
 * @author Mallgram Backend Team
 */

const axios = require('axios');
const { supabase } = require('../config/supabase');
const logger = require('../config/logger');

class ProductSyncJob {
    constructor() {
        this.alibaba = {
            baseUrl: process.env.ALIBABA_BASE_URL || 'https://gw.open.1688.com/openapi',
            apiKey: process.env.ALIBABA_API_KEY,
            apiSecret: process.env.ALIBABA_API_SECRET
        };
        
        this.aliexpress = {
            baseUrl: process.env.ALIEXPRESS_BASE_URL || 'https://api-sg.aliexpress.com',
            apiKey: process.env.ALIEXPRESS_API_KEY,
            apiSecret: process.env.ALIEXPRESS_API_SECRET
        };
    }

    /**
     * Main execution method
     */
    async execute() {
        const startTime = Date.now();
        let syncStats = {
            aliexpress: { total: 0, success: 0, errors: 0 },
            alibaba: { total: 0, success: 0, errors: 0 }
        };

        try {
            logger.info('Starting product synchronization job');

            // Sync AliExpress products (B2C)
            const aliexpressProducts = await this.fetchAliExpressProducts();
            syncStats.aliexpress = await this.syncB2CProducts(aliexpressProducts);

            // Sync Alibaba products (B2B)
            const alibabaProducts = await this.fetchAlibabaProducts();
            syncStats.alibaba = await this.syncB2BProducts(alibabaProducts);

            const duration = Date.now() - startTime;
            
            logger.info('Product synchronization completed', {
                duration: `${duration}ms`,
                stats: syncStats
            });

            return {
                success: true,
                duration,
                stats: syncStats
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Product synchronization failed:', error);
            
            return {
                success: false,
                duration,
                error: error.message,
                stats: syncStats
            };
        }
    }

    /**
     * Fetch products from AliExpress API
     */
    async fetchAliExpressProducts() {
        try {
            if (!this.aliexpress.apiKey) {
                logger.warn('AliExpress API key not configured, skipping AliExpress sync');
                return [];
            }

            // Example API call - adjust based on actual AliExpress API
            const response = await axios.get(`${this.aliexpress.baseUrl}/products`, {
                headers: {
                    'Authorization': `Bearer ${this.aliexpress.apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    category: 'electronics,clothing,home',
                    limit: 100,
                    sort: 'popularity',
                    target_countries: 'ZA,CM,NG,KE,GH' // African markets
                }
            });

            return response.data.products || [];

        } catch (error) {
            logger.error('Failed to fetch AliExpress products:', error);
            return [];
        }
    }

    /**
     * Fetch products from Alibaba API
     */
    async fetchAlibabaProducts() {
        try {
            if (!this.alibaba.apiKey) {
                logger.warn('Alibaba API key not configured, skipping Alibaba sync');
                return [];
            }

            // Example API call - adjust based on actual Alibaba API
            const response = await axios.get(`${this.alibaba.baseUrl}/products`, {
                headers: {
                    'Authorization': `Bearer ${this.alibaba.apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    category: 'electronics,machinery,textiles',
                    limit: 100,
                    min_order_quantity: 10, // B2B focus
                    target_markets: 'africa'
                }
            });

            return response.data.products || [];

        } catch (error) {
            logger.error('Failed to fetch Alibaba products:', error);
            return [];
        }
    }

    /**
     * Sync B2C products to database
     */
    async syncB2CProducts(products) {
        let stats = { total: products.length, success: 0, errors: 0 };

        for (const product of products) {
            try {
                const productData = {
                    external_id: product.id,
                    name: product.title || product.name,
                    description: product.description,
                    price: parseFloat(product.price || 0),
                    original_price: parseFloat(product.original_price || product.price || 0),
                    currency: product.currency || 'USD',
                    category: product.category,
                    subcategory: product.subcategory,
                    brand: product.brand,
                    images: product.images || [],
                    specifications: product.specifications || {},
                    features: product.features || {},
                    stock: parseInt(product.stock || 0),
                    rating: parseFloat(product.rating || 0),
                    review_count: parseInt(product.review_count || 0),
                    shipping_info: product.shipping_info || {},
                    supplier_info: product.supplier_info || {},
                    tags: product.tags || [],
                    source: 'aliexpress',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Check if product already exists
                const { data: existingProduct } = await supabase
                    .from('products')
                    .select('id')
                    .eq('external_id', product.id)
                    .eq('source', 'aliexpress')
                    .single();

                if (existingProduct) {
                    // Update existing product
                    await supabase
                        .from('products')
                        .update({
                            ...productData,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingProduct.id);
                } else {
                    // Insert new product
                    await supabase
                        .from('products')
                        .insert(productData);
                }

                stats.success++;

            } catch (error) {
                logger.error(`Failed to sync B2C product ${product.id}:`, error);
                stats.errors++;
            }
        }

        return stats;
    }

    /**
     * Sync B2B products to database
     */
    async syncB2BProducts(products) {
        let stats = { total: products.length, success: 0, errors: 0 };

        for (const product of products) {
            try {
                // First insert/update main product
                const productData = {
                    external_id: product.id,
                    name: product.title || product.name,
                    description: product.description,
                    price: parseFloat(product.wholesale_price || product.price || 0),
                    original_price: parseFloat(product.retail_price || product.price || 0),
                    currency: product.currency || 'USD',
                    category: product.category,
                    subcategory: product.subcategory,
                    brand: product.brand,
                    images: product.images || [],
                    specifications: product.specifications || {},
                    features: product.features || {},
                    stock: parseInt(product.stock || 0),
                    rating: parseFloat(product.rating || 0),
                    review_count: parseInt(product.review_count || 0),
                    shipping_info: product.shipping_info || {},
                    supplier_info: product.supplier_info || {},
                    tags: product.tags || [],
                    source: 'alibaba',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                let productId;

                // Check if product already exists
                const { data: existingProduct } = await supabase
                    .from('products')
                    .select('id')
                    .eq('external_id', product.id)
                    .eq('source', 'alibaba')
                    .single();

                if (existingProduct) {
                    // Update existing product
                    await supabase
                        .from('products')
                        .update({
                            ...productData,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingProduct.id);
                    
                    productId = existingProduct.id;
                } else {
                    // Insert new product
                    const { data: newProduct } = await supabase
                        .from('products')
                        .insert(productData)
                        .select('id')
                        .single();
                    
                    productId = newProduct.id;
                }

                // Insert/update B2B specific data
                const b2bData = {
                    product_id: productId,
                    min_order_quantity: parseInt(product.min_order_quantity || 10),
                    bulk_discount_percent: parseFloat(product.bulk_discount_percent || 0),
                    wholesale_price: parseFloat(product.wholesale_price || product.price || 0),
                    supplier_info: product.supplier_info || {},
                    lead_time_days: parseInt(product.lead_time_days || 14),
                    packaging_info: product.packaging_info || {},
                    certifications: product.certifications || [],
                    trade_terms: product.trade_terms || {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Check if B2B record exists
                const { data: existingB2B } = await supabase
                    .from('products_retailer')
                    .select('id')
                    .eq('product_id', productId)
                    .single();

                if (existingB2B) {
                    // Update existing B2B record
                    await supabase
                        .from('products_retailer')
                        .update({
                            ...b2bData,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingB2B.id);
                } else {
                    // Insert new B2B record
                    await supabase
                        .from('products_retailer')
                        .insert(b2bData);
                }

                stats.success++;

            } catch (error) {
                logger.error(`Failed to sync B2B product ${product.id}:`, error);
                stats.errors++;
            }
        }

        return stats;
    }

    /**
     * Clean up old products that are no longer available
     */
    async cleanupOldProducts() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30); // Remove products not updated in 30 days

            const { data: deletedProducts } = await supabase
                .from('products')
                .update({ is_active: false })
                .lt('updated_at', cutoffDate.toISOString())
                .select('id');

            logger.info(`Deactivated ${deletedProducts?.length || 0} old products`);

        } catch (error) {
            logger.error('Failed to cleanup old products:', error);
        }
    }
}

module.exports = new ProductSyncJob();
