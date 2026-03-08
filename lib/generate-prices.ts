function roundPrice(price: number): number {
  if (price < 25) return 25;
  if (price < 500) return Math.round(price / 25) * 25;
  return Math.round(price / 50) * 50;
}

export function formatPriceRange(min: number, max: number): string {
  if (min === max) return `$${min.toLocaleString()}`;
  return `$${min.toLocaleString()}-$${max.toLocaleString()}`;
}

export function generateChoices(priceMin: number, priceMax: number): {
  choices: [number, number][];
  correctIndex: number;
} {
  const realRange: [number, number] = [priceMin, priceMax];
  const fakes: [number, number][] = [];
  const seen = new Set<string>();
  seen.add(`${priceMin}-${priceMax}`);

  let attempts = 0;

  while (fakes.length < 4 && attempts < 200) {
    attempts++;
    let multiplier: number;
    do {
      multiplier = 0.4 + Math.random() * 1.2;
    } while (multiplier > 0.85 && multiplier < 1.15);

    const fakeMin = roundPrice(Math.round(priceMin * multiplier));
    const fakeMax = roundPrice(Math.round(priceMax * multiplier));
    const correctedMin = Math.min(fakeMin, fakeMax);
    const correctedMax = Math.max(fakeMin, fakeMax);
    const key = `${correctedMin}-${correctedMax}`;

    if (!seen.has(key) && correctedMin > 0) {
      seen.add(key);
      fakes.push([correctedMin, correctedMax]);
    }
  }

  // Fallback: if rounding collapses too many values, add increments of $25
  let offset = 1;
  while (fakes.length < 4) {
    const candidateMin = priceMin + offset * 25;
    const candidateMax = priceMax + offset * 25;
    const key = `${candidateMin}-${candidateMax}`;
    if (!seen.has(key) && candidateMin > 0) {
      seen.add(key);
      fakes.push([candidateMin, candidateMax]);
    }
    offset = offset > 0 ? -offset : -offset + 1;
  }

  const allChoices: [number, number][] = [realRange, ...fakes].slice(0, 5);
  for (let i = allChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
  }

  const correctIndex = allChoices.findIndex(
    (c) => c[0] === priceMin && c[1] === priceMax
  );

  return { choices: allChoices, correctIndex };
}
