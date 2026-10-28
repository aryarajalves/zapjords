import pytest
from sqlalchemy.orm import Session
import models
from routers.chat.conversation_modules.conversation_filter_helpers import build_conversation_filter_query
from routers.chat.conversation_modules.list_routes import list_conversations

@pytest.mark.asyncio
async def test_filter_conversations_no_pipeline(db_session: Session):
    db = db_session
    # Setup client
    client = models.Client(name="Cliente Teste Pipeline")
    db.add(client)
    db.commit()
    db.refresh(client)

    # Setup 2 pipelines
    pipe1 = models.SalesPipeline(client_id=client.id, name="Pipeline Vendas", is_default=True)
    pipe2 = models.SalesPipeline(client_id=client.id, name="Pipeline Suporte", is_default=False)
    db.add_all([pipe1, pipe2])
    db.commit()

    stage1 = models.SalesPipelineStage(client_id=client.id, pipeline_id=pipe1.id, name="Lead", order_index=0)
    stage2 = models.SalesPipelineStage(client_id=client.id, pipeline_id=pipe2.id, name="Atendimento", order_index=0)
    db.add_all([stage1, stage2])
    db.commit()

    # Setup 3 conversations
    c1 = models.ChatConversation(client_id=client.id, phone="5511999990001", contact_name="Contato Com Deal Pipe 1")
    c2 = models.ChatConversation(client_id=client.id, phone="5511999990002", contact_name="Contato Com Deal Pipe 2")
    c3 = models.ChatConversation(client_id=client.id, phone="5511999990003", contact_name="Contato Sem Deal Nenhum")
    db.add_all([c1, c2, c3])
    db.commit()

    # Deal 1 on Pipe 1 for Contact 1
    deal1 = models.SalesDeal(
        client_id=client.id,
        pipeline_id=pipe1.id,
        stage_id=stage1.id,
        contact_phone="5511999990001",
        contact_name="Contato Com Deal Pipe 1"
    )
    # Deal 2 on Pipe 2 for Contact 2
    deal2 = models.SalesDeal(
        client_id=client.id,
        pipeline_id=pipe2.id,
        stage_id=stage2.id,
        contact_phone="5511999990002",
        contact_name="Contato Com Deal Pipe 2"
    )
    db.add_all([deal1, deal2])
    db.commit()

    # Test 1: Sem filtro -> retorna todas as 3 conversas
    q_all = build_conversation_filter_query(db=db, client_id=client.id, status="all")
    assert q_all.count() == 3

    # Test 2: no_pipeline=True -> deve retornar APENAS Convo 3 (que não tem nenhum deal)
    q_no_pipe = build_conversation_filter_query(db=db, client_id=client.id, status="all", no_pipeline=True)
    results_no_pipe = q_no_pipe.all()
    assert len(results_no_pipe) == 1
    assert results_no_pipe[0].phone == "5511999990003"

    # Test 3: not_in_pipeline_id=pipe1.id -> deve retornar Convo 2 e Convo 3 (excluindo apenas Convo 1)
    q_not_pipe1 = build_conversation_filter_query(db=db, client_id=client.id, status="all", not_in_pipeline_id=pipe1.id)
    results_not_pipe1 = q_not_pipe1.all()
    phones_not_pipe1 = {c.phone for c in results_not_pipe1}
    assert len(results_not_pipe1) == 2
    assert "5511999990002" in phones_not_pipe1
    assert "5511999990003" in phones_not_pipe1
    assert "5511999990001" not in phones_not_pipe1

    # Test 4: not_in_pipeline_id=pipe2.id -> deve retornar Convo 1 e Convo 3 (excluindo apenas Convo 2)
    q_not_pipe2 = build_conversation_filter_query(db=db, client_id=client.id, status="all", not_in_pipeline_id=pipe2.id)
    results_not_pipe2 = q_not_pipe2.all()
    phones_not_pipe2 = {c.phone for c in results_not_pipe2}
    assert len(results_not_pipe2) == 2
    assert "5511999990001" in phones_not_pipe2
    assert "5511999990003" in phones_not_pipe2
    assert "5511999990002" not in phones_not_pipe2

@pytest.mark.asyncio
async def test_list_conversations_endpoint_pipeline_filter(db_session: Session):
    db = db_session
    client = models.Client(name="Cliente Route Test")
    db.add(client)
    db.commit()
    db.refresh(client)

    pipe = models.SalesPipeline(client_id=client.id, name="Pipe Único")
    db.add(pipe)
    db.commit()
    stage = models.SalesPipelineStage(client_id=client.id, pipeline_id=pipe.id, name="Novo")
    db.add(stage)
    db.commit()

    c1 = models.ChatConversation(client_id=client.id, phone="5511988880001", status="open")
    c2 = models.ChatConversation(client_id=client.id, phone="5511988880002", status="open")
    db.add_all([c1, c2])
    db.commit()

    deal = models.SalesDeal(client_id=client.id, pipeline_id=pipe.id, stage_id=stage.id, contact_phone="5511988880001")
    db.add(deal)
    db.commit()

    user = models.User(email="admin_pipe@test.com", hashed_password="hash", role="admin")
    db.add(user)
    db.commit()

    # Chamada da rota com no_pipeline=True
    res = await list_conversations(
        status="all",
        no_pipeline=True,
        client_id=client.id,
        current_user=user,
        db=db
    )

    assert "conversations" in res
    assert res["total_count"] == 1
    assert res["conversations"][0]["phone"] == "5511988880002"
