import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOrderConfirmationEmail(order) {
    return transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@ecommerce.com',
        to: order.customer.email,
        subject: 'Order Confirmation',
        text: `Thank you for your order! Order ID: ${order.id}`,
    });
}

export async function sendRefundEmail(order) {
    return transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@ecommerce.com',
        to: order.customer.email,
        subject: 'Refund Processed',
        text: `Your refund for Order ID: ${order.id} has been processed.`,
    });
}

export async function sendAdminAlert(message) {
    return transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@ecommerce.com',
        to: process.env.ADMIN_EMAIL || 'admin@ecommerce.com',
        subject: 'Admin Alert',
        text: message,
    });
}
