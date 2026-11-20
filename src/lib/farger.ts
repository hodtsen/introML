// Viridis-skalaen fra matplotlib brukes til mestring: mørk lilla = svak, gul = sterk.
const VIRIDIS = ["#440154", "#482878", "#3e4989", "#31688e", "#26828e", "#1f9e89", "#35b779", "#6ece58", "#b5de2b", "#fde725"];

function hexTilRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function viridis(t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (VIRIDIS.length - 1);
  const i = Math.min(Math.floor(x), VIRIDIS.length - 2);
  const f = x - i;
  const a = hexTilRgb(VIRIDIS[i]);
  const b = hexTilRgb(VIRIDIS[i + 1]);
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// Tekstfarge som gir god kontrast mot en viridis-farge.
export function tekstPaViridis(t: number): string {
  return t > 0.55 ? "#1b2a41" : "#ffffff";
}
