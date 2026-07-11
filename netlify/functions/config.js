// Espone al browser la sola configurazione PUBBLICA (URL + chiave anon
// di Supabase, protetta da Row Level Security). Le chiavi segrete
// restano nelle altre funzioni e non passano mai di qui.
export const handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Configurazione Supabase mancante sul server' })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    },
    body: JSON.stringify({ supabaseUrl, supabaseAnonKey })
  };
};
