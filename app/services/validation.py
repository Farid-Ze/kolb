from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.assessments.klsi_v4.logic import CONTEXT_NAMES, validate_lfi_context_ranks
from app.db.repositories import (
    AssessmentItemRepository,
    LFIContextRepository,
    SessionRepository,
    UserResponseRepository,
)


def check_session_complete(db: Session, session_id: int) -> Dict[str, Any]:
    """Validate completeness & consistency of a session's ipsative rankings.

    Returns dict with:
    - session_exists: bool
    - status: current session status
    - total_items: count of items expected (learning_style only)
    - responded_items: number of distinct items with any response
    - missing_item_ids: list of item ids lacking full rank set (1..4)
    - items_with_rank_conflict: items where duplicate rank_value exists
    - items_with_missing_ranks: items missing one or more rank values
    - duplicate_choice_ids: list of choice_ids that appear >1 for same session (should be prevented by constraint, defensive)
    - ready_to_complete: bool (true if all items have exactly ranks 1..4 once)
    """
    session_repo = SessionRepository(db)
    session = session_repo.get_by_id(session_id)
    if not session:
        return {
            "session_exists": False,
            "status": None,
            "total_items": 0,
            "responded_items": 0,
            "missing_item_ids": [],
            "items_with_rank_conflict": [],
            "items_with_missing_ranks": [],
            "duplicate_choice_ids": [],
            "ready_to_complete": False,
        }

    # Fetch learning_style item IDs
    item_repo = AssessmentItemRepository(db)
    item_ids = item_repo.get_learning_item_ids()

    # Aggregate ranks per item with COUNT and COUNT DISTINCT via SQL
    # This reduces Python-side processing and roundtrips.
    response_repo = UserResponseRepository(db)
    rank_rows = response_repo.aggregate_ranks_by_item(session_id)
    # Build maps from aggregated rows
    ranks_by_item: dict[int, set[int]] = defaultdict(set)
    any_dup_per_item: dict[int, bool] = defaultdict(bool)
    for aggregate in rank_rows:
        ranks_by_item[aggregate.item_id].add(aggregate.rank_value)
        if aggregate.count > 1:
            any_dup_per_item[aggregate.item_id] = True

    # Detect duplicate choices (defensive; should be prevented by constraint)
    duplicate_choice_ids = response_repo.find_duplicate_choices(session_id)

    items_with_rank_conflict: List[int] = []
    items_with_missing_ranks: List[Dict[str, Any]] = []
    missing_item_ids: List[int] = []
    expected = {1, 2, 3, 4}
    for iid in item_ids:
        present = ranks_by_item.get(iid)
        if not present:
            missing_item_ids.append(iid)
            continue
        if any_dup_per_item.get(iid, False):
            items_with_rank_conflict.append(iid)
        if present != expected:
            items_with_missing_ranks.append({
                "item_id": iid,
                "present": sorted(present),
                "missing": sorted(list(expected - present)),
            })

    responded_items = len(ranks_by_item.keys())
    ready_to_complete = not missing_item_ids and not items_with_rank_conflict and not items_with_missing_ranks

    return {
        "session_exists": True,
        "status": session.status.value if hasattr(session.status, 'value') else str(session.status),
        "total_items": len(item_ids),
        "responded_items": responded_items,
        "missing_item_ids": missing_item_ids,
        "items_with_rank_conflict": items_with_rank_conflict,
        "items_with_missing_ranks": items_with_missing_ranks,
        "duplicate_choice_ids": duplicate_choice_ids,
        "ready_to_complete": ready_to_complete,
    }


def run_session_validations(db: Session, session_id: int) -> Dict[str, Any]:
    """Aggregate validation checks for session readiness prior to finalization."""

    issues: List[Dict[str, Any]] = []
    core = check_session_complete(db, session_id)
    if not core.get("session_exists"):
        return {
            "ready": False,
            "issues": [
                {
                    "code": "SESSION_NOT_FOUND",
                    "message": "Sesi tidak ditemukan",
                    "fatal": True,
                }
            ],
            "diagnostics": core,
        }

    if core.get("missing_item_ids"):
        issues.append(
            {
                "code": "ITEMS_INCOMPLETE",
                "message": "Masih ada item gaya belajar yang belum memiliki peringkat lengkap 1..4.",
                "item_ids": core["missing_item_ids"],
                "fatal": True,
            }
        )
    if core.get("items_with_missing_ranks"):
        issues.append(
            {
                "code": "ITEM_RANK_GAPS",
                "message": "Beberapa item memiliki peringkat yang tidak lengkap atau duplikat.",
                "details": core["items_with_missing_ranks"],
                "fatal": True,
            }
        )
    if core.get("items_with_rank_conflict"):
        issues.append(
            {
                "code": "ITEM_RANK_CONFLICT",
                "message": "Terdapat ranking duplikat pada item forced-choice.",
                "item_ids": core["items_with_rank_conflict"],
                "fatal": True,
            }
        )

    # LFI context validations
    context_repo = LFIContextRepository(db)
    contexts = context_repo.list_for_session(session_id)
    if len(contexts) != len(CONTEXT_NAMES):
        issues.append(
            {
                "code": "LFI_CONTEXT_COUNT",
                "message": f"Konteks LFI harus lengkap {len(CONTEXT_NAMES)} entri.",
                "found": len(contexts),
                "fatal": True,
            }
        )
    else:
        unique_names = {ctx.context_name for ctx in contexts}
        allowed_names = set(CONTEXT_NAMES)
        unknown = sorted(unique_names - allowed_names)
        if unknown:
            issues.append(
                {
                    "code": "LFI_CONTEXT_UNKNOWN",
                    "message": "Ada nama konteks LFI yang tidak dikenal.",
                    "contexts": unknown,
                    "fatal": True,
                }
            )
        if len(unique_names) != len(contexts):
            issues.append(
                {
                    "code": "LFI_CONTEXT_DUPLICATE",
                    "message": "Terdapat konteks LFI yang diisi lebih dari sekali.",
                    "fatal": True,
                }
            )
        try:
            payload = [
                {
                    "CE": ctx.CE_rank,
                    "RO": ctx.RO_rank,
                    "AC": ctx.AC_rank,
                    "AE": ctx.AE_rank,
                }
                for ctx in contexts
            ]
            validate_lfi_context_ranks(payload)
        except ValueError as exc:  # pragma: no cover - validation ensures message
            issues.append(
                {
                    "code": "LFI_CONTEXT_RANK_INVALID",
                    "message": str(exc),
                    "fatal": True,
                }
            )

    ready = not issues
    return {
        "ready": ready,
        "issues": issues,
        "diagnostics": {
            "items": core,
            "context_count": len(contexts),
        },
    }
