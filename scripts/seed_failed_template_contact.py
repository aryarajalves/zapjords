from database import SessionLocal
import models
from datetime import datetime, timezone

def seed_failed_template_contact():
    db = SessionLocal()
    try:
        # Template body matching screenshot
        template_name = "recuperacao_responderdepois_kanban"
        tpl_body = "Fala {{1}} tudo bem? Tive um volume imenso de pessoas para responder e consegui chegar na nossa conversa somente agora. Tenho algo pra vc, consegue me dar um alô assim que possível?"
        
        # Ensure template cache exists for clients 1 and 14
        for cid in [1, 14]:
            tpl = db.query(models.WhatsAppTemplateCache).filter(
                models.WhatsAppTemplateCache.client_id == cid,
                models.WhatsAppTemplateCache.name == template_name
            ).first()
            if not tpl:
                tpl = models.WhatsAppTemplateCache(
                    client_id=cid,
                    name=template_name,
                    language="pt_BR",
                    category="MARKETING",
                    body=tpl_body,
                    components=[
                        {
                            "type": "BODY",
                            "text": tpl_body
                        }
                    ]
                )
                db.add(tpl)
                db.commit()
                print(f"Template {template_name} criado no cache para client_id {cid}")
            else:
                tpl.body = tpl_body
                db.commit()
                print(f"Template {template_name} atualizado no cache para client_id {cid}")

        # Ensure contact / conversation with failed template exists for clients 1 and 14
        phone = "5522981820807"
        contact_name = "Lucas Jordão"
        failure_msg_content = "Fala 5522981820807 tudo bem? Tive um volume imenso de pessoas para responder e consegui chegar na nossa conversa somente agora. Tenho algo pra vc, consegue me dar um alô assim que possível?"
        meta_failure = {
            "is_template": True,
            "template_name": template_name,
            "status": "failed",
            "failure_reason": "(#132000) Number of parameters does not match the expected number of params",
            "can_retry": True,
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": "5522981820807"}
                    ]
                }
            ]
        }

        for cid in [1, 14]:
            # Create or update WebhookLead
            lead = db.query(models.WebhookLead).filter(
                models.WebhookLead.client_id == cid,
                models.WebhookLead.phone == phone
            ).first()
            if not lead:
                lead = models.WebhookLead(
                    client_id=cid,
                    name=contact_name,
                    phone=phone,
                    email="lucasjordao@teste.com"
                )
                db.add(lead)
                db.commit()
                db.refresh(lead)

            # Create or update ChatConversation
            convo = db.query(models.ChatConversation).filter(
                models.ChatConversation.client_id == cid,
                models.ChatConversation.phone == phone
            ).first()

            now = datetime.now(timezone.utc)
            if not convo:
                convo = models.ChatConversation(
                    client_id=cid,
                    contact_name=contact_name,
                    phone=phone,
                    status="open",
                    unread_count=1,
                    last_message_content=failure_msg_content,
                    last_message_at=now,
                    created_at=now
                )
                db.add(convo)
                db.commit()
                db.refresh(convo)
            else:
                convo.contact_name = contact_name
                convo.last_message_content = failure_msg_content
                convo.last_message_at = now
                convo.unread_count = 1
                db.commit()

            # Add the failed template message
            failed_msg = models.ChatMessage(
                conversation_id=convo.id,
                user_id=1,
                sender_type="user",
                message_type="text",
                content=failure_msg_content,
                meta_data=meta_failure,
                timestamp=now
            )
            db.add(failed_msg)
            db.commit()
            db.refresh(failed_msg)
            print(f"Mensagem de falha #{failed_msg.id} inserida na conversa #{convo.id} (client_id {cid})")

        print("Seed concluído com sucesso!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_failed_template_contact()
