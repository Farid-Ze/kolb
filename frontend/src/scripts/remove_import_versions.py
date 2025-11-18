import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
PATTERN = re.compile(r'(from\s+|import\s+)([\"\'])([^\"\']+)([\"\'])')
changed_any = False

for path in ROOT.rglob('*.[tj]s*'):
    text = path.read_text(encoding='utf-8')
    file_changed = [False]

    def repl(match):
        prefix, quote_open, spec, quote_close = match.groups()
        if spec.startswith('.') or spec.startswith('/'):
            return match.group(0)
        if '@' not in spec:
            return match.group(0)
        base, _, version = spec.rpartition('@')
        if not base or '/' in version:
            return match.group(0)
        file_changed[0] = True
        return f"{prefix}{quote_open}{base}{quote_close}"

    new_text = PATTERN.sub(repl, text)
    if file_changed[0]:
        path.write_text(new_text, encoding='utf-8')
        changed_any = True

print('Updated import specifiers.' if changed_any else 'No changes made.')
