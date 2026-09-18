import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type SendRequest = {
  phone: string;
  message: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendRequest;
    const { phone, message } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Target phone number is required.' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message content cannot be empty.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // 1. Check Twilio WhatsApp Configuration
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // default Twilio sandbox number

    if (twilioSid && twilioToken) {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('From', twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`);
      formData.append('To', `whatsapp:+${cleanPhone}`);
      formData.append('Body', message);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (res.ok) {
        const result = await res.json();
        return NextResponse.json({
          success: true,
          provider: 'twilio',
          messageId: result.sid,
        });
      } else {
        const err = await res.text();
        return NextResponse.json(
          { error: `Twilio dispatch failed: ${err}`, success: false },
          { status: 502 }
        );
      }
    }

    // 2. Check Meta WhatsApp Cloud API Configuration
    const metaToken = process.env.META_WHATSAPP_TOKEN;
    const metaPhoneId = process.env.META_PHONE_NUMBER_ID;

    if (metaToken && metaPhoneId) {
      const endpoint = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { body: message },
        }),
      });

      if (res.ok) {
        const result = await res.json();
        return NextResponse.json({
          success: true,
          provider: 'meta_cloud',
          messageId: result.messages?.[0]?.id,
        });
      } else {
        const err = await res.text();
        return NextResponse.json(
          { error: `Meta Cloud API error: ${err}`, success: false },
          { status: 502 }
        );
      }
    }

    // 3. Check Custom Webhook (e.g., Green API, UltraMsg, or self-hosted gateway)
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message }),
      });
      if (res.ok) {
        return NextResponse.json({ success: true, provider: 'custom_webhook' });
      }
    }

    // Provider not yet configured in .env.local
    return NextResponse.json({
      success: false,
      configured: false,
      hint: 'No automated WhatsApp provider key (Twilio / Meta Cloud) is set in .env.local yet. Use the 1-click Direct WhatsApp button or add TWILIO_ACCOUNT_SID.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch WhatsApp message', success: false },
      { status: 500 }
    );
  }
}
