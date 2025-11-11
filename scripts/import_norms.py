import csv
import sys
from hashlib import sha256

from app.db.database import Base, engine, transactional_session
from app.db.repositories import NormativeConversionRepository
from app.models.klsi import AuditLog

"""
CLI usage (optional):
python -m scripts.import_norms <norm_group> <path_to_csv> [norm_version]
CSV columns: scale_name,raw_score,percentile
"""

def main():
    if len(sys.argv) not in (3, 4):
        print("Usage: python -m scripts.import_norms <norm_group> <csv_path> [norm_version]")
        sys.exit(1)
    norm_group, path = sys.argv[1], sys.argv[2]
    norm_version = sys.argv[3] if len(sys.argv) == 4 else "default"
    norm_version = norm_version.strip() or "default"
    if len(norm_version) > 40:
        print("norm_version must be <= 40 characters")
        sys.exit(1)
    Base.metadata.create_all(bind=engine)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    h = sha256(content.encode('utf-8')).hexdigest()
    reader = csv.DictReader(content.splitlines())
    expected = {"scale_name", "raw_score", "percentile"}
    if not reader.fieldnames or set(reader.fieldnames) != expected:
        print("CSV header must be: scale_name,raw_score,percentile")
        sys.exit(2)
    rows = list(reader)
    with transactional_session() as db:
        repo = NormativeConversionRepository(db)
        for row in rows:
            scale_name = row['scale_name'].strip()
            raw_score = int(row['raw_score'])
            percentile = float(row['percentile'])
            repo.upsert(norm_group, norm_version, scale_name, raw_score, percentile)
        db.add(AuditLog(actor='system', action=f'norm_import:{norm_group}:{norm_version}', payload_hash=h))
    print(f"Imported {len(rows)} rows for norm_group={norm_group} version={norm_version}")

if __name__ == '__main__':
    main()
