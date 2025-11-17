from app.db.database import SessionLocal
from app.services.engine import EngineSessionService
from app.tests.test_engine_legacy_parity import _build_batch_payload, BASELINE_ITEM_SEQUENCE, BASELINE_CONTEXT_SEQUENCE
from app.models.klsi.user import User
from app.services.security import create_access_token
from app.engine.runtime import runtime
from app.schemas.session import SessionSubmissionPayload


def main():
    payload_dict = _build_batch_payload(BASELINE_ITEM_SEQUENCE, BASELINE_CONTEXT_SEQUENCE)
    payload = SessionSubmissionPayload(**payload_dict)
    with SessionLocal() as db:
        user = User(full_name="Debug User", email="debug@example.com", role="MAHASISWA")
        db.add(user)
        db.commit()
        db.refresh(user)
        session = runtime.start_session(db, user, instrument_code="KLSI", instrument_version=None)
        service = EngineSessionService(db)
        try:
            result = service.submit_full_batch(session.id, user, payload)
            print("Result:", result)
        except Exception as exc:
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    main()
