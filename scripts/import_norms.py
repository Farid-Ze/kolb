import sys
import csv
from hashlib import sha256
from app.db.database import SessionLocal, engine, Base
from app.models.klsi import NormativeConversionTable, AuditLog

"""
CLI usage (optional):
python -m scripts.import_norms <norm_group> <path_to_csv>
CSV columns: scale_name,raw_score,percentile
"""

def main():
    if len(sys.argv) != 3:
        print("Usage: python -m scripts.import_norms <norm_group> <csv_path>")
        sys.exit(1)
    norm_group, path = sys.argv[1], sys.argv[2]
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
    with SessionLocal() as db:
        for row in rows:
            db.add(NormativeConversionTable(norm_group=norm_group,
                                            scale_name=row['scale_name'].strip(),
                                            raw_score=int(row['raw_score']),
                                            percentile=float(row['percentile'])))
        db.add(AuditLog(actor='system', action=f'norm_import:{norm_group}', payload_hash=h))
        db.commit()
    print(f"Imported {len(rows)} rows for norm_group={norm_group}")

if __name__ == '__main__':
    main()
