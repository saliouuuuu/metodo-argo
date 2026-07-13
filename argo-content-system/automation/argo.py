#!/usr/bin/env python3
"""Argo Content System — CLI (Milestone 1)
Gestisce pianificazione editoriale, storico, validazione, QC video,
coda di pubblicazione e analytics per i contenuti TikTok del Metodo Argo.
Solo stdlib + ffmpeg/ffprobe di sistema. Nessuna chiave nel codice.
"""
import argparse, csv, hashlib, json, os, random, re, sqlite3, subprocess, sys
from datetime import datetime, date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config" / "config.json").read_text(encoding="utf-8"))
CATS = json.loads((ROOT / "editorial" / "categories.json").read_text(encoding="utf-8"))
DB_PATH = ROOT / CFG["percorsi"]["database"]

STATI = ["ideation", "ready_for_production", "produced", "qc_passed",
         "approved", "scheduled", "published", "failed", "skipped"]

# ---------------------------------------------------------------- util
def log(msg):
    line = f"[{datetime.now().isoformat(timespec='seconds')}] {msg}"
    print(line)
    logdir = ROOT / CFG["percorsi"]["log"]
    logdir.mkdir(exist_ok=True)
    with open(logdir / f"{date.today().isoformat()}.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")

def db():
    DB_PATH.parent.mkdir(exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def norm(s):
    return re.sub(r"[^a-z0-9à-ù ]", "", (s or "").lower()).strip()

# ---------------------------------------------------------------- init
SCHEMA = """
CREATE TABLE IF NOT EXISTS videos(
  id TEXT PRIMARY KEY, data TEXT, slot INTEGER, orario TEXT,
  categoria TEXT, pilastro TEXT, format TEXT,
  titolo TEXT, hook TEXT, caption TEXT, hashtags TEXT, cta TEXT,
  durata_prevista_s INTEGER, status TEXT DEFAULT 'ideation',
  video_path TEXT, tiktok_url TEXT,
  created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS metrics(
  video_id TEXT PRIMARY KEY REFERENCES videos(id),
  views INTEGER, likes INTEGER, comments INTEGER, shares INTEGER,
  saves INTEGER, watch_avg_s REAL, completion_pct REAL,
  followers INTEGER, profile_visits INTEGER, link_clicks INTEGER,
  sales INTEGER, imported_at TEXT
);
CREATE TABLE IF NOT EXISTS category_scores(
  categoria TEXT PRIMARY KEY, video_count INTEGER DEFAULT 0,
  avg_views REAL DEFAULT 0, score REAL DEFAULT 1.0, updated_at TEXT
);
"""

def cmd_init(_):
    for key in ("contenuti", "kit", "pubblicati", "analytics", "log"):
        (ROOT / CFG["percorsi"][key]).mkdir(exist_ok=True)
    con = db(); con.executescript(SCHEMA); con.commit()
    log("Inizializzato: cartelle e database pronti.")

# ---------------------------------------------------------------- plan-day
def pick_categories(con, giorno):
    """Sceglie 2 categorie: mix pilastri + rotazione + punteggio performance."""
    recenti = {r["categoria"] for r in con.execute(
        "SELECT DISTINCT categoria FROM videos WHERE data >= ?",
        ((datetime.fromisoformat(giorno) - timedelta(
            days=CFG["editoriale"]["giorni_senza_ripetere_categoria"])).date().isoformat(),))}
    ultima_vendita = con.execute(
        "SELECT MAX(data) m FROM videos WHERE pilastro='conversione'").fetchone()["m"]
    scores = {r["categoria"]: r["score"] for r in con.execute("SELECT * FROM category_scores")}

    rnd = random.Random(giorno)  # deterministico per data
    # pilastri del giorno: pesca 2 secondo il mix (il 2° mai = 1° pilastro non-valore)
    mix = CFG["editoriale"]["mix_pilastri"]
    pilastri = rnd.choices(list(mix), weights=list(mix.values()), k=2)
    if pilastri[0] == pilastri[1] != "valore":
        pilastri[1] = "valore"
    # vendita al massimo ogni 5 giorni
    for i, p in enumerate(pilastri):
        if p == "conversione" and ultima_vendita and \
           (datetime.fromisoformat(giorno).date() - datetime.fromisoformat(ultima_vendita).date()).days < 5:
            pilastri[i] = "valore"

    scelte = []
    for p in pilastri:
        pool = [c for c in CATS["categorie"] if c["pilastro"] == p
                and c["id"] not in recenti and c["id"] not in [s["id"] for s in scelte]]
        if not pool:  # fallback: allenta il vincolo di rotazione
            pool = [c for c in CATS["categorie"] if c["pilastro"] == p
                    and c["id"] not in [s["id"] for s in scelte]]
        pesi = [c["peso"] * scores.get(c["id"], 1.0) for c in pool]
        scelte.append(rnd.choices(pool, weights=pesi, k=1)[0])
    return scelte

PACKAGE_SKELETON = {
    "id": "", "data": "", "slot": 0, "orario": "", "categoria": "", "pilastro": "",
    "format": "", "obiettivo": "", "target_specifico": "", "idea": "",
    "hook": "", "script": "", "voiceover": "",
    "scene": [{"n": 1, "inquadratura": "", "durata_s": 0, "fonte": "ai|asset|ripresa",
               "prompt_ai": "", "asset": ""}],
    "testi_a_schermo": [], "sottotitoli": "", "caption": "", "cta": "",
    "hashtags": [], "durata_prevista_s": 0,
    "status": "ideation", "video_path": "", "tiktok_url": ""
}

def cmd_plan_day(args):
    giorno = args.date or date.today().isoformat()
    con = db()
    if con.execute("SELECT COUNT(*) c FROM videos WHERE data=?", (giorno,)).fetchone()["c"] > 0:
        log(f"Slot per {giorno} già pianificati. Usa 'show --date {giorno}'."); return
    scelte = pick_categories(con, giorno)
    rnd = random.Random(giorno + "f")
    formats_recenti = {r["format"] for r in con.execute(
        "SELECT DISTINCT format FROM videos WHERE data >= ?",
        ((datetime.fromisoformat(giorno) - timedelta(
            days=CFG["editoriale"]["giorni_senza_ripetere_format"])).date().isoformat(),))}
    for slot, cat in enumerate(scelte, start=1):
        vid = f"{giorno}-{slot:02d}-{cat['id']}"
        orario = CFG["pubblicazione"]["slot"][slot - 1]
        fpool = [f for f in CATS["format"] if f not in formats_recenti] or CATS["format"]
        fmt = rnd.choice(fpool); formats_recenti.add(fmt)
        con.execute("INSERT INTO videos(id,data,slot,orario,categoria,pilastro,format,status,created_at,updated_at)"
                    " VALUES(?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))",
                    (vid, giorno, slot, orario, cat["id"], cat["pilastro"], fmt, "ideation"))
        pdir = ROOT / CFG["percorsi"]["contenuti"] / vid
        (pdir / "assets").mkdir(parents=True, exist_ok=True)
        pkg = dict(PACKAGE_SKELETON)
        pkg.update(id=vid, data=giorno, slot=slot, orario=orario,
                   categoria=cat["id"], pilastro=cat["pilastro"], format=fmt)
        (pdir / "package.json").write_text(json.dumps(pkg, ensure_ascii=False, indent=2), encoding="utf-8")
        log(f"Slot {slot} · {orario} → {cat['id']} ({cat['pilastro']}, format {fmt}) → content/{vid}/")
    con.commit()
    log("Pianificazione fatta. Ora compila i package.json (vedi prompts/genera-pacchetto.md) e poi 'register <id>'.")

# ---------------------------------------------------------------- register (validazione editoriale)
def valida_pacchetto(pkg, con):
    err, warn = [], []
    obbligatori = ["idea", "obiettivo", "hook", "script", "voiceover", "caption", "cta", "hashtags", "durata_prevista_s"]
    for k in obbligatori:
        if not pkg.get(k): err.append(f"campo mancante: {k}")
    lo, hi = CFG["editoriale"]["durata_video_secondi"]
    if pkg.get("durata_prevista_s") and not lo <= pkg["durata_prevista_s"] <= hi:
        err.append(f"durata {pkg['durata_prevista_s']}s fuori range {lo}-{hi}s")
    hook = norm(pkg.get("hook"))
    for vietato in CFG["controlli"]["hook_vietati"]:
        if hook.startswith(norm(vietato)): err.append(f"hook vietato: inizia con «{vietato}»")
    testo_tutto = " ".join([str(pkg.get(k, "")) for k in ("hook", "script", "voiceover", "caption")]).lower()
    for parola in CFG["controlli"]["parole_vietate"]:
        if parola in testo_tutto: err.append(f"parola vietata nel testo: «{parola}»")
    for tema in CFG["controlli"]["temi_da_reindirizzare"]:
        if tema in testo_tutto and "veterinari" not in testo_tutto and "educatore" not in testo_tutto:
            warn.append(f"tema sensibile «{tema}» senza rimando a professionista")
    if pkg.get("caption") and pkg["caption"].count("\n") > 2:
        err.append("caption oltre 3 righe")
    if pkg.get("hashtags") and not 3 <= len(pkg["hashtags"]) <= 5:
        warn.append(f"hashtag: {len(pkg['hashtags'])} (consigliati 3-5)")
    # anti-duplicazione: hook simile a storico
    h = norm(pkg.get("hook"))
    if h:
        for r in con.execute("SELECT id, hook FROM videos WHERE hook IS NOT NULL AND id != ?", (pkg["id"],)):
            if r["hook"] and (norm(r["hook"]) == h or
               len(set(h.split()) & set(norm(r["hook"]).split())) >= max(4, int(len(h.split()) * .7))):
                err.append(f"hook troppo simile a {r['id']}")
    return err, warn

def cmd_register(args):
    pdir = ROOT / CFG["percorsi"]["contenuti"] / args.id
    pkg = json.loads((pdir / "package.json").read_text(encoding="utf-8"))
    con = db()
    err, warn = valida_pacchetto(pkg, con)
    for w in warn: log(f"  ⚠ {w}")
    if err:
        for e in err: log(f"  ✕ {e}")
        log(f"REGISTRAZIONE RIFIUTATA per {args.id}: correggi il package.json."); sys.exit(1)
    con.execute("""UPDATE videos SET titolo=?, hook=?, caption=?, hashtags=?, cta=?,
                 durata_prevista_s=?, status='ready_for_production', updated_at=datetime('now') WHERE id=?""",
                (pkg.get("idea"), pkg.get("hook"), pkg.get("caption"),
                 " ".join(pkg.get("hashtags", [])), pkg.get("cta"),
                 pkg.get("durata_prevista_s"), args.id))
    con.commit()
    log(f"✔ {args.id} registrato → ready_for_production")

# ---------------------------------------------------------------- QC video
def ffprobe_json(path):
    out = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json",
                          "-show_format", "-show_streams", str(path)],
                         capture_output=True, text=True)
    return json.loads(out.stdout)

def cmd_check_video(args):
    path = Path(args.file)
    if not path.exists(): log(f"file non trovato: {path}"); sys.exit(1)
    rep = {"id": args.id, "file": str(path), "checks": {}, "esito": "PASS"}
    info = ffprobe_json(path)
    vstream = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    astream = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    c = rep["checks"]
    w, h = (int(vstream["width"]), int(vstream["height"])) if vstream else (0, 0)
    c["risoluzione"] = {"valore": f"{w}x{h}", "ok": (w, h) >= tuple(CFG["video"]["risoluzione"]) or (w >= 720 and abs(h / max(w, 1) - 16 / 9) < .02)}
    c["formato_9_16"] = {"valore": round(h / max(w, 1), 3), "ok": abs(h / max(w, 1) - 16 / 9) < .02}
    dur = float(info["format"]["duration"]); lo, hi = CFG["editoriale"]["durata_video_secondi"]
    c["durata"] = {"valore": round(dur, 1), "ok": lo <= dur <= hi}
    size_mb = os.path.getsize(path) / 1e6
    c["dimensione_mb"] = {"valore": round(size_mb, 1), "ok": size_mb <= CFG["video"]["dimensione_max_mb"]}
    c["audio_presente"] = {"valore": bool(astream), "ok": bool(astream)}
    # loudness + frame neri (ffmpeg)
    an = subprocess.run(["ffmpeg", "-i", str(path), "-af", "ebur128", "-vf",
                         "blackdetect=d=0.5:pix_th=0.10", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    tutti = re.findall(r"I:\s*(-?\d+\.?\d*)\s*LUFS", an)
    lufs = float(tutti[-1]) if tutti else None
    c["loudness_lufs"] = {"valore": lufs, "ok": lufs is not None and -20 <= lufs <= -9}
    blacks = re.findall(r"black_start:(\d+\.?\d*)", an)
    c["frame_neri"] = {"valore": len(blacks), "ok": len(blacks) == 0}
    # pacchetto: caption/hashtag presenti
    pdir = ROOT / CFG["percorsi"]["contenuti"] / args.id
    pkg = json.loads((pdir / "package.json").read_text(encoding="utf-8"))
    c["caption_presente"] = {"valore": bool(pkg.get("caption")), "ok": bool(pkg.get("caption"))}
    c["hashtag_presenti"] = {"valore": len(pkg.get("hashtags", [])), "ok": len(pkg.get("hashtags", [])) >= 3}
    if any(not v["ok"] for v in c.values()): rep["esito"] = "FAIL"
    (pdir / "qc-report.json").write_text(json.dumps(rep, ensure_ascii=False, indent=2), encoding="utf-8")
    con = db()
    nuovo = "qc_passed" if rep["esito"] == "PASS" else "failed"
    con.execute("UPDATE videos SET status=?, video_path=?, updated_at=datetime('now') WHERE id=?",
                (nuovo, str(path), args.id)); con.commit()
    for k, v in c.items(): log(f"  {'✔' if v['ok'] else '✕'} {k}: {v['valore']}")
    log(f"QC {rep['esito']} → {args.id} = {nuovo} (report: content/{args.id}/qc-report.json)")
    if rep["esito"] == "FAIL": sys.exit(1)

# ---------------------------------------------------------------- stati & coda
def set_status(vid, stato):
    con = db(); con.execute("UPDATE videos SET status=?, updated_at=datetime('now') WHERE id=?", (stato, vid)); con.commit()
    log(f"{vid} → {stato}")

def cmd_publish_kit(args):
    con = db()
    r = con.execute("SELECT * FROM videos WHERE id=?", (args.id,)).fetchone()
    if not r or r["status"] not in ("approved", "qc_passed"):
        log(f"per il kit servono status approved/qc_passed (attuale: {r['status'] if r else 'inesistente'})"); sys.exit(1)
    pdir = ROOT / CFG["percorsi"]["contenuti"] / args.id
    pkg = json.loads((pdir / "package.json").read_text(encoding="utf-8"))
    kdir = ROOT / CFG["percorsi"]["kit"] / args.id
    kdir.mkdir(parents=True, exist_ok=True)
    if r["video_path"] and Path(r["video_path"]).exists():
        subprocess.run(["cp", r["video_path"], str(kdir / "final.mp4")])
    (kdir / "caption.txt").write_text(pkg["caption"] + "\n\n" + " ".join(pkg["hashtags"]), encoding="utf-8")
    (kdir / "checklist.md").write_text(
        f"# Publishing kit — {args.id}\n\n"
        f"- [ ] Apri TikTok web → Carica → seleziona `final.mp4`\n"
        f"- [ ] Incolla il contenuto di `caption.txt`\n"
        f"- [ ] Copertina: scegli il frame con l'hook a schermo\n"
        f"- [ ] Programma per le **{r['orario']}** di oggi ({r['data']})\n"
        f"- [ ] Privacy: pubblico · commenti attivi\n"
        f"- [ ] Dopo la pubblicazione: `python3 automation/argo.py mark-published {args.id} --url <link>`\n",
        encoding="utf-8")
    set_status(args.id, "scheduled")
    log(f"Kit pronto in scheduled/{args.id}/ — carica su TikTok e programma alle {r['orario']}.")

def cmd_mark_published(args):
    con = db()
    con.execute("UPDATE videos SET status='published', tiktok_url=?, updated_at=datetime('now') WHERE id=?",
                (args.url, args.id)); con.commit()
    log(f"{args.id} → published ({args.url})")

# ---------------------------------------------------------------- viste
def cmd_show(args):
    con = db()
    q, p = "SELECT * FROM videos", ()
    if args.id: q += " WHERE id=?"; p = (args.id,)
    elif args.date: q += " WHERE data=?"; p = (args.date,)
    q += " ORDER BY data DESC, slot"
    rows = con.execute(q, p).fetchall()
    if not rows: log("nessun contenuto trovato."); return
    for r in rows:
        print(f"  {r['id']:<40} {r['orario']}  {r['pilastro']:<14} {r['status']:<22} {r['hook'] or '—'}")

def cmd_history(args):
    con = db()
    q, p = "SELECT id, data, categoria, hook, status FROM videos", ()
    if args.category: q += " WHERE categoria=?"; p = (args.category,)
    q += " ORDER BY data DESC LIMIT 50"
    for r in con.execute(q, p): print(f"  {r['data']}  {r['categoria']:<20} {r['status']:<12} {r['hook'] or '—'}")

def cmd_queue(_):
    con = db()
    for r in con.execute("SELECT * FROM videos WHERE status NOT IN ('published','skipped','failed') ORDER BY data, slot"):
        print(f"  {r['id']:<40} {r['status']:<22} slot {r['slot']} · {r['orario']}")

# ---------------------------------------------------------------- analytics
def cmd_import_analytics(args):
    con = db(); n = 0
    with open(args.csv, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            con.execute("""INSERT INTO metrics(video_id,views,likes,comments,shares,saves,watch_avg_s,
                        completion_pct,followers,profile_visits,link_clicks,sales,imported_at)
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
                        ON CONFLICT(video_id) DO UPDATE SET views=excluded.views,likes=excluded.likes,
                        comments=excluded.comments,shares=excluded.shares,saves=excluded.saves,
                        watch_avg_s=excluded.watch_avg_s,completion_pct=excluded.completion_pct,
                        followers=excluded.followers,profile_visits=excluded.profile_visits,
                        link_clicks=excluded.link_clicks,sales=excluded.sales,imported_at=datetime('now')""",
                        tuple([row.get("video_id")] + [row.get(k) or 0 for k in
                        ("views", "likes", "comments", "shares", "saves", "watch_avg_s",
                         "completion_pct", "followers", "profile_visits", "link_clicks", "sales")]))
            n += 1
    con.commit(); log(f"importate metriche per {n} video.")
    _update_scores(con)

def _update_scores(con):
    rows = con.execute("""SELECT v.categoria, COUNT(*) n, AVG(m.views) av FROM videos v
                        JOIN metrics m ON m.video_id=v.id GROUP BY v.categoria""").fetchall()
    if not rows: return
    media = sum(r["av"] for r in rows) / len(rows) or 1
    for r in rows:
        score = max(0.5, min(2.0, r["av"] / media))  # moltiplicatore 0.5–2.0
        con.execute("""INSERT INTO category_scores(categoria,video_count,avg_views,score,updated_at)
                    VALUES(?,?,?,?,datetime('now')) ON CONFLICT(categoria) DO UPDATE SET
                    video_count=excluded.video_count,avg_views=excluded.avg_views,
                    score=excluded.score,updated_at=excluded.updated_at""",
                    (r["categoria"], r["n"], r["av"], score))
    con.commit(); log("punteggi categoria aggiornati (guidano plan-day).")

def cmd_weekly_report(_):
    con = db()
    rows = con.execute("""SELECT v.*, m.views, m.likes, m.saves, m.shares, m.completion_pct
                        FROM videos v LEFT JOIN metrics m ON m.video_id=v.id
                        WHERE v.status='published' AND v.data >= date('now','-7 day')
                        ORDER BY m.views DESC""").fetchall()
    out = [f"# Report settimanale — {date.today().isoformat()}", ""]
    if not rows:
        out.append("Nessun video pubblicato negli ultimi 7 giorni.")
    else:
        out.append(f"Video pubblicati: {len(rows)}\n")
        out.append("## Migliori\n")
        for r in rows[:3]:
            out.append(f"- **{r['id']}** · {r['views'] or 0} views · hook: «{r['hook']}»")
        out.append("\n## Peggiori\n")
        for r in rows[-3:]:
            out.append(f"- {r['id']} · {r['views'] or 0} views · hook: «{r['hook']}»")
        agg = con.execute("""SELECT v.categoria, AVG(m.views) av, AVG(m.completion_pct) ac
                          FROM videos v JOIN metrics m ON m.video_id=v.id
                          GROUP BY v.categoria ORDER BY av DESC""").fetchall()
        out.append("\n## Categorie per rendimento medio\n")
        for r in agg: out.append(f"- {r['categoria']}: {round(r['av'] or 0)} views · completion {round(r['ac'] or 0, 1)}%")
        out.append("\n## Suggerimenti\n- Raddoppia sulle prime 2 categorie della classifica.\n"
                   "- Riscrivi gli hook dei 3 peggiori con i pattern dei migliori.\n"
                   "- I punteggi sono già aggiornati: la prossima plan-day ne tiene conto.")
    rp = ROOT / CFG["percorsi"]["analytics"] / f"report-{date.today().isoformat()}.md"
    rp.write_text("\n".join(out), encoding="utf-8")
    log(f"report scritto: {rp.relative_to(ROOT)}")

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(prog="argo", description="Argo Content System")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init")
    p = sub.add_parser("plan-day"); p.add_argument("--date")
    p = sub.add_parser("register"); p.add_argument("id")
    p = sub.add_parser("check-video"); p.add_argument("id"); p.add_argument("--file", required=True)
    p = sub.add_parser("approve"); p.add_argument("id")
    p = sub.add_parser("skip"); p.add_argument("id")
    p = sub.add_parser("publish-kit"); p.add_argument("id")
    p = sub.add_parser("mark-published"); p.add_argument("id"); p.add_argument("--url", required=True)
    p = sub.add_parser("show"); p.add_argument("--date"); p.add_argument("--id")
    p = sub.add_parser("history"); p.add_argument("--category")
    sub.add_parser("queue")
    p = sub.add_parser("import-analytics"); p.add_argument("csv")
    sub.add_parser("weekly-report")
    a = ap.parse_args()
    {"init": cmd_init, "plan-day": cmd_plan_day, "register": cmd_register,
     "check-video": cmd_check_video, "publish-kit": cmd_publish_kit,
     "mark-published": cmd_mark_published, "show": cmd_show, "history": cmd_history,
     "queue": cmd_queue, "import-analytics": cmd_import_analytics,
     "weekly-report": cmd_weekly_report,
     "approve": lambda x: set_status(x.id, "approved"),
     "skip": lambda x: set_status(x.id, "skipped")}[a.cmd](a)

if __name__ == "__main__":
    main()
