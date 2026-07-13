#!/usr/bin/env python3
"""Adapter Kimi / Moonshot (API compatibile OpenAI) per l'Argo Content System.

Ruolo nel sistema: Kimi fa il lavoro a volume (bozze di script, batch di hook,
riscrittura caption); Claude orchestra e il validatore `register` fa da rete di
sicurezza sui guardrail del brand. Nessuna chiave nel codice: tutto da .env.

Solo stdlib (urllib): nessuna dipendenza da installare.
Uso:
  KIMI_API_KEY=... python3 automation/kimi_adapter.py draft <id-video>
  python3 automation/kimi_adapter.py draft <id-video> --dry-run   # nessuna chiamata
  python3 automation/kimi_adapter.py hooks "guinzaglio che tira" -n 8
"""
import argparse, json, os, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config" / "config.json").read_text(encoding="utf-8"))
BRAND = (ROOT / "brand" / "brand.md").read_text(encoding="utf-8")

BASE_URL = os.environ.get("KIMI_BASE_URL", "https://api.moonshot.ai/v1")
MODEL = os.environ.get("KIMI_MODEL", "kimi-k2-0905-preview")
API_KEY = os.environ.get("KIMI_API_KEY", "")

SYSTEM = (
    "Sei un autore di contenuti TikTok per il brand italiano 'Il Metodo Argo' "
    "(educazione cinofila in rinforzo positivo). Scrivi in italiano, con la voce "
    "del personaggio Argo. Rispetta SEMPRE questi guardrail del brand:\n\n" + BRAND +
    "\n\nRispondi ESCLUSIVAMENTE con JSON valido, senza testo attorno."
)

def _call(messages, temperature=0.8, max_tokens=1600):
    """Chiamata chat-completions compatibile OpenAI. Ritorna il testo del modello."""
    if not API_KEY:
        raise RuntimeError("KIMI_API_KEY non impostata nell'ambiente (.env). "
                           "Usa --dry-run per provare senza chiamare l'API.")
    body = json.dumps({
        "model": MODEL, "messages": messages,
        "temperature": temperature, "max_tokens": max_tokens,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions", data=body, method="POST",
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            data = json.loads(r.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")[:300]
        raise RuntimeError(f"Kimi HTTP {e.code}: {detail}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Rete/endpoint non raggiungibile: {e.reason}")

def _extract_json(text):
    """Isola il primo blocco JSON dalla risposta (robusto a eventuale testo attorno)."""
    s, e = text.find("{"), text.rfind("}")
    if s == -1 or e == -1:
        s, e = text.find("["), text.rfind("]")
    return json.loads(text[s:e + 1])

# --------------------------------------------------------------- draft pacchetto
DRAFT_INSTRUCT = """Genera la BOZZA di un pacchetto video TikTok da 15-45 secondi.
Categoria: {categoria}. Pilastro: {pilastro}. Format: {format}.
L'hook deve colpire nei primi 1-2 secondi (vietate aperture lente).
Restituisci JSON con ESATTAMENTE queste chiavi:
obiettivo, target_specifico, idea, hook, script, voiceover,
testi_a_schermo (array max 6 voci), caption (max 3 righe), cta, hashtags (array 3-5),
durata_prevista_s (intero 15-45).
NON usare parole come cura/guarisce/garantito. NON promettere risultati assoluti."""

def cmd_draft(args):
    pdir = ROOT / CFG["percorsi"]["contenuti"] / args.id
    pkg = json.loads((pdir / "package.json").read_text(encoding="utf-8"))
    instruct = DRAFT_INSTRUCT.format(categoria=pkg["categoria"],
                                     pilastro=pkg["pilastro"], format=pkg["format"])
    if args.dry_run:
        print("── DRY-RUN: nessuna chiamata API. Ecco il prompt che invierei a Kimi ──\n")
        print("[system]\n" + SYSTEM[:400] + " …\n\n[user]\n" + instruct)
        print(f"\n(endpoint: {BASE_URL} · modello: {MODEL} · chiave: "
              f"{'PRESENTE' if API_KEY else 'ASSENTE'})")
        return
    text = _call([{"role": "system", "content": SYSTEM},
                  {"role": "user", "content": instruct}])
    draft = _extract_json(text)
    # fondi la bozza nel package senza toccare i campi tecnici già presenti
    for k in ("obiettivo", "target_specifico", "idea", "hook", "script", "voiceover",
              "testi_a_schermo", "caption", "cta", "hashtags", "durata_prevista_s"):
        if k in draft:
            pkg[k] = draft[k]
    (pdir / "package.draft-kimi.json").write_text(
        json.dumps(pkg, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✔ bozza Kimi salvata: content/{args.id}/package.draft-kimi.json")
    print("  Rivedi, poi copia su package.json e lancia: argo.py register", args.id)
    print("  (il validatore blocca comunque hook/parole vietate e duplicati)")

# --------------------------------------------------------------- batch hook
def cmd_hooks(args):
    instruct = (f"Genera {args.n} hook TikTok diversi (1-2 secondi ciascuno) sul tema "
                f"'{args.tema}'. Ogni hook deve creare tensione, curiosità o mostrare un "
                f"beneficio immediato. Vietate aperture lente. "
                f"Restituisci JSON: {{\"hooks\": [\"...\", \"...\"]}}")
    if args.dry_run:
        print("── DRY-RUN ──\n[user]\n" + instruct); return
    text = _call([{"role": "system", "content": SYSTEM},
                  {"role": "user", "content": instruct}], temperature=1.0)
    for i, h in enumerate(_extract_json(text).get("hooks", []), 1):
        print(f"  {i}. {h}")

def main():
    ap = argparse.ArgumentParser(prog="kimi", description="Adapter Kimi per Argo Content System")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("draft", help="riempi la bozza di un pacchetto video")
    p.add_argument("id"); p.add_argument("--dry-run", action="store_true")
    p = sub.add_parser("hooks", help="genera un batch di hook su un tema")
    p.add_argument("tema"); p.add_argument("-n", type=int, default=6)
    p.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    try:
        {"draft": cmd_draft, "hooks": cmd_hooks}[a.cmd](a)
    except RuntimeError as e:
        print("ERRORE:", e, file=sys.stderr); sys.exit(1)

if __name__ == "__main__":
    main()
