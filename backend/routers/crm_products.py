from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from core.deps import get_db
from core.permissions import require_user
from models.auth import User
from models.crm import CRMProduct
from schemas_domain import crm as schemas_crm
from core.logger import setup_logger

logger = setup_logger("router_crm_products")

router = APIRouter(prefix="/crm/products", tags=["CRM - Catálogo de Produtos"])


def get_client_id(x_client_id: Optional[str] = Header(None)) -> int:
    if not x_client_id:
        raise HTTPException(status_code=400, detail="X-Client-ID header é obrigatório")
    try:
        return int(x_client_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="X-Client-ID inválido")


@router.get("", response_model=List[schemas_crm.CRMProductResponse])
def list_products(
    include_inactive: bool = False,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Lista todos os produtos cadastrados do cliente para uso no Kanban de Vendas."""
    query = db.query(CRMProduct).filter(CRMProduct.client_id == client_id)
    if not include_inactive:
        query = query.filter(CRMProduct.is_active == True)
    
    products = query.order_by(CRMProduct.name.asc(), CRMProduct.id.asc()).all()
    return products


@router.post("", response_model=schemas_crm.CRMProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: schemas_crm.CRMProductCreate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Cadastra um novo produto com nome e preço de tabela/padrão."""
    name_clean = payload.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Nome do produto é obrigatório")

    price_val = float(payload.price or 0.0)
    if price_val < 0.0:
        raise HTTPException(status_code=400, detail="O preço do produto não pode ser negativo")

    product = CRMProduct(
        client_id=client_id,
        name=name_clean,
        description=payload.description.strip() if payload.description else None,
        price=price_val,
        is_active=payload.is_active if payload.is_active is not None else True
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    logger.info(f"📦 Produto '{product.name}' (R$ {product.price}) criado para client_id={client_id}")
    return product


@router.put("/{product_id}", response_model=schemas_crm.CRMProductResponse)
def update_product(
    product_id: int,
    payload: schemas_crm.CRMProductUpdate,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Atualiza os dados de um produto existente (nome, preço ou descrição)."""
    product = db.query(CRMProduct).filter(
        CRMProduct.id == product_id,
        CRMProduct.client_id == client_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    if payload.name is not None:
        name_clean = payload.name.strip()
        if not name_clean:
            raise HTTPException(status_code=400, detail="Nome do produto não pode ser vazio")
        product.name = name_clean

    if payload.price is not None:
        price_val = float(payload.price)
        if price_val < 0.0:
            raise HTTPException(status_code=400, detail="O preço não pode ser negativo")
        product.price = price_val

    if payload.description is not None:
        product.description = payload.description.strip() if payload.description else None

    if payload.is_active is not None:
        product.is_active = payload.is_active

    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    logger.info(f"📦 Produto #{product.id} '{product.name}' atualizado (client_id={client_id})")
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    client_id: int = Depends(get_client_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Exclui um produto do catálogo do CRM."""
    product = db.query(CRMProduct).filter(
        CRMProduct.id == product_id,
        CRMProduct.client_id == client_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    db.delete(product)
    db.commit()
    logger.info(f"🗑️ Produto #{product_id} excluído com sucesso (client_id={client_id})")
    return {"message": "Produto excluído com sucesso"}
