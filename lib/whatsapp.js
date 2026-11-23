function formatWhatsAppNumber(rawPhone) {
  const cleaned = String(rawPhone || '').replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return `whatsapp:${cleaned}`;
  if (cleaned.length === 10) return `whatsapp:+91${cleaned}`;
  return `whatsapp:+${cleaned}`;
}

export async function sendWhatsAppMessage({ to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = (process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886').replace(
    /\s+/g,
    ''
  );
  const contentSid = process.env.TWILIO_CONTENT_SID?.trim();

  if (!accountSid || !authToken) {
    return {
      channel: 'WhatsApp (Mock)',
      deliveryStatus: 'DELIVERED',
      providerMessageId: null,
      errorMessage: '',
    };
  }

  const formattedTo = formatWhatsAppNumber(to);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams({
    From: from,
    To: formattedTo,
  });

  if (contentSid) {
    params.append('ContentSid', contentSid);
  } else {
    params.append('Body', body);
  }

  console.log('Sending Twilio WhatsApp:', {
    from,
    to: formattedTo,
    mode: contentSid ? `ContentSid (${contentSid})` : 'Freeform Body',
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Twilio WhatsApp error:', data);
      return {
        channel: 'WhatsApp (Twilio Live)',
        deliveryStatus: 'FAILED',
        providerMessageId: null,
        errorMessage: data.message || `Twilio HTTP ${res.status}`,
      };
    }

    console.log('Twilio WhatsApp sent! SID:', data.sid);

    return {
      channel: 'WhatsApp (Twilio Live)',
      deliveryStatus: 'DELIVERED',
      providerMessageId: data.sid,
      errorMessage: '',
    };
  } catch (err) {
    console.error('Twilio network error:', err);
    return {
      channel: 'WhatsApp (Twilio Live)',
      deliveryStatus: 'FAILED',
      providerMessageId: null,
      errorMessage: err.message || 'Network error calling Twilio',
    };
  }
}