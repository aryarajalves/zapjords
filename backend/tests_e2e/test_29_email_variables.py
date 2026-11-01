import sys
import os
import pytest
import asyncio
from unittest.mock import MagicMock, patch

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test_secret_key_1234567890_super_long_32chars"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from services.email_service import send_single_email

class DummyConfig:
    def __init__(self):
        self.provider = "smtp"
        self.from_email = "remetente@zapvoice.com"
        self.from_name = "ZapVoice Teste"
        self.smtp_host = "smtp.test.com"
        self.smtp_port = 587
        self.smtp_user = "user"
        self.smtp_password = "pass"
        self.smtp_encryption = "tls"

@pytest.mark.asyncio
async def test_email_variable_replacements():
    config = DummyConfig()

    contact_data = {
        "name": "Maria Silva",
        "email": "maria@cliente.com",
        "phone": "5511988887777",
        "product_name": "Mentoria Premium",
        "platform": "Kiwify",
        "price": "R$ 497,00",
        "payment_method": "PIX",
        "tags": "VIP, Comprador"
    }

    body_template = "<p>Olá {{primeiro_nome}} (completo: {{nome}}), seu e-mail é {{email}} e comprou {{produto}} na plataforma {{plataforma}} por {{valor}} via {{forma_pagamento}}. Tags: {{etiquetas}}.</p>"
    subject_template = "Parabéns {{primeiro_nome}}, seu produto {{produto}} está disponível!"

    with patch("smtplib.SMTP") as mock_smtp:
        mock_instance = MagicMock()
        mock_smtp.return_value = mock_instance

        res = await send_single_email(
            config=config,
            to_email="maria@cliente.com",
            subject=subject_template,
            body_html=body_template,
            recipient_name=contact_data
        )

        assert res["success"] is True
        args, kwargs = mock_instance.sendmail.call_args
        raw_msg = args[2]

        import base64
        # Decodifica base64 caso o corpo HTML tenha sido encodado pelo MIMEText
        decoded_msg = raw_msg
        for line in raw_msg.splitlines():
            try:
                decoded_bytes = base64.b64decode(line.strip())
                decoded_str = decoded_bytes.decode('utf-8', errors='ignore')
                decoded_msg += "\n" + decoded_str
            except Exception:
                pass

        # Valida que primeiro_nome e nome completo foram devidamente substituídos
        assert "Maria" in raw_msg or "Maria" in decoded_msg
        assert "Maria Silva" in decoded_msg
        assert "maria@cliente.com" in raw_msg or "maria@cliente.com" in decoded_msg
        assert "Mentoria Premium" in decoded_msg
