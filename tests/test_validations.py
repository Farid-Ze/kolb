import re

def test_kelas_format():
    assert re.fullmatch(r"IF-\d+", "IF-1")
    assert re.fullmatch(r"IF-\d+", "IF-10")
    assert not re.fullmatch(r"IF-\d+", "IF-A")
    assert not re.fullmatch(r"IF-\d+", "IF-001A")

def test_nim_length():
    assert len("01234567") == 8
    assert "01234567".isdigit()
    assert not "0123456A".isdigit()
