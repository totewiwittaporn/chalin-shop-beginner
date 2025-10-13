// client/src/hooks/useFetch.js
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function useFetch(url, { params, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    let on = true;
    if (!enabled) return;
    setLoading(true); setError(null);
    api.get(url, { params }).then(res => {
      if (on) setData(res.data);
    }).catch(e => {
      if (on) setError(e);
    }).finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [url, JSON.stringify(params), enabled]);

  return { data, loading, error };
}
