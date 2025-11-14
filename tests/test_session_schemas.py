from __future__ import annotations

from typing import cast

import pytest
from pydantic import ValidationError

from app.assessments.klsi_v4.logic import CONTEXT_NAMES
from app.schemas.session import (
    LegacyContextSubmissionPayload,
    LegacyItemSubmissionPayload,
)


def test_legacy_item_submission_payload_runtime_export():
    payload = LegacyItemSubmissionPayload(
        item_id=123,
        ranks=cast(dict[int, int], {"10": 1, "11": 2, "12": 3, "13": 4}),
    )

    runtime_payload = payload.runtime_payload()

    assert runtime_payload["kind"] == "item"
    assert runtime_payload["item_id"] == 123
    assert runtime_payload["ranks"] == {10: 1, 11: 2, 12: 3, 13: 4}


def test_legacy_item_submission_payload_rejects_invalid_permutation():
    with pytest.raises(ValidationError):
        LegacyItemSubmissionPayload(
            item_id=123,
            ranks=cast(dict[int, int], {"10": 1, "11": 1, "12": 3, "13": 4}),
        )


def test_legacy_context_submission_payload_runtime_export():
    payload = LegacyContextSubmissionPayload(
        context_name=CONTEXT_NAMES[0],
        CE=1,
        RO=2,
        AC=3,
        AE=4,
    )

    runtime_payload = payload.runtime_payload()

    assert runtime_payload["kind"] == "context"
    assert runtime_payload["context_name"] == CONTEXT_NAMES[0]
    assert runtime_payload["overwrite"] is False


def test_legacy_context_submission_payload_rejects_unknown_context():
    with pytest.raises(ValidationError):
        LegacyContextSubmissionPayload(
            context_name="UNKNOWN",
            CE=1,
            RO=2,
            AC=3,
            AE=4,
        )
