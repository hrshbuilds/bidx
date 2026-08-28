export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function computeJaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  return unionCount === 0 ? 0 : Number((intersectionCount / unionCount).toFixed(4));
}

export function computeNgramOverlap(text1: string, text2: string, n = 3): number {
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.length < n || tokens2.length < n) return 0;

  const ngrams1 = new Set<string>();
  for (let i = 0; i <= tokens1.length - n; i++) {
    ngrams1.add(tokens1.slice(i, i + n).join(' '));
  }

  const ngrams2 = new Set<string>();
  for (let i = 0; i <= tokens2.length - n; i++) {
    ngrams2.add(tokens2.slice(i, i + n).join(' '));
  }

  let intersection = 0;
  for (const gram of ngrams1) {
    if (ngrams2.has(gram)) {
      intersection++;
    }
  }

  const union = new Set([...ngrams1, ...ngrams2]).size;
  return union === 0 ? 0 : Number((intersection / union).toFixed(4));
}
