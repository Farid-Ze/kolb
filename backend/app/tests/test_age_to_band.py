from datetime import date

import pytest

from app.assessments.klsi_v4.logic import _age_to_band
from app.models.klsi.user import User


REFERENCE_DATE = date(2024, 1, 2)


def _user_for_age(age: int) -> User:
    dob = date(REFERENCE_DATE.year - age, REFERENCE_DATE.month, REFERENCE_DATE.day)
    return User(
        full_name="Tester",
        email=f"tester+{age}@example.com",
        password_hash=None,
        date_of_birth=dob,
    )


@pytest.mark.parametrize(
    "age,expected",
    [
        (18, "<19"),
        (19, "19-24"),
        (24, "19-24"),
        (25, "25-34"),
        (34, "25-34"),
        (35, "35-44"),
        (44, "35-44"),
        (45, "45-54"),
        (54, "45-54"),
        (55, "55-64"),
        (64, "55-64"),
        (65, ">64"),
    ],
)
def test_age_to_band_boundaries(age: int, expected: str):
    user = _user_for_age(age)
    assert _age_to_band(user, REFERENCE_DATE) == expected
