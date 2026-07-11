// Client Supabase condiviso per le pagine che richiedono login.
// La configurazione pubblica (URL + chiave anon) arriva da /api/config,
// così nel repository non c'è nessuna chiave scritta nel codice.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

let clientPromise = null;

export function getSupabase() {
  if (!clientPromise) {
    clientPromise = fetch('/api/config')
      .then((res) => {
        if (!res.ok) throw new Error('Configurazione non disponibile');
        return res.json();
      })
      .then(({ supabaseUrl, supabaseAnonKey }) =>
        createClient(supabaseUrl, supabaseAnonKey)
      );
  }
  return clientPromise;
}
