function roundPrice(price: number): number {
  if (price < 25) return 25;
  if (price < 500) return Math.round(price / 25) * 25;
  return Math.round(price / 50) * 50;
}

export function generateChoices(realPrice: number): {
  choices: number[];
  correctIndex: number;
} {
  const fakes = new Set<number>();

  while (fakes.size < 4) {
    let multiplier: number;
    do {
      multiplier = 0.4 + Math.random() * 1.2;
    } while (multiplier > 0.85 && multiplier < 1.15);

    const fake = roundPrice(Math.round(realPrice * multiplier));
    if (fake !== realPrice && fake > 0) {
      fakes.add(fake);
    }
  }

  const allChoices = [realPrice, ...Array.from(fakes)];
  for (let i = allChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
  }

  return {
    choices: allChoices,
    correctIndex: allChoices.indexOf(realPrice),
  };
}
