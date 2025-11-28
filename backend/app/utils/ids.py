import string

_ALPHABET = string.ascii_letters + string.digits
_BASE = len(_ALPHABET)
_XOR_MASK = 123456789 # Simple mask

def encode_public_id(internal_id: int) -> str:
    """Obfuscate an internal integer ID into a public string."""
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

def decode_public_id(public_id: str) -> int:
    """Decode a public string back to an internal integer ID."""
    # 1. Base62 decode
    obfuscated = 0
    for char in public_id:
        obfuscated = obfuscated * _BASE + _ALPHABET.index(char)
        
    # 2. XOR back
    return obfuscated ^ _XOR_MASK
