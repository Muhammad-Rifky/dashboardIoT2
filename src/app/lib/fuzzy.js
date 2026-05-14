function triangle(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

// Fuzzifikasi pH
function fuzzifyPH(ph) {
  return {
    asam: triangle(ph, 0, 3, 6),
    netral: triangle(ph, 6, 7, 8),
    basa: triangle(ph, 8, 11, 14),
  };
}

// Fuzzifikasi Suhu
function fuzzifySuhu(suhu) {
  return {
    dingin: triangle(suhu, 0, 15, 24),
    normal: triangle(suhu, 24, 27, 30),
    panas: triangle(suhu, 30, 33, 40),
  };
}

// Fuzzifikasi TDS
function fuzzifyTDS(tds) {
  return {
    rendah: triangle(tds, 0, 150, 300),
    sedang: triangle(tds, 300, 550, 800),
    tinggi: triangle(tds, 800, 1200, 2000),
  };
}

// Fuzzifikasi Turbidity
function fuzzifyTurbidity(turb) {
  return {
    jernih: triangle(turb, 0, 2.5, 5),
    sedang: triangle(turb, 5, 15, 25),
    keruh: triangle(turb, 25, 50, 100),
  };
}

export function fuzzyLogic({ ph, suhu, tds, turbidity }) {
  const phSet = fuzzifyPH(ph);
  const suhuSet = fuzzifySuhu(suhu);
  const tdsSet = fuzzifyTDS(tds);
  const turbSet = fuzzifyTurbidity(turbidity);

  // Kumpulan rule
  const rules = [];

  // Rule 1: semua normal → tutup (0)
  rules.push({
    degree: Math.min(phSet.netral, suhuSet.normal, tdsSet.sedang, turbSet.sedang),
    output: 0
  });

  // Rule 2: Turbidity keruh → buka penuh (100)
  rules.push({
    degree: turbSet.keruh,
    output: 100
  });

  // Rule 3: TDS tinggi → buka lebar (80)
  rules.push({
    degree: tdsSet.tinggi,
    output: 80
  });

  // Rule 4: pH asam atau basa → buka (70)
  rules.push({
    degree: Math.max(phSet.asam, phSet.basa),
    output: 70
  });

  // Rule 5: suhu panas → buka (60)
  rules.push({
    degree: suhuSet.panas,
    output: 60
  });

  // Centroid defuzzifikasi
  let numerator = 0;
  let denominator = 0;

  rules.forEach(r => {
    numerator += r.degree * r.output;
    denominator += r.degree;
  });

  const result = denominator ? numerator / denominator : 0;

  return result; // 0 - 100
}