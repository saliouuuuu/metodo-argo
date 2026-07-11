// Salva una risposta del quiz pubblico in `quiz_responses`.
// La tabella non ha policy client: si scrive solo da qui, con la
// service role key. Il webhook Stripe rileggerà la risposta più
// recente per assegnare il modulo al momento dell'acquisto.
import { createClient } from '@supabase/supabase-js';

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
  const profile = String(payload.profile || '');
  const answers = payload.answers;
  const puppyFlag = Boolean(payload.puppy_flag);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email non valida' }) };
  }
  if (!PROFILI.includes(profile)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Profilo non valido' }) };
  }
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > 20) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Risposte non valide' }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from('quiz_responses').insert({
    email,
    answers,
    profile,
    puppy_flag: puppyFlag
  });

  if (error) {
    console.error('save-quiz:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Errore nel salvataggio' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
