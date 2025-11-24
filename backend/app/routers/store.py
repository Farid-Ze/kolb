from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.db.database import get_db
from app.schemas.store import CheckoutRequest, CommunityFundSummary, ProductOut, StoreOrderOut
from app.services.security import get_current_user
from app.services.store_service import StoreServiceError, store_service

router = APIRouter(prefix="/store", tags=["store"])

@router.get("/products", response_model=list[ProductOut])
def list_products(
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    return store_service.list_products(db, current_user.id)

@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    product = store_service.get_product_details(db, current_user.id, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/checkout", response_model=StoreOrderOut)
def checkout(
    payload: CheckoutRequest,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    try:
        order = store_service.create_order(db, current_user.id, payload)
    except StoreServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
    return order


@router.get("/community-fund", response_model=CommunityFundSummary)
def community_fund(db: Any = Depends(get_db)):
    return store_service.get_community_fund_summary(db)
