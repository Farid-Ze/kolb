import csv
from hashlib import sha256
from io import StringIO

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.klsi import AuditLog, NormativeConversionTable, User

router = APIRouter(prefix="/admin", tags=["admin"])

def _get_current_user(authorization: str | None, db: Session) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="Token diperlukan")
    auth_lower = authorization.lower()
    if not auth_lower.startswith('bearer '):
        raise HTTPException(status_code=401, detail="Token diperlukan")
    token = authorization.split()[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    uid_raw = payload.get('sub')
    if uid_raw is None:
        raise HTTPException(status_code=401, detail="Token tidak memuat sub")
    try:
        uid = int(uid_raw)
    except ValueError:
        raise HTTPException(status_code=401, detail="sub token tidak valid")
    user = db.query(User).filter(User.id==uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan")
    return user

@router.post("/norms/import")
def import_norms(norm_group: str, file: UploadFile = File(...), db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization, db)
    if user.role != 'MEDIATOR':
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang boleh impor norma")
    fname = file.filename or ""
    if not fname.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File harus CSV")
    content = file.file.read().decode('utf-8')
    reader = csv.DictReader(StringIO(content))
    expected_cols = {"scale_name","raw_score","percentile"}
    if not reader.fieldnames or set(reader.fieldnames) != expected_cols:
        raise HTTPException(status_code=400, detail="Header CSV harus scale_name,raw_score,percentile")
    rows = []
    last_percentiles: dict[str, float] = {}
    for row in reader:
        try:
            scale_name = row['scale_name'].strip()
            raw_score = int(row['raw_score'])
            percentile = float(row['percentile'])
        except Exception:
            raise HTTPException(status_code=400, detail=f"Format baris tidak valid: {row}")
        # Monotonic cumulative percentage check per scale
        if scale_name not in last_percentiles:
            last_percentiles[scale_name] = percentile
        else:
            if percentile < last_percentiles[scale_name]:
                raise HTTPException(status_code=400, detail=f"Percentile tidak monotonic untuk skala {scale_name} raw {raw_score}")
            last_percentiles[scale_name] = percentile
        rows.append((scale_name, raw_score, percentile))
    batch_hash = sha256(content.encode('utf-8')).hexdigest()
    inserted = 0
    for scale_name, raw_score, percentile in rows:
        # Idempotent upsert: check existing
        existing = db.query(NormativeConversionTable).filter(
            NormativeConversionTable.norm_group==norm_group,
            NormativeConversionTable.scale_name==scale_name,
            NormativeConversionTable.raw_score==raw_score
        ).first()
        if existing:
            existing.percentile = percentile  # update if changed
        else:
            db.add(NormativeConversionTable(norm_group=norm_group, scale_name=scale_name, raw_score=raw_score, percentile=percentile))
            inserted += 1
    db.add(AuditLog(actor=user.email, action=f'norm_import:{norm_group}', payload_hash=batch_hash))
    db.commit()
    return {"norm_group": norm_group, "rows_inserted": inserted, "rows_processed": len(rows), "hash": batch_hash}
