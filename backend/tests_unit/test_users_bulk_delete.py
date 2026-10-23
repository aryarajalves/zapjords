import pytest
import os
import sys
from unittest.mock import AsyncMock, patch

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ["DATABASE_URL"] = "sqlite://"

from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from database import Base
from models import User, Client, PasswordResetToken, ApiKey, user_clients
from core.security import get_password_hash, create_access_token
from core.deps import get_db

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture
def client_app(db):
    from main import app

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with patch("worker.start_worker", new_callable=AsyncMock), \
         patch("rabbitmq_client.RabbitMQClient.connect", new_callable=AsyncMock):
        with TestClient(app) as c:
            yield c
    app.dependency_overrides.clear()


@pytest.fixture
def super_admin(db):
    existing = db.query(User).filter(User.email == "master_superadmin@test.com").first()
    if existing:
        return existing
    client = Client(name="TestClient_BulkDelete")
    db.add(client)
    db.commit()
    user = User(
        email="master_superadmin@test.com",
        hashed_password=get_password_hash("MasterPass123!@#"),
        full_name="Master Super Admin",
        role="super_admin",
        is_active=True,
        client_id=client.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(super_admin):
    token = create_access_token({"sub": super_admin.email, "role": super_admin.role})
    return {"Authorization": f"Bearer {token}"}


# ── Testes de Proteção do Super Admin ─────────────────────────────────────────

def test_single_delete_super_admin_forbidden(client_app, auth_headers, super_admin):
    """Deletar o Super Admin individualmente é estritamente proibido."""
    resp = client_app.delete(f"/api/auth/users/{super_admin.id}", headers=auth_headers)
    assert resp.status_code == 400
    assert "Super Administrador não pode ser excluído" in resp.json()["detail"] or "própria conta" in resp.json()["detail"]


# ── Testes de Deleção em Lote (Bulk Delete) ───────────────────────────────────

@patch("websocket_manager.manager.broadcast", new_callable=AsyncMock)
def test_bulk_delete_users_success(mock_ws, client_app, auth_headers, db, super_admin):
    """Exclusão de múltiplos usuários simultaneamente ignorando o Super Admin."""
    client = db.query(Client).first()
    
    # Cria 3 usuários normais
    u1 = User(email="bulk1@test.com", hashed_password=get_password_hash("Pass123!"), full_name="User 1", role="admin", client_id=client.id)
    u2 = User(email="bulk2@test.com", hashed_password=get_password_hash("Pass123!"), full_name="User 2", role="vendedor", client_id=client.id)
    u3 = User(email="bulk3@test.com", hashed_password=get_password_hash("Pass123!"), full_name="User 3", role="user", client_id=client.id)
    db.add_all([u1, u2, u3])
    db.commit()

    # Tenta excluir u1, u2 e acidentalmente inclui o super_admin.id
    payload = {"user_ids": [u1.id, u2.id, super_admin.id]}

    resp = client_app.post("/api/auth/users/bulk-delete", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["deleted_count"] == 2
    assert u1.id in data["deleted_ids"]
    assert u2.id in data["deleted_ids"]
    assert super_admin.id not in data["deleted_ids"]

    # Verifica no banco que u1 e u2 foram removidos, mas super_admin e u3 continuam intactos
    assert db.query(User).filter(User.id == u1.id).first() is None
    assert db.query(User).filter(User.id == u2.id).first() is None
    assert db.query(User).filter(User.id == super_admin.id).first() is not None
    assert db.query(User).filter(User.id == u3.id).first() is not None


def test_bulk_delete_empty_ids_fails(client_app, auth_headers):
    """Payload com lista vazia retorna 400."""
    resp = client_app.post("/api/auth/users/bulk-delete", json={"user_ids": []}, headers=auth_headers)
    assert resp.status_code == 400
    assert "Nenhum ID" in resp.json()["detail"]


def test_bulk_delete_only_super_admin_fails(client_app, auth_headers, super_admin):
    """Se tentar deletar apenas o Super Admin em lote, deve ser rejeitado com 400."""
    resp = client_app.post("/api/auth/users/bulk-delete", json={"user_ids": [super_admin.id]}, headers=auth_headers)
    assert resp.status_code == 400
    assert "Super Admin não pode ser excluído" in resp.json()["detail"]


def test_bulk_delete_user_with_password_reset_token_and_api_keys(client_app, db, auth_headers, super_admin):
    """
    Valida que ao excluir múltiplos usuários que possuem PasswordResetToken e ApiKey vinculados,
    a exclusão em lote conclui com sucesso sem erro de NotNullViolation em user_id.
    """
    client = db.query(Client).first()
    """
    Valida que ao excluir múltiplos usuários que possuem PasswordResetToken e ApiKey vinculados,
    a exclusão em lote conclui com sucesso sem erro de NotNullViolation em user_id.
    """
    import uuid
    # Cria 2 usuários
    u1 = User(email="has_token1@test.com", hashed_password=get_password_hash("Pass123!"), full_name="User Token 1", role="admin", client_id=client.id)
    u2 = User(email="has_token2@test.com", hashed_password=get_password_hash("Pass123!"), full_name="User Token 2", role="vendedor", client_id=client.id)
    db.add_all([u1, u2])
    db.commit()

    # Adiciona PasswordResetToken para u1 e u2
    t1 = PasswordResetToken(token=str(uuid.uuid4()), user_id=u1.id, is_used=False)
    t2 = PasswordResetToken(token=str(uuid.uuid4()), user_id=u2.id, is_used=False)
    # Adiciona ApiKey para u1
    k1 = ApiKey(client_id=client.id, user_id=u1.id, name="Test Key", token_prefix="zp_test", token_hash=str(uuid.uuid4()))
    # Adiciona associação user_clients
    db.add_all([t1, t2, k1])
    db.execute(user_clients.insert().values(user_id=u1.id, client_id=client.id))
    db.execute(user_clients.insert().values(user_id=u2.id, client_id=client.id))
    db.commit()

    # Executa exclusão em lote
    resp = client_app.post("/api/auth/users/bulk-delete", json={"user_ids": [u1.id, u2.id]}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["deleted_count"] == 2
    assert u1.id in data["deleted_ids"]
    assert u2.id in data["deleted_ids"]

    # Verifica que usuários e tokens foram completamente removidos
    assert db.query(User).filter(User.id.in_([u1.id, u2.id])).count() == 0
    assert db.query(PasswordResetToken).filter(PasswordResetToken.user_id.in_([u1.id, u2.id])).count() == 0
    assert db.query(ApiKey).filter(ApiKey.user_id == u1.id).count() == 0
