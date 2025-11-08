from collections import defaultdict
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.models.klsi import AssessmentSession, AssessmentItem, UserResponse, ItemChoice, ItemType

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
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
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

    # Fetch items and responses
    items = db.query(AssessmentItem).filter(AssessmentItem.item_type == ItemType.learning_style).all()
    item_ids = [i.id for i in items]
    responses = db.query(UserResponse).filter(UserResponse.session_id == session_id).all()

    ranks_per_item = defaultdict(list)
    choice_count = defaultdict(int)
    for r in responses:
        ranks_per_item[r.item_id].append(r.rank_value)
        choice_count[r.choice_id] += 1

    items_with_rank_conflict = []
    items_with_missing_ranks = []
    missing_item_ids = []
    for iid in item_ids:
        ranks = ranks_per_item.get(iid, [])
        if not ranks:
            missing_item_ids.append(iid)
            continue
        # Expect exactly {1,2,3,4}
        unique_ranks = set(ranks)
        if len(ranks) != len(unique_ranks):
            items_with_rank_conflict.append(iid)
        expected = {1,2,3,4}
        if unique_ranks != expected:
            items_with_missing_ranks.append({"item_id": iid, "present": sorted(unique_ranks), "missing": sorted(list(expected - unique_ranks))})

    duplicate_choice_ids = [cid for cid, c in choice_count.items() if c > 1]
    responded_items = len(ranks_per_item.keys())
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
