// Webhook Stripe → Supabase.
// Al completamento del pagamento:
//   1. crea (o ritrova) l'utente Supabase — la creazione invia
//      automaticamente l'email di invito con il link per impostare
//      la password (template "Invite user" di Supabase)
//   2. crea/aggiorna la riga in `profiles` con il modulo del quiz
//   3. registra l'acquisto in `purchases`
// Idempotente: lo stesso evento Stripe può arrivare più volte.
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const PROFILI = ['trattore', 'squalo', 'esploratore', 'velcro', 'tornado'];

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Metodo non consentito' };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      event.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('stripe-webhook: firma non valida —', err.message);
    return { statusCode: 400, body: 'Firma non valida' };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Evento ignorato' };
  }

  const session = stripeEvent.data.object;
  if (session.payment_status !== 'paid') {
    return { statusCode: 200, body: 'Pagamento non ancora completato' };
  }

  const email = String(
    session.customer_details?.email || session.customer_email || ''
  ).trim().toLowerCase();
  if (!email) {
    console.error('stripe-webhook: sessione senza email', session.id);
    return { statusCode: 200, body: 'Sessione senza email' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Idempotenza: acquisto già registrato → non fare nulla
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle();
    if (existing) {
      return { statusCode: 200, body: 'Acquisto già registrato' };
    }

    // 1. Utente: riusa il profilo se l'email ha già acquistato,
    //    altrimenti crea l'account e invia l'email di invito
    let userId;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profile) {
      userId = profile.id;
    } else {
      const redirectTo = `${process.env.SITE_URL}/accedi.html`;
      const { data: invited, error: inviteErr } =
        await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });

      if (inviteErr) {
        // L'utente auth esiste già ma non ha profilo (caso raro):
        // recupero il suo id senza inviare altre email
        const { data: linkData, error: linkErr } =
          await supabase.auth.admin.generateLink({ type: 'magiclink', email });
        if (linkErr || !linkData?.user) throw inviteErr;
        userId = linkData.user.id;
      } else {
        userId = invited.user.id;
      }
    }

    // 2. Modulo del quiz: prima i metadata del checkout,
    //    altrimenti l'ultima risposta salvata per questa email
    let quizProfile = PROFILI.includes(session.metadata?.quiz_profile)
      ? session.metadata.quiz_profile
      : null;
    let puppyFlag = session.metadata?.puppy_flag === 'true';

    if (!quizProfile) {
      const { data: quiz } = await supabase
        .from('quiz_responses')
        .select('profile, puppy_flag')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (quiz) {
        quizProfile = quiz.profile;
        puppyFlag = puppyFlag || quiz.puppy_flag;
      }
    }

    const profileRow = { id: userId, email, puppy_flag: puppyFlag, updated_at: new Date().toISOString() };
    if (quizProfile) profileRow.quiz_profile = quizProfile;
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert(profileRow, { onConflict: 'id' });
    if (profileErr) throw profileErr;

    // 3. Acquisto
    const { error: purchaseErr } = await supabase.from('purchases').insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_customer_id: session.customer || null,
      amount_total: session.amount_total,
      currency: session.currency || 'eur',
      order_bump: session.metadata?.order_bump === 'true'
    });
    // 23505 = violazione di unicità → evento duplicato, va bene così
    if (purchaseErr && purchaseErr.code !== '23505') throw purchaseErr;

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('stripe-webhook:', err.message);
    // 500 → Stripe ritenterà la consegna dell'evento
    return { statusCode: 500, body: 'Errore interno' };
  }
};
