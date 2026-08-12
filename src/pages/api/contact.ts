import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { checkRateLimit } from '../../utils/rate-limiter';

export const prerender = false;

interface ContactRequestBody {
  name?: string;
  email?: string;
  company?: string;
  website?: string;
  message?: string;
  'cf-turnstile-response'?: string;
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

  const { name, email, company, website, message } = body;
  const turnstileToken = body['cf-turnstile-response'];

  // Input Validation
  if (!name || !email || !message) {
    return new Response(
      JSON.stringify({ error: 'Name, email, and message are required fields.' }),
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
    if (!turnstileToken) {
      return new Response(
        JSON.stringify({ error: 'CAPTCHA verification failed. Please complete the security check.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

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
          JSON.stringify({ error: 'CAPTCHA verification failed. Please try again.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        );
      }
    } catch (err) {
      console.error('Turnstile verification error:', err);
    }
  }

  // 5. Fallback Step: Send to Google Sheet Webhook (Background Backup)
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

  // 6. Double Email Delivery via Resend
  const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  const adminEmail = import.meta.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || 'hello@getusranked.com';

  let emailStatus = { autoResponderSent: false, adminAlertSent: false };

  if (resendApiKey && resendApiKey !== 're_123456789_your_api_key') {
    const resend = new Resend(resendApiKey);

    // 6a. Auto-Responder Email to Client
    try {
      await resend.emails.send({
        from: 'GetUsRanked <hello@getusranked.com>',
        to: [email],
        subject: `We've received your message, ${name}!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e7e6; border-radius: 16px;">
            <div style="margin-bottom: 24px; text-align: left;">
              <h1 style="color: #0b1419; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Thank You for Reaching Out!</h1>
              <p style="color: #4a555e; font-size: 16px; line-height: 1.6; margin: 0;">Hi ${name},</p>
            </div>
            
            <p style="color: #4a555e; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              We have received your query. Our SEO & digital growth team is reviewing your details and will get back to you within <strong>24 business hours</strong>.
            </p>

            <div style="background-color: #f6f8f7; border-left: 4px solid #1463FF; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #1463FF; margin: 0 0 8px 0;">Summary of Your Submission</p>
              <p style="font-size: 14px; color: #0b1419; margin: 0 0 6px 0;"><strong>Name:</strong> ${name}</p>
              ${company ? `<p style="font-size: 14px; color: #0b1419; margin: 0 0 6px 0;"><strong>Company:</strong> ${company}</p>` : ''}
              ${website ? `<p style="font-size: 14px; color: #0b1419; margin: 0 0 6px 0;"><strong>Website:</strong> ${website}</p>` : ''}
              <p style="font-size: 14px; color: #0b1419; margin: 8px 0 0 0;"><strong>Message:</strong></p>
              <p style="font-size: 14px; color: #4a555e; font-style: italic; margin: 4px 0 0 0;">"${message}"</p>
            </div>

            <p style="color: #4a555e; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              If you have urgent details to add, feel free to reply directly to this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e7e6; margin: 24px 0;" />
            <p style="color: #8a959e; font-size: 13px; margin: 0;">
              Best regards,<br />
              <strong style="color: #0b1419;">GetUsRanked Team</strong><br />
              <a href="https://getusranked.com" style="color: #1463FF; text-decoration: none;">getusranked.com</a>
            </p>
          </div>
        `,
      });
      emailStatus.autoResponderSent = true;
    } catch (err) {
      console.error('Failed to send auto-responder email:', err);
    }

    // 6b. Admin Alert Email to Team
    try {
      await resend.emails.send({
        from: 'GetUsRanked Leads <notifications@getusranked.com>',
        to: [adminEmail],
        subject: `🔥 New Contact Inquiry: ${name} (${company || 'Individual'})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #ddd; border-radius: 12px;">
            <h2 style="color: #1463FF; margin-top: 0;">New Website Inquiry Received</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 120px;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${name}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${company || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Website:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${website ? `<a href="${website}">${website}</a>` : 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Client IP:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${clientIp}</td></tr>
            </table>
            <div style="margin-top: 16px;">
              <strong>Message:</strong>
              <p style="background: #f4f5f6; padding: 12px; border-radius: 6px; font-size: 14px; color: #333;">${message}</p>
            </div>
          </div>
        `,
      });
      emailStatus.adminAlertSent = true;
    } catch (err) {
      console.error('Failed to send admin notification email:', err);
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
