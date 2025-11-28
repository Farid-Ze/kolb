from typing import cast

import pytest
from pydantic import ValidationError

from app.assessments.klsi_v4.logic import CONTEXT_NAMES
from app.schemas.session import (
    AutosaveItemRank,
    LegacyContextSubmissionPayload,
    LegacyItemSubmissionPayload,
    SessionAutosavePayload,
    SessionSubmissionPayload,
)


def _build_camel_submission_payload() -> dict:
    items = [
        {
            "itemId": index + 1,
            "ranks": [
                {"choiceId": 10, "rank": 1},
                {"choiceId": 11, "rank": 2},
                {"choiceId": 12, "rank": 3},
                {"choiceId": 13, "rank": 4},
            ],
        }
        for index in range(12)
    ]
    contexts = [
        {
            "contextName": name,
            "CE": 1,
            "RO": 2,
            "AC": 3,
            "AE": 4,
        }
        for name in CONTEXT_NAMES[:8]
    ]
    return {"items": items, "contexts": contexts}


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


def test_autosave_item_rank_normalizes_option_codes():
    payload = AutosaveItemRank(
        item_id=1,
        ranks={"ce": 1, "Ro": 2, "AC": 3, "AE": 4},
    )

    assert set(payload.ranks.keys()) == {"CE", "RO", "AC", "AE"}


def test_session_autosave_payload_rejects_duplicate_items():
    with pytest.raises(ValidationError):
        SessionAutosavePayload(
            responses=[
                AutosaveItemRank(
                    item_id=1,
                    ranks={"CE": 1, "RO": 2, "AC": 3, "AE": 4},
                ),
                AutosaveItemRank(
                    item_id=1,
                    ranks={"CE": 1, "RO": 2, "AC": 3, "AE": 4},
                ),
            ]
        )


def test_session_submission_payload_accepts_camel_case_aliases():
    payload = SessionSubmissionPayload.model_validate(_build_camel_submission_payload())

    assert len(payload.items) == 12
    assert payload.items[0].item_id == 1
    assert payload.contexts[0].context_name == CONTEXT_NAMES[0]


def test_session_submission_payload_dumps_camel_case_aliases():
    payload = SessionSubmissionPayload.model_validate(_build_camel_submission_payload())

    dumped = payload.model_dump(by_alias=True)
    assert set(dumped["items"][0].keys()) == {"itemId", "ranks"}
    assert "contextName" in dumped["contexts"][0]
    # Uppercase metric keys should stay untouched
    assert {"CE", "RO", "AC", "AE"}.issubset(dumped["contexts"][0].keys())
