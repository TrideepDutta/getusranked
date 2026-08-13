import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { checkRateLimit } from '../../utils/rate-limiter';

export const prerender = false;

interface ContactRequestBody {
  name?: string;
  email?: string;
  company?: string;
  website?: string;
  message?: string;
  business?: string;
  'cf-turnstile-response'?: string;
  turnstileBlocked?: boolean;
}

export const POST: APIRoute = async ({ request }) => {
  // 1. Extract Client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || '127.0.0.1';

  // 2. Enforce Rate Limiting (5 requests per hour)
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    const minutesLeft = Math.ceil(rateLimit.resetTimeMs / (1000 * 60));
    return new Response(
      JSON.stringify({
        error: `Too many submissions from your IP. Please try again in ${minutesLeft} minute(s).`,
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  }

  // 3. Parse Body
  let body: ContactRequestBody = {};
  try {
    body = await request.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload in request' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }

  const { name, email, company, website, message: rawMessage, business, turnstileBlocked } = body;
  const message = (rawMessage || business || '').trim();
  const turnstileToken = body['cf-turnstile-response'];

  // Input Validation
  if (!name || !email || !message) {
    return new Response(
      JSON.stringify({ error: 'Name, email, and message / business description are required fields.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Please enter a valid email address.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }

  // 4. Verify Cloudflare Turnstile Token (if secret key is configured)
  const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret && turnstileSecret !== '0x4AAAAAAA...') {
    if (turnstileToken) {
      try {
        const turnstileFormData = new URLSearchParams();
        turnstileFormData.append('secret', turnstileSecret);
        turnstileFormData.append('response', turnstileToken);
        turnstileFormData.append('remoteip', clientIp);

        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: turnstileFormData,
        });

        const turnstileData = await turnstileRes.json();
        if (!turnstileData.success) {
          return new Response(
            JSON.stringify({ error: 'CAPTCHA verification failed. Please check the security box and try again.' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
          );
        }
      } catch (err) {
        console.warn('Turnstile siteverify API error (allowing submission fallback):', err);
      }
    } else if (turnstileBlocked) {
      console.warn(`[Turnstile] Client browser (${clientIp}) blocked Turnstile script (e.g. Safari ITP/AdBlocker). Accepting lead with fallback.`);
    } else {
      return new Response(
        JSON.stringify({ error: 'Security check incomplete. Please complete the CAPTCHA security check or refresh the page.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
  }

  // 5. Save/Backup Lead to Google Sheet Webhook (Background)
  const googleSheetUrl = import.meta.env.PUBLIC_GOOGLE_SHEET_SCRIPT_URL || process.env.PUBLIC_GOOGLE_SHEET_SCRIPT_URL;
  if (googleSheetUrl) {
    try {
      fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        body: JSON.stringify({ name, email, company, website, message, timestamp: new Date().toISOString() }),
      }).catch((e) => console.error('Google Sheet backup fetch error:', e));
    } catch (e) {
      console.error('Google Sheet backup trigger error:', e);
    }
  }

  let emailStatus = { autoResponderSent: false, adminAlertSent: false };

  // 6. Send Email via Nodemailer (Gmail SMTP)
  const gmailUser = import.meta.env.GMAIL_USER || process.env.GMAIL_USER || 'trideep.getusranked@gmail.com';
  const gmailAppPassword = import.meta.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  const adminEmail = import.meta.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || 'trideep.getusranked@gmail.com';

  if (gmailAppPassword) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    // 6a. Nodemailer Auto-Responder Confirmation Email to Client
    try {
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e7e6; border-radius: 16px; color: #0b1419;">
          <div style="margin-bottom: 24px; text-align: left;">
            <h1 style="color: #0b1419; font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">Thanks for reaching out!</h1>
            <p style="color: #4a555e; font-size: 16px; line-height: 1.6; margin: 0;">Hi ${name},</p>
          </div>
          
          <p style="color: #4a555e; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for connecting with us at <strong>GetUsRanked</strong>. We've successfully received your inquiry, and our team is currently reviewing your details.
          </p>

          <p style="color: #4a555e; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            We carefully assess every site review and growth request, and someone from our team will get back to you within <strong>24 business hours</strong>.
          </p>

          <div style="background-color: #f6f8f7; border-left: 4px solid #1463FF; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #1463FF; margin: 0 0 10px 0;">Summary of Your Submission</p>
            <p style="font-size: 14px; color: #0b1419; margin: 0 0 6px 0;"><strong>Name:</strong> ${name}</p>
            <p style="font-size: 14px; color: #0b1419; margin: 0 0 6px 0;"><strong>Email:</strong> ${email}</p>
            ${company ? `<p style="font-size: 14px; color: #0b1419; margin: 0 0 6px 0;"><strong>Company:</strong> ${company}</p>` : ''}
            ${website ? `<p style="font-size: 14px; color: #0b1419; margin: 0 0 6px 0;"><strong>Website:</strong> ${website}</p>` : ''}
            <p style="font-size: 14px; color: #0b1419; margin: 8px 0 0 0;"><strong>Message / Details:</strong></p>
            <p style="font-size: 14px; color: #4a555e; font-style: italic; margin: 4px 0 0 0; white-space: pre-wrap;">"${message}"</p>
          </div>

          <p style="color: #4a555e; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            If you have any extra details or questions in the meantime, feel free to reply directly to this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e7e6; margin: 24px 0;" />
          <p style="color: #8a959e; font-size: 13px; margin: 0; line-height: 1.6;">
            Warm regards,<br />
            <strong style="color: #0b1419;">The GetUsRanked Team</strong><br />
            <a href="https://getusranked.com" style="color: #1463FF; text-decoration: none;">getusranked.com</a>
          </p>
        </div>
      `;

      const textContent = `Hi ${name},

Thank you for connecting with us at GetUsRanked. We've successfully received your inquiry, and our team is currently reviewing your details. We will get back to you within 24 business hours.

Summary of your submission:
- Name: ${name}
- Email: ${email}
${company ? `- Company: ${company}\n` : ''}${website ? `- Website: ${website}\n` : ''}- Message: ${message}

If you have any additional details or questions in the meantime, feel free to reply directly to this email.

Warm regards,
The GetUsRanked Team
https://getusranked.com`;

      await transporter.sendMail({
        from: `"GetUsRanked" <${gmailUser}>`,
        to: email,
        subject: 'Thanks for reaching out to GetUsRanked!',
        text: textContent,
        html: htmlContent,
      });

      emailStatus.autoResponderSent = true;
    } catch (err) {
      console.error('Nodemailer Gmail auto-responder error:', err);
    }

    // 6b. Nodemailer Admin Alert Email to Team
    try {
      const adminHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #ddd; border-radius: 12px; color: #333;">
          <h2 style="color: #1463FF; margin-top: 0;">🔥 New Website Inquiry Received</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 130px;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${name}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${company || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Website:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${website ? `<a href="${website}">${website}</a>` : 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Client IP:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${clientIp}</td></tr>
          </table>
          <div style="margin-top: 16px;">
            <strong>Message / Business Description:</strong>
            <p style="background: #f4f5f6; padding: 12px; border-radius: 6px; font-size: 14px; color: #333; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"GetUsRanked Leads" <${gmailUser}>`,
        to: adminEmail,
        subject: `🔥 New Lead Inquiry: ${name} (${company || 'Individual'})`,
        html: adminHtml,
      });

      emailStatus.adminAlertSent = true;
    } catch (err) {
      console.error('Nodemailer Gmail admin alert error:', err);
    }
  }

  // 7. Fallback Delivery via Resend (if Nodemailer not sent & Resend key exists)
  const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!emailStatus.autoResponderSent && resendApiKey && resendApiKey !== 're_123456789_your_api_key') {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'GetUsRanked <trideep.getusranked@gmail.com>',
        to: [email],
        subject: 'Thanks for reaching out to GetUsRanked!',
        html: `<p>Hi ${name}, thank you for reaching out! We received your message and our team will review it shortly.</p>`,
      });
      emailStatus.autoResponderSent = true;
    } catch (err) {
      console.error('Resend fallback error:', err);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Thank you! Your message has been submitted successfully. A confirmation email has been sent to your inbox.',
      emailStatus,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    }
  );
};
