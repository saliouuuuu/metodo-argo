import { useEffect, useState, useCallback } from "react";
import { outreach, isElectron } from "./bridge.js";

/** Stato live del motore Outreach (solo Electron; nel browser resta null). */
export function useOutreach() {
  const [status, setStatus] = useState(null);
  const refresh = useCallback(async () => {
    try { setStatus(await outreach.status()); } catch { setStatus(null); }
  }, []);
  useEffect(() => {
    refresh();
    const off = outreach.onStatus((st) => { if (st) setStatus(st); });
    const t = setInterval(refresh, 15000);
    return () => { off && off(); clearInterval(t); };
  }, [refresh]);
  return { status, refresh, api: outreach, isElectron };
}
