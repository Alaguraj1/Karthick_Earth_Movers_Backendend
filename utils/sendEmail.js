const axios = require('axios');

const sendEmail = async (options) => {
    const vercelEmailUrl = process.env.EMAIL_SERVICE_URL; // e.g. https://karthick-earth-movers.vercel.app/api/send-email
    const secret = process.env.EMAIL_API_SECRET; // Shared secret between backend and frontend

    if (!vercelEmailUrl || !secret) {
        throw new Error('EMAIL_SERVICE_URL or EMAIL_API_SECRET environment variable is missing');
    }

    const response = await axios.post(
        vercelEmailUrl,
        {
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'x-api-secret': secret,
            },
        }
    );

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send email');
    }

    return response.data;
};

module.exports = sendEmail;
