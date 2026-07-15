// Crea una sessione Stripe Checkout per il Metodo Argo (€47),
// con eventuale order bump "Checklist arrivo cucciolo" (€9).
// Il profilo del quiz viaggia nei metadata e viene letto dal webhook.
//
// Codice sconto "lancio": se il browser invia un codice nel formato
// ARGO-#### (generato lato client, valido per la visita), il server
// applica un coupon del 10% creato al volo su Stripe. La percentuale è
// FISSA lato server: non ci si fida del valore inviato dal client.
import Stripe from 'stripe';

const PROFILI = ['trattore', 'squalo', 'esploratore', 'velcro', 'tornado'];

// Formato accettato per il codice sconto lancio e sconto applicato.
const DISCOUNT_RE = /^ARGO-\d{4}$/;
const DISCOUNT_PERCENT = 10;

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
  const discountCode = String(payload.discount || '').trim().toUpperCase();
  const hasDiscount = DISCOUNT_RE.test(discountCode);
  const siteUrl = process.env.SITE_URL || `https://${event.headers.host}`;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const lineItems = [{ price: process.env.STRIPE_PRICE_METODO, quantity: 1 }];
  if (orderBump) {
    lineItems.push({ price: process.env.STRIPE_PRICE_BUMP, quantity: 1 });
  }

  try {
    // Sconto lancio: coupon monouso creato al volo (percentuale fissa
    // decisa dal server). Se la creazione fallisce, si prosegue senza
    // sconto anziché bloccare l'acquisto.
    let discounts;
    if (hasDiscount) {
      try {
        const coupon = await stripe.coupons.create({
          percent_off: DISCOUNT_PERCENT,
          duration: 'once',
          max_redemptions: 1,
          name: `Sconto lancio ${discountCode}`,
          metadata: { source: 'landing_launch', code: discountCode }
        });
        discounts = [{ coupon: coupon.id }];
      } catch (couponErr) {
        console.error('create-checkout coupon:', couponErr.message);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: lineItems,
      ...(discounts ? { discounts } : {}),
      success_url: `${siteUrl}/grazie.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/#prezzo`,
      locale: 'it',
      metadata: {
        order_bump: orderBump ? 'true' : 'false',
        quiz_profile: profile,
        puppy_flag: puppyFlag ? 'true' : 'false',
        discount_code: discounts ? discountCode : ''
      }
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('create-checkout:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Impossibile creare il pagamento' }) };
  }
};
