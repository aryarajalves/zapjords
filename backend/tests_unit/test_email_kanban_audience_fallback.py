# -*- coding: utf-8 -*-
"""Testes unitários para o fallback de busca de e-mail na aba Contatos ao selecionar audiência do Kanban."""

import pytest
import models
from services.email_audience_service import resolve_kanban_audience_contacts


def test_kanban_audience_uses_contact_tab_email_fallback_by_phone(db_session):
    db = db_session
    client = models.Client(name="Cliente Kanban Email Fallback")
    other_client = models.Client(name="Outro Cliente Isolado")
    db.add_all([client, other_client])
    db.flush()

    pipeline = models.SalesPipeline(client_id=client.id, name="AstroWake")
    db.add(pipeline)
    db.flush()

    stage = models.SalesPipelineStage(
        pipeline_id=pipeline.id,
        client_id=client.id,
        name="Venda",
        stage_type="won",
        order_index=1,
    )
    db.add(stage)
    db.flush()

    # Contato na aba Contatos (WebhookLead) com e-mail, cujo card no Kanban veio sem e-mail
    lead_sem_9 = models.WebhookLead(
        client_id=client.id,
        name="Maria Contato",
        phone="556499389724",
        email="maria.contato@gmail.com",
        product_name="AstroWake",
    )
    # Contato de OUTRO cliente com mesmo telefone (não pode vazar!)
    lead_outro = models.WebhookLead(
        client_id=other_client.id,
        name="Outro",
        phone="5511999998888",
        email="vazado@outro.com",
    )
    db.add_all([lead_sem_9, lead_outro])

    # Deal 1: já tem e-mail próprio no card
    deal_com_email = models.SalesDeal(
        client_id=client.id,
        pipeline_id=pipeline.id,
        stage_id=stage.id,
        title="João",
        contact_name="João Card",
        contact_email="joao@card.com",
        contact_phone="5511988887777",
    )
    # Deal 2: sem e-mail no card, mas telefone bate com WebhookLead (com 9º dígito extra)
    deal_sem_email = models.SalesDeal(
        client_id=client.id,
        pipeline_id=pipeline.id,
        stage_id=stage.id,
        title="Maria Kanban",
        contact_name="Maria Kanban",
        contact_email="",
        contact_phone="(64) 99938-9724",
    )
    # Deal 3: sem e-mail no card e telefone só existe em outro client_id
    deal_outro_cliente = models.SalesDeal(
        client_id=client.id,
        pipeline_id=pipeline.id,
        stage_id=stage.id,
        title="Sem Email",
        contact_name="Sem Email",
        contact_email=None,
        contact_phone="5511999998888",
    )
    db.add_all([deal_com_email, deal_sem_email, deal_outro_cliente])
    db.commit()

    contacts = resolve_kanban_audience_contacts(
        db=db,
        client_id=client.id,
        pipeline_id=pipeline.id,
        stage_id=stage.id,
        blocked_emails=set(),
    )

    emails = [c["email"] for c in contacts]
    assert "joao@card.com" in emails
    assert "maria.contato@gmail.com" in emails
    assert "vazado@outro.com" not in emails
    assert len(contacts) == 2


def test_kanban_audience_respects_blocked_and_deduplicates_fallback(db_session):
    db = db_session
    client = models.Client(name="Cliente Blocked Dedup")
    db.add(client)
    db.flush()

    pipeline = models.SalesPipeline(client_id=client.id, name="Funil")
    db.add(pipeline)
    db.flush()

    stage = models.SalesPipelineStage(
        pipeline_id=pipeline.id,
        client_id=client.id,
        name="Venda",
        stage_type="won",
        order_index=1,
    )
    db.add(stage)
    db.flush()

    db.add_all([
        models.WebhookLead(client_id=client.id, name="Ana", phone="5511911112222", email="ana@teste.com"),
        models.WebhookLead(client_id=client.id, name="Bia", phone="5511933334444", email="bia@blocked.com"),
    ])
    db.add_all([
        models.SalesDeal(client_id=client.id, pipeline_id=pipeline.id, stage_id=stage.id, title="Ana 1", contact_phone="5511911112222"),
        models.SalesDeal(client_id=client.id, pipeline_id=pipeline.id, stage_id=stage.id, title="Ana 2", contact_email="ana@teste.com", contact_phone="5511911112222"),
        models.SalesDeal(client_id=client.id, pipeline_id=pipeline.id, stage_id=stage.id, title="Bia", contact_phone="5511933334444"),
    ])
    db.commit()

    contacts = resolve_kanban_audience_contacts(
        db=db,
        client_id=client.id,
        pipeline_id=pipeline.id,
        stage_id=stage.id,
        blocked_emails={"bia@blocked.com"},
    )

    assert [c["email"] for c in contacts] == ["ana@teste.com"]
