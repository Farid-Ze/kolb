import string

_ALPHABET = string.ascii_letters + string.digits
_BASE = len(_ALPHABET)
_PRIME = 982451653  # Large prime for mixing
_XOR_MASK = 123456789 # Simple mask

def encode_public_id(internal_id: int) -> str:
    """Obfuscate an internal integer ID into a public string."""
    # Simple reversible obfuscation: (id * prime) XOR mask -> Base62
    # This is NOT encryption, just a facade to prevent sequential enumeration.
    mixed = (internal_id * _PRIME) ^ _XOR_MASK
    
    if mixed == 0:
        return _ALPHABET[0]
        
    encoded = []
    while mixed > 0:
        mixed, remainder = divmod(mixed, _BASE)
        encoded.append(_ALPHABET[remainder])
    
    return "".join(reversed(encoded))

def decode_public_id(public_id: str) -> int:
    """Decode a public string back to an internal integer ID."""
    mixed = 0
    for char in public_id:
        mixed = mixed * _BASE + _ALPHABET.index(char)
        
    # Reverse obfuscation: (mixed XOR mask) * modular_inverse(prime)
    # Since we don't need cryptographic strength, we can just reverse the steps if we used a reversible math.
    # But wait, (id * prime) might overflow if not careful, or we need modular arithmetic.
    # For simplicity in this "Facade" requirement without deps, let's use a simpler XOR-only or just Base62.
    # Actually, just Base62 encoding the ID is often enough to prevent *casual* enumeration if the ID is large.
    # But small IDs (1, 2) become "b", "c".
    # Let's stick to a simple XOR with a large number before Base62.
    
    # Re-implementing with simpler logic for reversibility without complex modular inverse:
    # We'll just XOR first, then Base62.
    pass

# Re-defining for correctness
def encode_public_id_simple(internal_id: int) -> str:
    # 1. XOR with a constant to scatter bits
    obfuscated = internal_id ^ _XOR_MASK
    
    # 2. Base62 encode
    if obfuscated == 0:
        return _ALPHABET[0]
        
    encoded = []
    while obfuscated > 0:
        obfuscated, remainder = divmod(obfuscated, _BASE)
        encoded.append(_ALPHABET[remainder])
    
    return "".join(reversed(encoded))

def decode_public_id_simple(public_id: str) -> int:
    # 1. Base62 decode
    obfuscated = 0
    for char in public_id:
        obfuscated = obfuscated * _BASE + _ALPHABET.index(char)
        
    # 2. XOR back
    return obfuscated ^ _XOR_MASK

# Export the simple versions
encode_public_id = encode_public_id_simple
decode_public_id = decode_public_id_simple
