export interface EntityMatchResult {
  isMatch: boolean;
  confidenceScore: number; // 0 to 1
  normalizedEntity1: string;
  normalizedEntity2: string;
  varianceDetails: string;
}

export class EntityResolutionService {
  /**
   * Normalizes enterprise names by standardizing legal prefixes, suffixes, and noise words
   */
  public static normalizeCompanyName(name: string): string {
    return name
      .toUpperCase()
      .replace(/\./g, '')
      .replace(/,/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\bPVT\b/g, 'PRIVATE')
      .replace(/\bLTD\b/g, 'LIMITED')
      .replace(/\bCORP\b/g, 'CORPORATION')
      .replace(/\bINC\b/g, 'INCORPORATED')
      .replace(/\bCO\b/g, 'COMPANY')
      .replace(/\bLLP\b/g, 'LIMITED LIABILITY PARTNERSHIP')
      .replace(/\bSERVICES\b/g, 'SERVICE')
      .replace(/\bSOLUTIONS\b/g, 'SOLUTION')
      .replace(/\bSYSTEMS\b/g, 'SYSTEM')
      .replace(/\bINDIA\b/g, '')
      .trim();
  }

  /**
   * Fuzzy compares two legal entity names to distinguish harmless formatting differences from true identity mismatches
   */
  public static compareEntityNames(name1: string, name2: string): EntityMatchResult {
    const norm1 = this.normalizeCompanyName(name1);
    const norm2 = this.normalizeCompanyName(name2);

    if (norm1 === norm2) {
      return {
        isMatch: true,
        confidenceScore: 1.0,
        normalizedEntity1: norm1,
        normalizedEntity2: norm2,
        varianceDetails: 'Exact normalized match across statutory records.',
      };
    }

    // Levenshtein similarity calculation
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);
    const similarity = maxLength === 0 ? 1 : 1 - distance / maxLength;

    if (similarity >= 0.85) {
      return {
        isMatch: true,
        confidenceScore: Number(similarity.toFixed(3)),
        normalizedEntity1: norm1,
        normalizedEntity2: norm2,
        varianceDetails: `Minor orthographic variation detected (${(similarity * 100).toFixed(1)}% match). Acceptable naming variance (e.g. Pvt Ltd vs Private Limited expansion).`,
      };
    }

    return {
      isMatch: false,
      confidenceScore: Number(similarity.toFixed(3)),
      normalizedEntity1: norm1,
      normalizedEntity2: norm2,
      varianceDetails: `High divergence in entity names (${norm1} vs ${norm2}). Potential entity impersonation or document mismatch.`,
    };
  }

  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
