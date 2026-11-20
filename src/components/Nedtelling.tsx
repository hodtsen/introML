import { useEffect, useState } from "react";

export function formaterVarighet(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const t = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sek = s % 60;
  const to = (n: number) => String(n).padStart(2, "0");
  return t > 0 ? `${t}:${to(m)}:${to(sek)}` : `${to(m)}:${to(sek)}`;
}

export function useNaa(intervall = 1000) {
  const [naa, setNaa] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNaa(Date.now()), intervall);
    return () => window.clearInterval(id);
  }, [intervall]);
  return naa;
}

export default function Nedtelling({ frist }: { frist: number }) {
  const naa = useNaa();
  return <time>{formaterVarighet(frist - naa)}</time>;
}
