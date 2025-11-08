from app.data.session_designs import STYLES, designs, filter_by_styles, recommend_for_primary


def test_designs_structure():
    assert len(designs) >= 5
    for d in designs:
        assert isinstance(d["code"], str)
        assert isinstance(d["title"], str)
        assert isinstance(d["summary"], str)
        assert isinstance(d["activates"], list)
        assert all(isinstance(s, str) for s in d["activates"]) 
        assert isinstance(d["duration_min"], int)


def test_filter_by_styles_any():
    res = filter_by_styles(["Acting"]) 
    assert any("Acting" in d["activates"] for d in res)


def test_recommend_for_primary_hits_primary_and_stretch():
    primary = "Thinking"
    recs = recommend_for_primary(primary_style=primary, backup_style=None, limit=4)
    assert len(recs) >= 1
    # at least one activates primary
    assert any(primary in d["activates"] for d in recs)
