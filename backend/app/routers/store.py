from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.store import CheckoutRequest, CheckoutResponse, CommunityFundOut, ProductOut
from app.services.security import get_current_user
from app.services.store_service import StoreServiceError, store_service

router = APIRouter(prefix="/store", tags=["store"])

@router.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return store_service.list_products(db, current_user.id)

@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    product = store_service.get_product_details(db, current_user.id, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/community-fund", response_model=CommunityFundOut)
def get_community_fund(db: Session = Depends(get_db)):
    return store_service.community_fund_snapshot(db)


@router.post("/checkout", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        order, remaining_points, fund = store_service.checkout(
            db,
            current_user.id,
            product_id=payload.product_id,
            contribution_points=payload.contribution_points,
        )
    except StoreServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
    return {
        "order_id": order.id,
        "remaining_points": remaining_points,
        "community_fund": fund,
    }
