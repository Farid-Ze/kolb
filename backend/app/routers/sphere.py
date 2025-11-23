from fastapi import APIRouter, Depends

from app.db.database import get_db
from app.services.security import get_current_user
from app.services.sphere_service import sphere_service
from app.schemas.sphere import (
    ReflectionCreate,
    ReflectionOut,
    ReflectionType,
    SphereNodeOut,
)

router = APIRouter(prefix="/sphere", tags=["sphere"])

@router.get("/nodes", response_model=list[SphereNodeOut])
def list_nodes(db = Depends(get_db), current_user = Depends(get_current_user)):
    return sphere_service.list_nodes(db, current_user.id)

@router.get("/reflections", response_model=list[ReflectionOut])
def list_reflections(
    reflection_type: ReflectionType | None = None,
    db = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return sphere_service.list_reflections(db, current_user.id, reflection_type)

@router.post("/reflections", response_model=ReflectionOut)
def create_reflection(
    payload: ReflectionCreate,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return sphere_service.create_reflection(db, current_user.id, payload)

@router.get("/prompt", response_model=dict[str, str])
def get_prompt(
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    prompt = sphere_service.get_prompt_for_user(db, current_user.id)
    return {"prompt": prompt}
