import models
from services.crm_service import sync_stage_contacts_by_tag, process_tag_applied_for_crm


def test_sync_stage_contacts_by_tag_creates_and_moves_deals_to_won_stage(db_session):
    client = models.Client(name="Cliente CRM Tag")
    db_session.add(client)
    db_session.commit()
    db_session.refresh(client)

    pipeline = models.SalesPipeline(
        client_id=client.id,
        name="Pipeline AstroWake",
        default_value=297.0,
    )
    db_session.add(pipeline)
    db_session.commit()
    db_session.refresh(pipeline)

    stage_inicial = models.SalesPipelineStage(
        pipeline_id=pipeline.id,
        client_id=client.id,
        name="Lead",
        order_index=0,
        stage_type="initial",
    )
    stage_venda = models.SalesPipelineStage(
        pipeline_id=pipeline.id,
        client_id=client.id,
        name="Venda",
        order_index=1,
        stage_type="won",
        contact_tag_trigger="Compra Aprovada",
    )
    db_session.add_all([stage_inicial, stage_venda])
    db_session.commit()
    db_session.refresh(stage_inicial)
    db_session.refresh(stage_venda)

    lead_novo = models.WebhookLead(
        client_id=client.id,
        phone="5511999990001",
        name="Aluno Novo",
        email="novo@teste.com",
        tags="lead, compra aprovada, vip",
    )
    lead_existente = models.WebhookLead(
        client_id=client.id,
        phone="5511999990002",
        name="Aluno Movido",
        email="movido@teste.com",
        tags="Compra Aprovada",
    )
    lead_substring = models.WebhookLead(
        client_id=client.id,
        phone="5511999990003",
        name="Nao Deve Entrar",
        email="sub@teste.com",
        tags="compra aprovada antiga",
    )
    db_session.add_all([lead_novo, lead_existente, lead_substring])
    db_session.commit()

    deal_existente = models.SalesDeal(
        client_id=client.id,
        pipeline_id=pipeline.id,
        stage_id=stage_inicial.id,
        contact_phone="5511999990002",
        contact_name="Aluno Movido",
        status="open",
    )
    db_session.add(deal_existente)
    db_session.commit()

    res = sync_stage_contacts_by_tag(db_session, client.id, stage_venda)
    assert res == {"created": 1, "moved": 1}

    deals = db_session.query(models.SalesDeal).filter_by(pipeline_id=pipeline.id).all()
    assert len(deals) == 2

    by_phone = {d.contact_phone: d for d in deals}
    assert by_phone["5511999990001"].stage_id == stage_venda.id
    assert by_phone["5511999990001"].status == "won"
    assert by_phone["5511999990001"].won_at is not None

    assert by_phone["5511999990002"].stage_id == stage_venda.id
    assert by_phone["5511999990002"].status == "won"
    assert by_phone["5511999990002"].won_at is not None


def test_process_tag_applied_for_crm_moves_contact_directly_to_tagged_stage(db_session):
    client = models.Client(name="Cliente Tag Direta")
    db_session.add(client)
    db_session.commit()
    db_session.refresh(client)

    pipeline = models.SalesPipeline(
        client_id=client.id,
        name="Pipeline Vendas",
        default_value=197.0,
    )
    db_session.add(pipeline)
    db_session.commit()
    db_session.refresh(pipeline)

    stage_venda = models.SalesPipelineStage(
        pipeline_id=pipeline.id,
        client_id=client.id,
        name="Venda Concluída",
        order_index=0,
        stage_type="won",
        contact_tag_trigger="comprou_astrowake",
    )
    db_session.add(stage_venda)
    db_session.commit()
    db_session.refresh(stage_venda)

    process_tag_applied_for_crm(
        db=db_session,
        client_id=client.id,
        phone="5511988887777",
        name="Maria Estrela",
        tag="comprou_astrowake",
    )

    deal = db_session.query(models.SalesDeal).filter_by(
        pipeline_id=pipeline.id,
        contact_phone="5511988887777",
    ).first()
    assert deal is not None
    assert deal.stage_id == stage_venda.id
    assert deal.status == "won"
    assert deal.won_at is not None
