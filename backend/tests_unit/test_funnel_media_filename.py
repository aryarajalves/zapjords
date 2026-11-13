import pytest
from unittest.mock import MagicMock, patch, AsyncMock
import models
from core.engine.nodes.media import handle_media_node
from routers.funnels import list_funnels


@pytest.mark.asyncio
async def test_handle_media_node_resolves_uuid_filename_from_uploaded_media():
    """
    Testa se o nó de mídia do funil converte um fileName com UUID (unique_name)
    para o nome original salvo em UploadedMedia ao enviar documento pela Meta API
    e ao sincronizar com o Chat Local.
    """
    trigger = models.ScheduledTrigger(
        id=501,
        client_id=1,
        contact_phone="5585998259497",
        contact_name="Aryaraj",
        is_interaction=True
    )
    funnel = models.Funnel(id=10, client_id=1, name="Funil Black Friday")
    node = {
        "id": "node-doc-1",
        "type": "mediaNode",
        "data": {
            "mediaUrl": "https://cdn.example.com/7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
            "fileName": "7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
            "mediaType": "document",
            "caption": "Segue o material completo"
        }
    }

    uploaded_media = models.UploadedMedia(
        id=1,
        client_id=1,
        filename="comunidade.pdf",
        unique_name="7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
        url="https://cdn.example.com/7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
        media_type="DOCUMENT"
    )

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = uploaded_media

    mock_chatwoot = MagicMock()
    mock_chatwoot.send_document_official = AsyncMock(return_value={"messages": [{"id": "wamid.DOC999"}]})

    with patch("core.engine.nodes.media.validate_media_url", new_callable=AsyncMock, return_value=(True, None)), \
         patch("core.engine.nodes.media.log_node_execution"), \
         patch("core.engine.nodes.media.publish_node_external_event", new_callable=AsyncMock), \
         patch("core.engine.sync_utils.sync_message_to_local_chat", new_callable=AsyncMock) as mock_sync_local, \
         patch("storage.storage.get_public_url", side_effect=lambda u: u):

        res = await handle_media_node(
            db=mock_db,
            trigger=trigger,
            node=node,
            chatwoot=mock_chatwoot,
            conversation_id=None,
            contact_phone="5585998259497",
            apply_vars_func=lambda s: s,
            funnel=funnel
        )

        assert res["status"] == "continue"
        mock_chatwoot.send_document_official.assert_called_once_with(
            "5585998259497",
            "https://cdn.example.com/7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
            caption="Segue o material completo",
            filename="comunidade.pdf"
        )
        mock_sync_local.assert_called_once()
        sync_kwargs = mock_sync_local.call_args.kwargs
        assert sync_kwargs["meta_data"] == {"filename": "comunidade.pdf"}
        assert sync_kwargs["content"] == "Segue o material completo"


def test_list_funnels_enriches_uuid_filename_in_media_nodes():
    """
    Testa se list_funnels substitui automaticamente o fileName em formato UUID
    pelo nome original do arquivo registrado em UploadedMedia.
    """
    funnel = models.Funnel(
        id=20,
        client_id=1,
        name="Funil Com Documento UUID",
        is_archived=False,
        is_pinned=False,
        steps={
            "nodes": [
                {
                    "id": "n1",
                    "type": "mediaNode",
                    "data": {
                        "mediaUrl": "https://cdn.example.com/7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
                        "fileName": "7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
                        "mediaType": "document"
                    }
                }
            ],
            "edges": []
        }
    )

    uploaded_media = models.UploadedMedia(
        id=2,
        client_id=1,
        filename="comunidade.pdf",
        unique_name="7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
        url="https://cdn.example.com/7b73f61f-6762-4697-aaa8-14f97abdcbb1.pdf",
        media_type="DOCUMENT"
    )

    mock_db = MagicMock()

    def query_side_effect(model):
        q = MagicMock()
        if model == models.Funnel:
            q.filter.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [funnel]
            return q
        elif model == models.UploadedMedia:
            q.filter.return_value.first.return_value = uploaded_media
            return q
        return q

    mock_db.query.side_effect = query_side_effect
    mock_user = models.User(id=1, email="admin@test.com", role="super_admin")

    result = list_funnels(skip=0, limit=100, is_archived=False, x_client_id=1, db=mock_db, current_user=mock_user)

    assert len(result) == 1
    assert result[0].steps["nodes"][0]["data"]["fileName"] == "comunidade.pdf"
