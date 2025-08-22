/**
 * Delivery Tracking Cron Job
 * 
 * Tracks order deliveries with carrier APIs and updates order status.
 * Sends email notifications for delivery updates.
 * 
 * @author Mallgram Backend Team
 */

const axios = require('axios');
const { supabase } = require('../config/supabase');
const logger = require('../config/logger');
const emailService = require('../services/emailService');

class DeliveryTrackingJob {
    constructor() {
        this.carriers = {
            dhl: {
                apiKey: process.env.DHL_API_KEY,
                baseUrl: 'https://api-eu.dhl.com/track/shipments'
            },
            fedex: {
                apiKey: process.env.FEDEX_API_KEY,
                baseUrl: 'https://apis.fedex.com/track/v1/trackingnumbers'
            },
            ups: {
                apiKey: process.env.UPS_API_KEY,
                baseUrl: 'https://onlinetools.ups.com/api/track/v1/details'
            }
        };
    }

    /**
     * Main execution method
     */
    async execute() {
        const startTime = Date.now();
        let trackingStats = {
            total_orders: 0,
            updated_orders: 0,
            notifications_sent: 0,
            errors: 0
        };

        try {
            logger.info('Starting delivery tracking job');

            // Get orders that need tracking updates
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    tracking_number,
                    status,
                    carrier,
                    user_id,
                    created_at,
                    users(email, full_name)
                `)
                .in('status', ['processing', 'shipped', 'in_transit'])
                .not('tracking_number', 'is', null);

            if (error) {
                throw new Error(`Failed to fetch orders: ${error.message}`);
            }

            trackingStats.total_orders = orders.length;

            // Process each order
            for (const order of orders) {
                try {
                    const trackingUpdate = await this.trackOrder(order);
                    
                    if (trackingUpdate.status_changed) {
                        await this.updateOrderStatus(order.id, trackingUpdate);
                        trackingStats.updated_orders++;

                        // Send notification email
                        if (order.users?.email) {
                            await this.sendTrackingNotification(order, trackingUpdate);
                            trackingStats.notifications_sent++;
                        }
                    }

                } catch (error) {
                    logger.error(`Failed to track order ${order.id}:`, error);
                    trackingStats.errors++;
                }
            }

            const duration = Date.now() - startTime;
            
            logger.info('Delivery tracking completed', {
                duration: `${duration}ms`,
                stats: trackingStats
            });

            return {
                success: true,
                duration,
                stats: trackingStats
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Delivery tracking job failed:', error);
            
            return {
                success: false,
                duration,
                error: error.message,
                stats: trackingStats
            };
        }
    }

    /**
     * Track individual order with carrier API
     */
    async trackOrder(order) {
        try {
            const carrier = order.carrier?.toLowerCase() || 'dhl';
            let trackingData = null;

            switch (carrier) {
                case 'dhl':
                    trackingData = await this.trackWithDHL(order.tracking_number);
                    break;
                case 'fedex':
                    trackingData = await this.trackWithFedEx(order.tracking_number);
                    break;
                case 'ups':
                    trackingData = await this.trackWithUPS(order.tracking_number);
                    break;
                default:
                    // Fallback tracking for unknown carriers
                    trackingData = await this.genericTracking(order.tracking_number);
            }

            const newStatus = this.mapCarrierStatusToOrderStatus(trackingData.status);
            const statusChanged = newStatus !== order.status;

            return {
                status_changed: statusChanged,
                new_status: newStatus,
                tracking_data: trackingData,
                carrier_response: trackingData.raw_response,
                location: trackingData.location,
                estimated_delivery: trackingData.estimated_delivery,
                last_update: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`Tracking failed for order ${order.id}:`, error);
            return {
                status_changed: false,
                error: error.message
            };
        }
    }

    /**
     * Track with DHL API
     */
    async trackWithDHL(trackingNumber) {
        try {
            if (!this.carriers.dhl.apiKey) {
                throw new Error('DHL API key not configured');
            }

            const response = await axios.get(
                `${this.carriers.dhl.baseUrl}/${trackingNumber}`,
                {
                    headers: {
                        'DHL-API-Key': this.carriers.dhl.apiKey,
                        'Accept': 'application/json'
                    }
                }
            );

            const shipment = response.data.shipments?.[0];
            if (!shipment) {
                throw new Error('No tracking information found');
            }

            const latestEvent = shipment.events?.[0];

            return {
                status: latestEvent?.status || 'unknown',
                location: latestEvent?.location?.address?.addressLocality || '',
                description: latestEvent?.description || '',
                timestamp: latestEvent?.timestamp,
                estimated_delivery: shipment.estimatedTimeOfDelivery,
                raw_response: response.data
            };

        } catch (error) {
            logger.error('DHL tracking failed:', error);
            throw error;
        }
    }

    /**
     * Track with FedEx API
     */
    async trackWithFedEx(trackingNumber) {
        try {
            if (!this.carriers.fedex.apiKey) {
                throw new Error('FedEx API key not configured');
            }

            const response = await axios.post(
                this.carriers.fedex.baseUrl,
                {
                    trackingInfo: [
                        {
                            trackingNumberInfo: {
                                trackingNumber: trackingNumber
                            }
                        }
                    ],
                    includeDetailedScans: true
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.carriers.fedex.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const trackingInfo = response.data.output?.completeTrackResults?.[0]?.trackResults?.[0];
            if (!trackingInfo) {
                throw new Error('No tracking information found');
            }

            const latestScan = trackingInfo.scanEvents?.[0];

            return {
                status: trackingInfo.latestStatusDetail?.code || 'unknown',
                location: latestScan?.scanLocation?.city || '',
                description: trackingInfo.latestStatusDetail?.description || '',
                timestamp: latestScan?.date,
                estimated_delivery: trackingInfo.estimatedDeliveryTimeWindow?.window?.ends,
                raw_response: response.data
            };

        } catch (error) {
            logger.error('FedEx tracking failed:', error);
            throw error;
        }
    }

    /**
     * Track with UPS API
     */
    async trackWithUPS(trackingNumber) {
        try {
            if (!this.carriers.ups.apiKey) {
                throw new Error('UPS API key not configured');
            }

            const response = await axios.get(
                `${this.carriers.ups.baseUrl}/${trackingNumber}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.carriers.ups.apiKey}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const packageInfo = response.data.trackResponse?.shipment?.[0]?.package?.[0];
            if (!packageInfo) {
                throw new Error('No tracking information found');
            }

            const latestActivity = packageInfo.activity?.[0];

            return {
                status: latestActivity?.status?.code || 'unknown',
                location: latestActivity?.location?.address?.city || '',
                description: latestActivity?.status?.description || '',
                timestamp: latestActivity?.date + 'T' + latestActivity?.time,
                estimated_delivery: packageInfo.deliveryDate?.[0]?.date,
                raw_response: response.data
            };

        } catch (error) {
            logger.error('UPS tracking failed:', error);
            throw error;
        }
    }

    /**
     * Generic tracking for unknown carriers
     */
    async genericTracking(trackingNumber) {
        // Fallback method - could integrate with a universal tracking service
        return {
            status: 'in_transit',
            location: 'Unknown',
            description: 'Package is in transit',
            timestamp: new Date().toISOString(),
            estimated_delivery: null,
            raw_response: { message: 'Generic tracking - no carrier API available' }
        };
    }

    /**
     * Map carrier status to internal order status
     */
    mapCarrierStatusToOrderStatus(carrierStatus) {
        const statusMap = {
            // DHL statuses
            'pre-transit': 'processing',
            'transit': 'in_transit',
            'delivered': 'delivered',
            'exception': 'delivery_exception',
            'unknown': 'shipped',

            // FedEx statuses
            'PU': 'processing', // Picked up
            'IT': 'in_transit', // In transit
            'OD': 'out_for_delivery', // Out for delivery
            'DL': 'delivered', // Delivered
            'EX': 'delivery_exception', // Exception

            // UPS statuses
            'M': 'processing', // Manifest pickup
            'I': 'in_transit', // In transit
            'D': 'delivered', // Delivered
            'X': 'delivery_exception' // Exception
        };

        return statusMap[carrierStatus?.toLowerCase()] || 'shipped';
    }

    /**
     * Update order status in database
     */
    async updateOrderStatus(orderId, trackingUpdate) {
        try {
            const updateData = {
                status: trackingUpdate.new_status,
                tracking_data: trackingUpdate.tracking_data,
                updated_at: new Date().toISOString()
            };

            if (trackingUpdate.estimated_delivery) {
                updateData.estimated_delivery = trackingUpdate.estimated_delivery;
            }

            if (trackingUpdate.new_status === 'delivered') {
                updateData.delivered_at = new Date().toISOString();
            }

            await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            logger.info(`Order ${orderId} status updated to ${trackingUpdate.new_status}`);

        } catch (error) {
            logger.error(`Failed to update order ${orderId} status:`, error);
            throw error;
        }
    }

    /**
     * Send tracking notification email
     */
    async sendTrackingNotification(order, trackingUpdate) {
        try {
            const orderData = {
                orderId: order.id,
                orderNumber: order.id.slice(-8).toUpperCase(),
                trackingNumber: order.tracking_number,
                status: trackingUpdate.new_status,
                customerName: order.users.full_name
            };

            await emailService.sendOrderTrackingEmail(
                order.users.email,
                orderData,
                {
                    status: trackingUpdate.new_status,
                    location: trackingUpdate.tracking_data?.location,
                    description: trackingUpdate.tracking_data?.description,
                    estimatedDelivery: trackingUpdate.estimated_delivery,
                    timestamp: trackingUpdate.last_update
                },
                order.user_id
            );

            logger.info(`Tracking notification sent for order ${order.id}`);

        } catch (error) {
            logger.error(`Failed to send tracking notification for order ${order.id}:`, error);
        }
    }

    /**
     * Handle bulk shipping requests (after 48h)
     */
    async processBulkShipping() {
        try {
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - 48); // 48 hours ago

            // Get paid orders that need to be sent for shipping
            const { data: orders } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'paid')
                .eq('payment_status', 'success')
                .lt('created_at', cutoffTime.toISOString());

            if (orders?.length > 0) {
                // Group orders by destination country for bulk shipping
                const ordersByCountry = this.groupOrdersByCountry(orders);

                for (const [country, countryOrders] of Object.entries(ordersByCountry)) {
                    await this.createBulkShipment(country, countryOrders);
                }

                logger.info(`Processed bulk shipping for ${orders.length} orders`);
            }

        } catch (error) {
            logger.error('Bulk shipping processing failed:', error);
        }
    }

    /**
     * Group orders by destination country
     */
    groupOrdersByCountry(orders) {
        return orders.reduce((groups, order) => {
            const shippingAddress = typeof order.shipping_address === 'string' 
                ? JSON.parse(order.shipping_address) 
                : order.shipping_address;
            
            const country = shippingAddress.country || 'UNKNOWN';
            
            if (!groups[country]) {
                groups[country] = [];
            }
            groups[country].push(order);
            
            return groups;
        }, {});
    }

    /**
     * Create bulk shipment request
     */
    async createBulkShipment(country, orders) {
        try {
            // Create shipping request to carrier/logistics partner
            const shipmentData = {
                destination_country: country,
                order_count: orders.length,
                orders: orders.map(order => ({
                    order_id: order.id,
                    shipping_address: order.shipping_address,
                    items: order.order_items
                })),
                created_at: new Date().toISOString()
            };

            // Update orders status to processing
            const orderIds = orders.map(o => o.id);
            await supabase
                .from('orders')
                .update({
                    status: 'processing',
                    bulk_shipment_created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .in('id', orderIds);

            logger.info(`Created bulk shipment for ${country} with ${orders.length} orders`);

        } catch (error) {
            logger.error(`Failed to create bulk shipment for ${country}:`, error);
        }
    }
}

module.exports = new DeliveryTrackingJob();
