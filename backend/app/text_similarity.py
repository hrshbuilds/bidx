"""
Text similarity functions (Jaccard and N-Gram overlap) — mirrors src/lib/textSimilarity.ts
"""
import re
from typing import Set


def tokenize(text: str) -> Set[str]:
    """Tokenize text into lowercase alphanumeric words, filtering out short stopwords."""
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    words = cleaned.split()
    stopwords = {
        "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "for",
        "of", "in", "on", "at", "by", "with", "this", "that", "it", "from", "as", "be",
    }
    return {w for w in words if len(w) > 2 and w not in stopwords}


def compute_jaccard_similarity(text1: str, text2: str) -> float:
    """Compute token-level Jaccard similarity coefficient between two texts (0.0 to 1.0)."""
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)

    if not tokens1 and not tokens2:
        return 1.0
    if not tokens1 or not tokens2:
        return 0.0

    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))
    return intersection / union if union > 0 else 0.0


def compute_ngram_overlap(text1: str, text2: str, n: int = 4) -> float:
    """Compute n-gram sequence overlap ratio between two texts (0.0 to 1.0)."""
    cleaned1 = re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", text1.lower())).strip()
    cleaned2 = re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", text2.lower())).strip()

    words1 = cleaned1.split()
    words2 = cleaned2.split()

    if len(words1) < n or len(words2) < n:
        return compute_jaccard_similarity(text1, text2)

    def extract_ngrams(words: list[str], size: int) -> Set[str]:
        return {" ".join(words[i : i + size]) for i in range(len(words) - size + 1)}

    ngrams1 = extract_ngrams(words1, n)
    ngrams2 = extract_ngrams(words2, n)

    if not ngrams1 and not ngrams2:
        return 1.0
    if not ngrams1 or not ngrams2:
        return 0.0

    intersection = len(ngrams1.intersection(ngrams2))
    smaller_size = min(len(ngrams1), len(ngrams2))
    return intersection / smaller_size if smaller_size > 0 else 0.0
