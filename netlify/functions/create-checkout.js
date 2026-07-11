// Crea una sessione Stripe Checkout per il Metodo Argo (€47),
// con eventuale order bump "Checklist arrivo cucciolo" (€9).
// Il profilo del quiz viaggia nei metadata e viene letto dal webhook.
import Stripe from 'stripe';

const PROFILI = ['trattore', 'squalo', 'esploratore', 'velcro', 'tornado'];

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Metodo non consentito' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  const email = String(payload.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email non valida' }) };
  }

  const orderBump = Boolean(payload.orderBump);
  const profile = PROFILI.includes(payload.profile) ? payload.profile : '';
  const puppyFlag = Boolean(payload.puppy_flag);
  const siteUrl = process.env.SITE_URL || `https://${event.headers.host}`;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const lineItems = [{ price: process.env.STRIPE_PRICE_METODO, quantity: 1 }];
  if (orderBump) {
    lineItems.push({ price: process.env.STRIPE_PRICE_BUMP, quantity: 1 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: lineItems,
      success_url: `${siteUrl}/grazie.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/#prezzo`,
      locale: 'it',
      metadata: {
        order_bump: orderBump ? 'true' : 'false',
        quiz_profile: profile,
        puppy_flag: puppyFlag ? 'true' : 'false'
      }
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('create-checkout:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Impossibile creare il pagamento' }) };
  }
};
