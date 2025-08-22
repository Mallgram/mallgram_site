/**
 * AI Routes
 * 
 * Handles AI-powered features for the Mallgram platform including
 * chatbot interactions and product recommendations.
 * 
 * Routes:
 * - POST /ai/chat - Process chatbot conversation
 * - POST /ai/recommendations - Get product recommendations
 * - POST /ai/search-enhance - Enhance search with AI
 * - POST /ai/product-inquiry - Handle product-specific questions
 * 
 * @author Mallgram Backend Team
 */

const express = require('express');
const logger = require('../config/logger');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * POST /ai/chat
 * Process chatbot conversation
 */
router.post('/chat',
    asyncHandler(async (req, res) => {
        const { message, userId, conversationHistory = [], context = {} } = req.body;

        if (!message) {
            throw new ValidationError('Message is required');
        }

        try {
            const response = await aiService.processChatQuery(
                userId || 'anonymous',
                message,
                conversationHistory,
                context
            );

            logger.info('AI chat processed', { 
                userId: userId || 'anonymous',
                messageLength: message.length,
                responseType: response.type
            });

            res.json({
                success: true,
                data: {
                    response: response.message,
                    type: response.type,
                    actions: response.actions || [],
                    products: response.products || [],
                    conversation_id: response.conversationId,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('AI chat processing failed:', error);
            
            // Fallback response
            res.json({
                success: true,
                data: {
                    response: "I'm sorry, I'm having trouble understanding your request right now. Please try again or contact our support team for assistance.",
                    type: 'fallback',
                    actions: [{ type: 'contact_support' }],
                    timestamp: new Date().toISOString()
                }
            });
        }
    })
);

/**
 * POST /ai/recommendations
 * Get AI-powered product recommendations
 */
router.post('/recommendations',
    asyncHandler(async (req, res) => {
        const { 
            userId, 
            userHistory = [], 
            currentProduct = null,
            type = 'general',
            limit = 10,
            categoryId = null,
            priceRange = null
        } = req.body;

        try {
            const recommendations = await aiService.getPersonalizedRecommendations(
                userId || 'anonymous',
                userHistory,
                type,
                limit,
                categoryId,
                priceRange,
                currentProduct
            );

            logger.info('AI recommendations generated', {
                userId: userId || 'anonymous',
                type,
                count: recommendations.length
            });

            res.json({
                success: true,
                data: {
                    recommendations,
                    type,
                    generated_at: new Date().toISOString(),
                    algorithm_version: '1.0'
                }
            });
        } catch (error) {
            logger.error('AI recommendations failed:', error);
            
            // Return empty recommendations on error
            res.json({
                success: true,
                data: {
                    recommendations: [],
                    type,
                    generated_at: new Date().toISOString(),
                    error: 'Recommendations temporarily unavailable'
                }
            });
        }
    })
);

/**
 * POST /ai/search-enhance
 * Enhance search results with AI insights
 */
router.post('/search-enhance',
    asyncHandler(async (req, res) => {
        const { 
            query, 
            searchResults = [], 
            userHistory = [],
            userId = null,
            filters = {}
        } = req.body;

        if (!query) {
            throw new ValidationError('Search query is required');
        }

        try {
            const enhancedResults = await aiService.enhanceSearchResults(
                query,
                searchResults,
                userHistory,
                filters,
                userId
            );

            logger.info('Search enhanced with AI', {
                query,
                originalCount: searchResults.length,
                enhancedCount: enhancedResults.suggestions?.length || 0,
                userId: userId || 'anonymous'
            });

            res.json({
                success: true,
                data: {
                    enhanced_query: enhancedResults.enhancedQuery,
                    suggestions: enhancedResults.suggestions || [],
                    filters: enhancedResults.recommendedFilters || {},
                    search_tips: enhancedResults.searchTips || [],
                    related_searches: enhancedResults.relatedSearches || [],
                    processed_at: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Search enhancement failed:', error);
            
            // Return original query on error
            res.json({
                success: true,
                data: {
                    enhanced_query: query,
                    suggestions: [],
                    processed_at: new Date().toISOString(),
                    error: 'Search enhancement temporarily unavailable'
                }
            });
        }
    })
);

/**
 * POST /ai/product-inquiry
 * Handle product-specific AI questions
 */
router.post('/product-inquiry',
    asyncHandler(async (req, res) => {
        const { 
            productId, 
            question, 
            productData = null,
            userId = null,
            context = {}
        } = req.body;

        if (!productId || !question) {
            throw new ValidationError('Product ID and question are required');
        }

        try {
            const response = await aiService.handleProductInquiry(
                productId,
                question,
                productData,
                userId,
                context
            );

            logger.info('Product inquiry processed', {
                productId,
                questionLength: question.length,
                userId: userId || 'anonymous'
            });

            res.json({
                success: true,
                data: {
                    answer: response.answer,
                    confidence: response.confidence,
                    related_questions: response.relatedQuestions || [],
                    product_highlights: response.productHighlights || [],
                    actions: response.actions || [],
                    processed_at: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Product inquiry failed:', error);
            
            // Fallback response
            res.json({
                success: true,
                data: {
                    answer: "I don't have specific information about that aspect of this product. Please check the product description or contact our support team for more details.",
                    confidence: 0,
                    actions: [{ type: 'contact_support' }],
                    processed_at: new Date().toISOString()
                }
            });
        }
    })
);

/**
 * POST /ai/analyze-review
 * Analyze product review sentiment and extract insights
 */
router.post('/analyze-review',
    asyncHandler(async (req, res) => {
        const { review, productId, userId = null } = req.body;

        if (!review) {
            throw new ValidationError('Review text is required');
        }

        try {
            const analysis = await aiService.analyzeReview(review, productId, userId);

            logger.info('Review analyzed', {
                productId,
                reviewLength: review.length,
                sentiment: analysis.sentiment
            });

            res.json({
                success: true,
                data: {
                    sentiment: analysis.sentiment,
                    sentiment_score: analysis.sentimentScore,
                    key_points: analysis.keyPoints || [],
                    categories: analysis.categories || [],
                    quality_score: analysis.qualityScore,
                    helpfulness_score: analysis.helpfulnessScore,
                    processed_at: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Review analysis failed:', error);
            
            res.json({
                success: true,
                data: {
                    sentiment: 'neutral',
                    sentiment_score: 0,
                    processed_at: new Date().toISOString(),
                    error: 'Review analysis temporarily unavailable'
                }
            });
        }
    })
);

/**
 * GET /ai/health
 * Check AI service health
 */
router.get('/health',
    asyncHandler(async (req, res) => {
        try {
            const health = await aiService.checkHealth();

            res.json({
                success: true,
                data: {
                    status: health.status,
                    openai_available: health.openaiAvailable,
                    response_time: health.responseTime,
                    last_check: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('AI health check failed:', error);
            
            res.status(503).json({
                success: false,
                error: 'AI service health check failed',
                timestamp: new Date().toISOString()
            });
        }
    })
);

module.exports = router;
