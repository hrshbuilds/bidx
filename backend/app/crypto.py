"""
SHA-256 utility (pure Python) — mirrors src/lib/crypto.ts
All audit hash-chain computations must use this to stay byte-for-byte
consistent with the frontend's own hash calculations.
"""
import hashlib
import json
from typing import Any, Dict


def sha256(data: str) -> str:
    """Return lowercase hex-encoded SHA-256 digest of a UTF-8 string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def sha256_dict(payload: Dict[str, Any]) -> str:
    """SHA-256 of a dict serialised with sorted keys (deterministic)."""
    return sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")))
