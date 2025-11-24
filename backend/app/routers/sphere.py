from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.klsi.user import User
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
async def list_nodes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await run_in_threadpool(sphere_service.list_nodes, db, current_user.id)

@router.get("/reflections", response_model=list[ReflectionOut])
async def list_reflections(
    reflection_type: ReflectionType | None = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return await run_in_threadpool(sphere_service.list_reflections, db, current_user.id, reflection_type)

@router.post("/reflections", response_model=ReflectionOut)
async def create_reflection(
    payload: ReflectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await run_in_threadpool(sphere_service.create_reflection, db, current_user.id, payload)

@router.get("/prompt", response_model=dict[str, str])
async def get_prompt(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = await run_in_threadpool(sphere_service.get_prompt_for_user, db, current_user.id)
    return {"prompt": prompt}
