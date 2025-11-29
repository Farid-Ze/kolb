import pytest
from unittest.mock import MagicMock, patch
import uuid
from app.assessments.klsi_v4.logic import apply_percentiles, ALGORITHM_VERSION_SHA
from app.models.klsi.learning import ScaleScore, CombinationScore
from app.services.provenance import log_provenance_background_task

def test_apply_percentiles_includes_sha(db):
    # Setup mocks
    session_id = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
    scale = ScaleScore(
        session_id=session_id,
        CE_raw=10, RO_raw=10, AC_raw=10, AE_raw=10
    )
    combo = CombinationScore(
        session_id=session_id,
        ACCE_raw=0, AERO_raw=0,
        assimilation_accommodation=0, converging_diverging=0,
        balance_acce=0, balance_aero=0
    )
    
    # Mock NormProvider
    mock_provider = MagicMock()
    mock_result = MagicMock()
    mock_result.percentile = 50.0
    mock_result.provenance = "Appendix:Test"
    mock_result.truncated = False
    mock_provider.percentile.return_value = mock_result
    
    # Run apply_percentiles
    with patch("app.assessments.klsi_v4.logic.resolve_norm_groups", return_value=["Total"]):
        with patch("app.assessments.klsi_v4.logic.build_composite_norm_provider", return_value=mock_provider):
            with patch("app.assessments.klsi_v4.logic._lookup_percentile_cached", return_value=(50.0, "Appendix:Test", False)):
                 entity = apply_percentiles(db, session_id, scale, combo)
    
    # Check payload
    payload = getattr(entity, "_provenance_payload", {})
    assert "algorithm_sha" in payload
    assert payload["algorithm_sha"] == ALGORITHM_VERSION_SHA
    assert payload["algorithm_sha"] != "unknown"

def test_log_provenance_saves_sha(db):
    pass
