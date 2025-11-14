from app.i18n.id_styles import STYLE_LABELS_ID
from app.services.style_labels import get_style_label


def test_get_style_label_returns_localized_name():
    sample_key = next(iter(STYLE_LABELS_ID.keys()))
    assert get_style_label(sample_key) == STYLE_LABELS_ID[sample_key]


def test_get_style_label_uses_cache():
    sample_key = next(iter(STYLE_LABELS_ID.keys()))
    get_style_label.cache_clear()
    get_style_label(sample_key)
    info_after_first = get_style_label.cache_info()
    assert info_after_first.currsize == 1
    get_style_label(sample_key)
    info_after_second = get_style_label.cache_info()
    assert info_after_second.hits == info_after_first.hits + 1
