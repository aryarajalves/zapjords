import pytest
import os
import sys
from datetime import datetime, timezone
from unittest.mock import patch, AsyncMock
from fastapi import HTTPException

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ["DATABASE_URL"] = "sqlite://"

import models
from routers.chat.message_routes import list_conversation_media, send_chat_media_message

mock_user = models.User(id=1, email="test@test.com", client_id=1, is_active=True)

@pytest.fixture
def db_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    db_file = "test_temp_media_chat.db"
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass
            
    engine = create_engine(f"sqlite:///{db_file}", connect_args={"check_same_thread": False})
    models.Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    yield db
    
    db.close()
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass

@pytest.mark.asyncio
async def test_list_conversation_media_success(db_session):
    # Criar conversa
    convo = models.ChatConversation(
        client_id=1,
        phone="5585996123586",
        contact_name="Cliente Mídias",
        status="open"
    )
    db_session.add(convo)
    db_session.commit()
    db_session.refresh(convo)

    # Mensagem 1: Imagem
    msg_img = models.ChatMessage(
        conversation_id=convo.id,
        sender_type="contact",
        message_type="image",
        content="Olha a foto",
        media_url="https://example.com/foto.jpg",
        timestamp=datetime.now(timezone.utc)
    )
    # Mensagem 2: Documento
    msg_doc = models.ChatMessage(
        conversation_id=convo.id,
        sender_type="user",
        message_type="document",
        content="Segue o contrato",
        media_url="https://example.com/contrato.pdf",
        meta_data={"filename": "contrato.pdf"},
        timestamp=datetime.now(timezone.utc)
    )
    # Mensagem 3: Texto com Link
    msg_link = models.ChatMessage(
        conversation_id=convo.id,
        sender_type="contact",
        message_type="text",
        content="Acesse nosso site https://zapvoice.com.br e veja mais!",
        timestamp=datetime.now(timezone.utc)
    )

    db_session.add_all([msg_img, msg_doc, msg_link])
    db_session.commit()

    res = await list_conversation_media(
        conversation_id=convo.id,
        client_id=1,
        current_user=mock_user,
        db=db_session
    )

    assert res["total_media"] == 1
    assert res["total_docs"] == 1
    assert res["total_links"] == 1
    assert res["total_all"] == 3
    assert res["media"][0]["type"] == "image"
    assert res["docs"][0]["filename"] == "contrato.pdf"
    assert res["links"][0]["url"] == "https://zapvoice.com.br"

@pytest.mark.asyncio
async def test_list_conversation_media_not_found(db_session):
    with pytest.raises(HTTPException) as exc_info:
        await list_conversation_media(
            conversation_id=999999,
            client_id=1,
            current_user=mock_user,
            db=db_session
        )
    assert exc_info.value.status_code == 404

@pytest.mark.asyncio
@patch("routers.chat.message_routes.upload_media_to_meta_from_url", new_callable=AsyncMock)
@patch("routers.chat.message_routes._get_whatsapp_client")
@patch("rabbitmq_client.rabbitmq.publish_event", new_callable=AsyncMock)
async def test_send_chat_media_message_broadcasts_websocket(mock_publish, mock_get_wa, mock_upload_meta, db_session):
    # Criar conversa com janela de 24h aberta
    convo = models.ChatConversation(
        client_id=1,
        phone="5585996123586",
        contact_name="Cliente Mídias",
        status="open",
        last_contact_message_at=datetime.now(timezone.utc)
    )
    db_session.add(convo)
    db_session.commit()
    db_session.refresh(convo)

    mock_upload_meta.return_value = "meta_media_123"
    mock_wa = AsyncMock()
    mock_wa._meta_request.return_value = {"messages": [{"id": "wamid_media_123"}]}
    mock_get_wa.return_value = mock_wa

    payload = {
        "media_url": "/static/uploads/nova_imagem.png",
        "message_type": "image",
        "caption": "Foto de teste"
    }

    res = await send_chat_media_message(
        conversation_id=convo.id,
        payload=payload,
        client_id=1,
        current_user=mock_user,
        db=db_session
    )

    assert res["id"] is not None
    assert res["media_url"] == "/static/uploads/nova_imagem.png"
    assert res["message_type"] == "image"
    assert mock_publish.called is True
    assert mock_publish.call_args[0][0] == "new_message"
    assert mock_publish.call_args[0][1]["media_url"] == "/static/uploads/nova_imagem.png"
    assert mock_publish.call_args[0][1]["conversation_id"] == convo.id


@pytest.mark.asyncio
async def test_list_conversation_media_template_messages_resolution(db_session):
    # Criar template no cache (com id explícito para SQLite)
    tmpl_cache = models.WhatsAppTemplateCache(
        id=999888777,
        client_id=1,
        name="template_com_video_header",
        language="pt_BR",
        category="MARKETING",
        body="Olá, veja este vídeo especial",
        components=[
            {
                "type": "HEADER",
                "format": "VIDEO",
                "example": {
                    "header_handle": ["https://whatsapp.net/video_cache_sample.mp4"]
                }
            },
            {
                "type": "BODY",
                "text": "Olá, veja este vídeo especial"
            }
        ]
    )
    db_session.add(tmpl_cache)
    db_session.commit()

    # Criar conversa
    convo = models.ChatConversation(
        client_id=1,
        phone="5585991112233",
        contact_name="Lead Template",
        status="open"
    )
    db_session.add(convo)
    db_session.commit()
    db_session.refresh(convo)

    # 1. Mensagem de template com URL de vídeo direta
    msg_template_video = models.ChatMessage(
        conversation_id=convo.id,
        sender_type="user",
        message_type="template",
        content="Vídeo de boas vindas",
        media_url="https://s3.backblaze.com/video_apresentacao.mp4",
        meta_data={
            "is_template": True,
            "template_name": "video_direto",
            "header": {"format": "VIDEO"}
        },
        timestamp=datetime.now(timezone.utc)
    )

    # 2. Mensagem de template com documento PDF
    msg_template_doc = models.ChatMessage(
        conversation_id=convo.id,
        sender_type="user",
        message_type="template",
        content="E-book gratuito anexo",
        media_url="https://api.zapvoice.com/proxy/ebook_astrologia.pdf",
        meta_data={
            "is_template": True,
            "template_name": "ebook_template",
            "header": {"format": "DOCUMENT"},
            "filename": "ebook_astrologia.pdf"
        },
        timestamp=datetime.now(timezone.utc)
    )

    # 3. Mensagem de template sem media_url no ChatMessage, mas com template_name existente no cache
    msg_template_from_cache = models.ChatMessage(
        conversation_id=convo.id,
        sender_type="user",
        message_type="template",
        content="Convite pelo cache",
        media_url=None,
        meta_data={
            "is_template": True,
            "template_name": "template_com_video_header"
        },
        timestamp=datetime.now(timezone.utc)
    )

    db_session.add_all([msg_template_video, msg_template_doc, msg_template_from_cache])
    db_session.commit()

    res = await list_conversation_media(
        conversation_id=convo.id,
        client_id=1,
        current_user=mock_user,
        db=db_session
    )

    # Deve conter 2 itens em media (os dois vídeos) e 1 em docs (o pdf)
    assert res["total_media"] == 2
    assert res["total_docs"] == 1
    assert res["total_all"] == 3

    # Validar tipos resolvidos em media
    media_urls = [m["url"] for m in res["media"]]
    media_types = [m["type"] for m in res["media"]]
    assert "https://s3.backblaze.com/video_apresentacao.mp4" in media_urls
    assert "https://whatsapp.net/video_cache_sample.mp4" in media_urls
    assert all(t == "video" for t in media_types)

    # Validar documento resolvido
    assert res["docs"][0]["type"] == "document"
    assert res["docs"][0]["url"] == "https://api.zapvoice.com/proxy/ebook_astrologia.pdf"

