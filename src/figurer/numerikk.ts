// Små numeriske hjelpere for figurene.

// Løser A x = b med Gauss-eliminasjon og delvis pivotering.
export function los(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    [M[k], M[p]] = [M[p], M[k]];
    const piv = M[k][k] || 1e-12;
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / piv;
      for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / (M[i][i] || 1e-12);
  }
  return x;
}

// Minste kvadraters polynomtilpasning av grad d (med svak ridge for numerisk stabilitet).
export function polyfit(xs: number[], ys: number[], d: number): number[] {
  const n = d + 1;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  xs.forEach((x, k) => {
    const p = Array.from({ length: n }, (_, i) => x ** i);
    for (let i = 0; i < n; i++) {
      b[i] += p[i] * ys[k];
      for (let j = 0; j < n; j++) A[i][j] += p[i] * p[j];
    }
  });
  for (let i = 1; i < n; i++) A[i][i] += 1e-9;
  return los(A, b);
}

export const polyval = (c: number[], x: number) => c.reduce((s, ci, i) => s + ci * x ** i, 0);

// Deterministisk normalfordelt støy (Box–Muller på en seedet generator).
export function stoy(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) + 1) / 4294967297;
  };
  return () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
}
