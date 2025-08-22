/**
 * AI Service Integration
 * 
 * OpenAI-powered features for the Mallgram platform including:
 * - Intelligent product recommendations
 * - Natural language search enhancement
 * - Customer support chatbot
 * - Business analytics and insights
 * 
 * @author Mallgram Backend Team
 */

const OpenAI = require('openai');
const { supabase } = require('../config/supabase');
const logger = require('../config/logger');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.model = process.env.OPENAI_MODEL || 'gpt-4';
        this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 1000;
    }

    /**
     * Generate personalized product recommendations
     * @param {string} userId - User ID
     * @param {Array} userHistory - User interaction history
     * @param {string} type - Recommendation type
     * @param {number} limit - Number of recommendations
     * @param {string} categoryId - Optional category filter
     * @returns {Array} - Recommended products
     */
    async getPersonalizedRecommendations(userId, userHistory, type = 'general', limit = 10, categoryId = null) {
        try {
            // Analyze user behavior patterns
            const userProfile = this.analyzeUserBehavior(userHistory);
            
            // Get product database for context
            const products = await this.getProductsForRecommendation(categoryId, limit * 3);
            
            // Generate AI recommendations
            const prompt = this.buildRecommendationPrompt(userProfile, products, type, limit);
            
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI shopping assistant for Mallgram, a pan-African e-commerce platform. You help customers find the best products from China for African markets.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: 0.7
            });

            const recommendations = this.parseRecommendationResponse(response.choices[0].message.content, products);
            
            // Log AI interaction
            await this.logAIInteraction(userId, 'recommendations', prompt, response.choices[0].message.content);
            
            return recommendations;

        } catch (error) {
            logger.error('AI recommendations failed:', error);
            throw new Error('Failed to generate recommendations');
        }
    }

    /**
     * Process customer support chatbot queries
     * @param {string} userId - User ID
     * @param {string} query - User question
     * @param {Array} context - Conversation context
     * @returns {Object} - AI response with actions
     */
    async processChatQuery(userId, query, context = []) {
        try {
            // Search for relevant products if query is product-related
            const productContext = await this.searchProductsForChat(query);
            
            // Build chat context
            const messages = [
                {
                    role: 'system',
                    content: this.buildChatSystemPrompt()
                },
                ...context.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: this.buildChatUserPrompt(query, productContext)
                }
            ];

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages,
                max_tokens: this.maxTokens,
                temperature: 0.8
            });

            const aiResponse = response.choices[0].message.content;
            const parsedResponse = this.parseChatResponse(aiResponse, productContext);

            // Log AI interaction
            await this.logAIInteraction(userId, 'chat', query, aiResponse);

            return parsedResponse;

        } catch (error) {
            logger.error('AI chat processing failed:', error);
            throw new Error('Failed to process chat query');
        }
    }

    /**
     * Enhance search results with AI insights
     * @param {string} query - Search query
     * @param {Array} searchResults - Database search results
     * @param {Array} userHistory - User search history
     * @returns {Object} - Enhanced search suggestions
     */
    async enhanceSearchResults(query, searchResults, userHistory = []) {
        try {
            const prompt = `
                Search Query: "${query}"
                User's Recent Searches: ${userHistory.slice(0, 5).join(', ')}
                
                Current Search Results:
                ${searchResults.map(p => `- ${p.name} (${p.price_mallgram} XAF, Rating: ${p.rating_avg})`).join('\n')}
                
                Please provide:
                1. Alternative search terms that might be helpful
                2. Category suggestions based on the query
                3. Price range recommendations for African markets
                4. Product quality indicators to look for
                
                Respond in JSON format:
                {
                    "alternative_searches": ["term1", "term2"],
                    "suggested_categories": ["category1", "category2"],
                    "price_insights": "price recommendation text",
                    "quality_tips": "quality assessment tips"
                }
            `;

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a search enhancement AI for an African e-commerce platform. Provide helpful search suggestions.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.6
            });

            return JSON.parse(response.choices[0].message.content);

        } catch (error) {
            logger.error('Search enhancement failed:', error);
            return null;
        }
    }

    /**
     * Generate business insights from analytics data
     * @param {Object} analyticsData - Raw analytics data
     * @returns {Object} - AI-generated insights
     */
    async generateBusinessInsights(analyticsData) {
        try {
            const prompt = `
                Analyze this e-commerce data for Mallgram (African market):
                
                Sales Data:
                - Total Revenue: ${analyticsData.totalRevenue} XAF
                - Total Orders: ${analyticsData.totalOrders}
                - Average Order Value: ${analyticsData.avgOrderValue} XAF
                - Top Selling Categories: ${analyticsData.topCategories?.join(', ')}
                
                User Behavior:
                - Total Users: ${analyticsData.totalUsers}
                - Active Users: ${analyticsData.activeUsers}
                - Conversion Rate: ${analyticsData.conversionRate}%
                - Cart Abandonment Rate: ${analyticsData.abandonmentRate}%
                
                Geographic Data:
                - Top Countries: ${analyticsData.topCountries?.join(', ')}
                
                Please provide insights on:
                1. Performance trends
                2. Opportunities for growth
                3. Potential issues to address
                4. Recommendations for African market
                
                Format as JSON with clear, actionable insights.
            `;

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a business intelligence AI specializing in African e-commerce markets.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.5
            });

            return JSON.parse(response.choices[0].message.content);

        } catch (error) {
            logger.error('Business insights generation failed:', error);
            throw new Error('Failed to generate insights');
        }
    }

    /**
     * Analyze user behavior patterns
     * @param {Array} userHistory - User interaction history
     * @returns {Object} - User behavior profile
     */
    analyzeUserBehavior(userHistory) {
        const profile = {
            preferredCategories: [],
            priceRange: { min: 0, max: 0 },
            brandPreferences: [],
            searchPatterns: [],
            purchaseFrequency: 'low'
        };

        if (!userHistory || userHistory.length === 0) {
            return profile;
        }

        // Analyze categories
        const categoryViews = {};
        const pricePoints = [];
        const searchQueries = [];

        userHistory.forEach(interaction => {
            if (interaction.event_type === 'product_view' && interaction.metadata?.category_id) {
                const categoryId = interaction.metadata.category_id;
                categoryViews[categoryId] = (categoryViews[categoryId] || 0) + 1;
            }

            if (interaction.metadata?.price) {
                pricePoints.push(parseFloat(interaction.metadata.price));
            }

            if (interaction.event_type === 'search' && interaction.metadata?.query) {
                searchQueries.push(interaction.metadata.query);
            }
        });

        // Extract preferred categories
        profile.preferredCategories = Object.entries(categoryViews)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([categoryId]) => categoryId);

        // Calculate price range
        if (pricePoints.length > 0) {
            profile.priceRange.min = Math.min(...pricePoints);
            profile.priceRange.max = Math.max(...pricePoints);
        }

        // Extract search patterns
        profile.searchPatterns = searchQueries.slice(0, 10);

        // Determine purchase frequency
        const purchases = userHistory.filter(h => h.event_type === 'purchase');
        if (purchases.length > 5) {
            profile.purchaseFrequency = 'high';
        } else if (purchases.length > 2) {
            profile.purchaseFrequency = 'medium';
        }

        return profile;
    }

    /**
     * Handle product-specific inquiries
     * @param {string} productId - Product ID
     * @param {string} question - User question about the product
     * @param {Object} productData - Product information
     * @param {string} userId - User ID
     * @param {Object} context - Additional context
     * @returns {Object} - AI response with product-specific answer
     */
    async handleProductInquiry(productId, question, productData = null, userId = null, context = {}) {
        try {
            // Get product data if not provided
            if (!productData && productId) {
                const { data: product } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();
                productData = product;
            }

            if (!productData) {
                return {
                    answer: "I couldn't find information about this product. Please try again or contact support.",
                    confidence: 0,
                    actions: [{ type: 'contact_support' }]
                };
            }

            const prompt = `
            You are a helpful product expert for Mallgram e-commerce platform. 
            
            Product Information:
            - Name: ${productData.name}
            - Description: ${productData.description}
            - Price: ${productData.price}
            - Category: ${productData.category}
            - Features: ${JSON.stringify(productData.features || {})}
            
            Customer Question: "${question}"
            
            Please provide a helpful, accurate answer about this product. If you don't have specific information, be honest about it and suggest alternatives.
            
            Respond in JSON format:
            {
                "answer": "detailed answer",
                "confidence": 0.8,
                "relatedQuestions": ["question1", "question2"],
                "productHighlights": ["highlight1", "highlight2"],
                "actions": [{"type": "action_type", "label": "Action Label"}]
            }
            `;

            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7
            });

            const response = JSON.parse(completion.choices[0].message.content);

            // Log the inquiry
            if (userId) {
                await this.logUserEvent(userId, 'product_inquiry', {
                    productId,
                    question,
                    response: response.answer
                });
            }

            return response;

        } catch (error) {
            logger.error('Product inquiry failed:', error);
            return {
                answer: "I'm having trouble accessing product information right now. Please try again later.",
                confidence: 0,
                actions: [{ type: 'retry' }, { type: 'contact_support' }]
            };
        }
    }

    /**
     * Analyze product review sentiment and extract insights
     * @param {string} review - Review text
     * @param {string} productId - Product ID
     * @param {string} userId - User ID
     * @returns {Object} - Review analysis
     */
    async analyzeReview(review, productId = null, userId = null) {
        try {
            const prompt = `
            Analyze this product review and provide insights:
            
            Review: "${review}"
            
            Please analyze and respond in JSON format:
            {
                "sentiment": "positive|negative|neutral",
                "sentimentScore": 0.8,
                "keyPoints": ["point1", "point2"],
                "categories": ["quality", "delivery", "price"],
                "qualityScore": 0.9,
                "helpfulnessScore": 0.7
            }
            
            Sentiment score should be between -1 (very negative) and 1 (very positive).
            Quality and helpfulness scores should be between 0 and 1.
            `;

            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300,
                temperature: 0.3
            });

            const analysis = JSON.parse(completion.choices[0].message.content);

            // Log the analysis
            if (userId) {
                await this.logUserEvent(userId, 'review_analysis', {
                    productId,
                    sentiment: analysis.sentiment,
                    score: analysis.sentimentScore
                });
            }

            return analysis;

        } catch (error) {
            logger.error('Review analysis failed:', error);
            return {
                sentiment: 'neutral',
                sentimentScore: 0,
                keyPoints: [],
                categories: [],
                qualityScore: 0,
                helpfulnessScore: 0
            };
        }
    }

    /**
     * Check AI service health
     * @returns {Object} - Health status
     */
    async checkHealth() {
        try {
            const startTime = Date.now();
            
            // Simple health check with OpenAI
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: 'Health check. Respond with "OK".' }],
                max_tokens: 5,
                temperature: 0
            });

            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                openaiAvailable: true,
                responseTime
            };

        } catch (error) {
            logger.error('AI health check failed:', error);
            return {
                status: 'unhealthy',
                openaiAvailable: false,
                responseTime: null,
                error: error.message
            };
        }
    }

    /**
     * Get products for recommendation context
     */
    async getProductsForRecommendation(categoryId = null, limit = 30) {
        let query = supabase
            .from('products')
            .select('id, name, description, price_mallgram, rating_avg, category_id, images')
            .gt('stock', 0)
            .gte('rating_avg', 3.0);

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        const { data: products } = await query
            .order('rating_avg', { ascending: false })
            .limit(limit);

        return products || [];
    }

    /**
     * Build recommendation prompt for AI
     */
    buildRecommendationPrompt(userProfile, products, type, limit) {
        return `
            User Profile:
            - Preferred Categories: ${userProfile.preferredCategories.join(', ')}
            - Price Range: ${userProfile.priceRange.min} - ${userProfile.priceRange.max} XAF
            - Purchase Frequency: ${userProfile.purchaseFrequency}
            - Recent Searches: ${userProfile.searchPatterns.slice(0, 5).join(', ')}
            
            Available Products:
            ${products.map(p => `ID: ${p.id}, Name: ${p.name}, Price: ${p.price_mallgram} XAF, Rating: ${p.rating_avg}`).join('\n')}
            
            Recommendation Type: ${type}
            
            Please recommend ${limit} products that would be most relevant for this user.
            Consider African market preferences and practical needs.
            
            Respond with only product IDs in this format: [id1, id2, id3, ...]
        `;
    }

    /**
     * Parse AI recommendation response
     */
    parseRecommendationResponse(response, products) {
        try {
            // Extract product IDs from response
            const idMatch = response.match(/\[(.*?)\]/);
            if (!idMatch) return [];

            const ids = idMatch[1].split(',').map(id => id.trim().replace(/"/g, ''));
            
            // Return matching products
            return products.filter(p => ids.includes(p.id));

        } catch (error) {
            logger.warn('Failed to parse recommendation response:', error);
            return products.slice(0, 5); // Fallback to top products
        }
    }

    /**
     * Search products relevant to chat query
     */
    async searchProductsForChat(query) {
        const { data: products } = await supabase
            .from('products')
            .select('id, name, price_mallgram, rating_avg, stock')
            .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
            .gt('stock', 0)
            .limit(5);

        return products || [];
    }

    /**
     * Build chat system prompt
     */
    buildChatSystemPrompt() {
        return `
            You are a helpful customer service AI for Mallgram, a pan-African e-commerce platform.
            You help customers:
            - Find products from China suitable for African markets
            - Answer questions about orders, shipping, and payments
            - Provide product recommendations
            - Assist with account and technical issues
            
            Always be friendly, helpful, and culturally sensitive to African customers.
            If you can't answer something, offer to connect them with human support.
            
            Available payment methods include: MTN Mobile Money, Orange Money, Kora Pay, PayGate, PayFast
            Shipping covers: South Africa, Cameroon (with plans for more African countries)
            Languages supported: English and French
        `;
    }

    /**
     * Build chat user prompt with context
     */
    buildChatUserPrompt(query, productContext) {
        let prompt = `Customer Question: ${query}`;
        
        if (productContext.length > 0) {
            prompt += `\n\nRelevant Products Found:\n`;
            prompt += productContext.map(p => 
                `- ${p.name} (${p.price_mallgram} XAF, Rating: ${p.rating_avg}, Stock: ${p.stock})`
            ).join('\n');
        }
        
        return prompt;
    }

    /**
     * Parse chat response for actions
     */
    parseChatResponse(response, productContext) {
        return {
            message: response,
            suggested_products: productContext.slice(0, 3),
            actions: this.extractActionsFromResponse(response),
            needs_human_support: response.toLowerCase().includes('human support') || 
                               response.toLowerCase().includes('contact support')
        };
    }

    /**
     * Extract suggested actions from AI response
     */
    extractActionsFromResponse(response) {
        const actions = [];
        
        if (response.toLowerCase().includes('add to cart')) {
            actions.push('add_to_cart');
        }
        
        if (response.toLowerCase().includes('view product')) {
            actions.push('view_product');
        }
        
        if (response.toLowerCase().includes('check order')) {
            actions.push('check_order');
        }
        
        return actions;
    }

    /**
     * Log AI interactions for analytics
     */
    async logAIInteraction(userId, queryType, query, response) {
        try {
            await supabase
                .from('ai_logs')
                .insert({
                    user_id: userId,
                    query,
                    response,
                    metadata: {
                        type: queryType,
                        model: this.model,
                        timestamp: new Date().toISOString()
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
        } catch (error) {
            logger.error('Failed to log AI interaction:', error);
        }
    }
}

// Export singleton instance
module.exports = new AIService();
