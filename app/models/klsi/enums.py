from __future__ import annotations

import enum

__all__ = [
    "Gender",
    "AgeGroup",
    "EducationLevel",
    "SessionStatus",
    "ItemType",
    "LearningMode",
]


class Gender(enum.Enum):
    male = "Male"
    female = "Female"
    other = "Other"
    prefer_not = "Prefer not to say"


class AgeGroup(enum.Enum):
    lt19 = "<19"
    g19_24 = "19-24"
    g25_34 = "25-34"
    g35_44 = "35-44"
    g45_54 = "45-54"
    g55_64 = "55-64"
    gt64 = ">64"


class EducationLevel(enum.Enum):
    primary = "Primary School"
    secondary = "Secondary School"
    university = "University Degree"
    masters = "Master's Degree"
    doctoral = "Doctoral Degree"


class SessionStatus(enum.Enum):
    started = "Started"
    in_progress = "In Progress"
    completed = "Completed"
    abandoned = "Abandoned"


class ItemType(enum.Enum):
    learning_style = "Learning_Style"
    learning_flex = "Learning_Flexibility"


class LearningMode(enum.Enum):
    CE = "CE"
    RO = "RO"
    AC = "AC"
    AE = "AE"
