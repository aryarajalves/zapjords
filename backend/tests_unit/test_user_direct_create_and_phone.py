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
from models import User, Client
from core.security import get_password_hash, create_access_token, validate_password_strength
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
    existing = db.query(User).filter(User.email == "super_admin_phone@test.com").first()
    if existing:
        return existing
    client = Client(name="TestClient_PhoneAuth")
    db.add(client)
    db.commit()
    user = User(
        email="super_admin_phone@test.com",
        hashed_password=get_password_hash("AdminMaster123!@#"),
        full_name="Super Admin Phone",
        role="super_admin",
        phone="5511999990000",
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


# ── Testes de Validação Rígida de Senha (12+ chars, min, maiusc, num, especial) ──

def test_password_strength_less_than_12_chars():
    is_valid, msg = validate_password_strength("Abc12345!@#")  # 11 chars
    assert is_valid is False
    assert "no mínimo 12 caracteres" in msg


def test_password_strength_missing_lowercase():
    is_valid, msg = validate_password_strength("ABC12345678!@#")  # sem minúscula
    assert is_valid is False
    assert "letra minúscula" in msg


def test_password_strength_missing_uppercase():
    is_valid, msg = validate_password_strength("abc12345678!@#")  # sem maiúscula
    assert is_valid is False
    assert "letra maiúscula" in msg


def test_password_strength_missing_digit():
    is_valid, msg = validate_password_strength("Abcdefghijk!@#")  # sem dígitos
    assert is_valid is False
    assert "pelo menos um número" in msg


def test_password_strength_missing_special_char():
    is_valid, msg = validate_password_strength("Abc123456789xyz")  # sem caractere especial
    assert is_valid is False
    assert "caractere especial" in msg


def test_password_strength_valid_strong_password():
    is_valid, msg = validate_password_strength("SenhaValida2026!@#")
    assert is_valid is True
    assert msg == ""


# ── Testes de Criação Direta com WhatsApp / Phone ──

@patch("websocket_manager.manager.broadcast", new_callable=AsyncMock)
def test_direct_user_creation_with_phone_success(mock_ws, client_app, auth_headers, db):
    """Criação direta de usuário com telefone, sem código de e-mail e com senha forte."""
    payload = {
        "email": "novousuario@zapvoice.com",
        "password": "SenhaValida2026!@#",
        "full_name": "Novo Usuário Teste",
        "phone": "5511988887777",
        "role": "admin"
    }

    resp = client_app.post("/api/auth/register", json=payload, headers=auth_headers)
    assert resp.status_code == 200, f"Erro inesperado: {resp.text}"
    data = resp.json()
    assert data["message"] == "User created successfully"
    assert "user_id" in data

    # Valida no banco de dados que salvou o phone e dados corretos
    user = db.query(User).filter(User.email == "novousuario@zapvoice.com").first()
    assert user is not None
    assert user.phone == "5511988887777"
    assert user.full_name == "Novo Usuário Teste"


@patch("websocket_manager.manager.broadcast", new_callable=AsyncMock)
def test_get_users_returns_phone(mock_ws, client_app, auth_headers):
    """Listagem /api/auth/users deve incluir o campo phone dos usuários."""
    resp = client_app.get("/api/auth/users", headers=auth_headers)
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    target = next((u for u in users if u["email"] == "novousuario@zapvoice.com"), None)
    assert target is not None
    assert target["phone"] == "5511988887777"


@patch("websocket_manager.manager.broadcast", new_callable=AsyncMock)
def test_update_user_phone(mock_ws, client_app, auth_headers, db):
    """Atualização de usuário via PUT /api/auth/users/{user_id} deve persistir novo phone."""
    user = db.query(User).filter(User.email == "novousuario@zapvoice.com").first()
    assert user is not None

    update_payload = {
        "full_name": "Novo Nome Atualizado",
        "phone": "5521977776666"
    }
    resp = client_app.put(f"/api/auth/users/{user.id}", json=update_payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["message"] == "Usuário atualizado com sucesso"

    # Confirmação no banco
    db.refresh(user)
    assert user.phone == "5521977776666"
    assert user.full_name == "Novo Nome Atualizado"
