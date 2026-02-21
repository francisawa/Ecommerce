import express from 'express';
import stripe from 'stripe';
import paypal from 'paypal-rest-sdk';
import { sendOrderConfirmationEmail, sendRefundEmail, sendAdminAlert } from './emailService.js';

const router = express.Router();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// ==================== STRIPE WEBHOOKS ====================

router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        const payload = req.rawBody || req.body;
        event = stripeClient.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.sendStatus(400);
    }

    // Handle event types
    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentIntentSucceeded(event.data.object);
            break;

        case 'payment_intent.payment_failed':
            await handlePaymentIntentFailed(event.data.object);
            break;

        case 'charge.refunded':
            await handleRefund(event.data.object);
            break;

        case 'charge.dispute.created':
            await handleDispute(event.data.object);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

// ==================== PAYPAL WEBHOOKS ====================

router.post('/paypal', express.json(), async (req, res) => {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const transmission_id = req.headers['paypal-transmission-id'];
    const transmission_time = req.headers['paypal-transmission-time'];
    const cert_url = req.headers['paypal-cert-url'];
    const auth_algo = req.headers['paypal-auth-algo'];
    const transmission_sig = req.headers['paypal-transmission-sig'];

    try {
        // Verify webhook signature
        const signatureVerified = await verifyPayPalWebhook(
            transmission_id,
            transmission_time,
            webhookId,
            req.body,
            cert_url,
            auth_algo,
            transmission_sig
        );

        if (!signatureVerified) {
            console.error('PayPal webhook signature verification failed');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const event = req.body;

        switch (event.event_type) {
            case 'PAYMENT.SALE.COMPLETED':
                await handlePayPalSaleCompleted(event.resource);
                break;

            case 'PAYMENT.SALE.DENIED':
                await handlePayPalSaleDenied(event.resource);
                break;

            case 'PAYMENT.SALE.REFUNDED':
                await handlePayPalRefund(event.resource);
                break;

            default:
                console.log(`Unhandled PayPal event: ${event.event_type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('PayPal webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// ==================== STRIPE EVENT HANDLERS ====================

async function handlePaymentIntentSucceeded(paymentIntent) {
    try {
        console.log(`✅ Payment Intent Succeeded: ${paymentIntent.id}`);
        // Update order status in database
        // const order = await Order.findOneAndUpdate(
        //     { paymentIntentId: paymentIntent.id },
        //     { status: 'paid', updatedAt: new Date() }
        // );
        // Example order object for email:
        const order = { id: paymentIntent.id, customer: { email: paymentIntent.receipt_email || 'customer@ecommerce.com' } };
        await sendOrderConfirmationEmail(order);
    } catch (error) {
        console.error('Error handling payment success:', error);
    }
}

async function handlePaymentIntentFailed(paymentIntent) {
    try {
        console.log(`❌ Payment Intent Failed: ${paymentIntent.id}`);
        console.log(`Reason: ${paymentIntent.last_payment_error.message}`);
        // Update order status
        // await Order.findOneAndUpdate(
        //     { paymentIntentId: paymentIntent.id },
        //     { status: 'failed', error: paymentIntent.last_payment_error.message }
        // );
    } catch (error) {
        console.error('Error handling payment failure:', error);
    }
}

async function handleRefund(charge) {
    try {
        console.log(`💰 Refund Processed: ${charge.id}`);
        console.log(`Amount: $${(charge.amount / 100).toFixed(2)}`);
        // Update order status
        // await Order.findOneAndUpdate(
        //     { chargeId: charge.id },
        //     { status: 'refunded', refundedAt: new Date() }
        // );
        // Example order object for email:
        const order = { id: charge.id, customer: { email: charge.billing_details?.email || 'customer@ecommerce.com' } };
        await sendRefundEmail(order);
    } catch (error) {
        console.error('Error handling refund:', error);
    }
}

async function handleDispute(charge) {
    try {
        console.log(`⚠️ Dispute Created: ${charge.id}`);
        await sendAdminAlert(`Dispute created for charge ${charge.id}`);
    } catch (error) {
        console.error('Error handling dispute:', error);
    }
}

// ==================== PAYPAL EVENT HANDLERS ====================

async function handlePayPalSaleCompleted(sale) {
    try {
        console.log(`✅ PayPal Sale Completed: ${sale.id}`);
        console.log(`Amount: ${sale.amount.currency} ${sale.amount.total}`);
        // Update order status in database
    } catch (error) {
        console.error('Error handling PayPal sale completion:', error);
    }
}

async function handlePayPalSaleDenied(sale) {
    try {
        console.log(`❌ PayPal Sale Denied: ${sale.id}`);
        // Update order status
    } catch (error) {
        console.error('Error handling PayPal sale denial:', error);
    }
}

async function handlePayPalRefund(sale) {
    try {
        console.log(`💰 PayPal Refund: ${sale.id}`);
        // Update order status
    } catch (error) {
        console.error('Error handling PayPal refund:', error);
    }
}

// ==================== WEBHOOK VERIFICATION ====================

async function verifyPayPalWebhook(
    transmission_id,
    transmission_time,
    webhook_id,
    webhook_body,
    cert_url,
    auth_algo,
    transmission_sig
) {
    try {
        const headers = {
            transmission_id,
            transmission_time,
            cert_url,
            auth_algo,
            transmission_sig,
        };

        return await new Promise((resolve, reject) => {
            paypal.notification.webhookEvent.verify(headers, webhook_body, webhook_id, (error, response) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(response && response.verification_status === 'SUCCESS');
            });
        });
    } catch (error) {
        console.error('PayPal signature verification error:', error);
        return false;
    }
}

export default router;
