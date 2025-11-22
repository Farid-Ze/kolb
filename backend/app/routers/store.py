from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.security import get_current_user
from app.services.store_service import store_service
from app.schemas.store import ProductOut

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
