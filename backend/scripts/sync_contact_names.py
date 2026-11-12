import sys
import os

# Adiciona o diretório do backend ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
import models
from services.utils.contact_name_helpers import (
    is_generic_or_phone_name,
    find_best_contact_name_for_phone
)

def run_sync():
    db = SessionLocal()
    try:
        print("🔍 Iniciando sincronização e correção de nomes em chat_conversations...")
        convos = db.query(models.ChatConversation).all()
        fixed_convos = 0

        for c in convos:
            if is_generic_or_phone_name(c.contact_name):
                best_name = find_best_contact_name_for_phone(db, c.client_id, c.phone)
                if best_name and not is_generic_or_phone_name(best_name):
                    old_name = c.contact_name
                    c.contact_name = best_name
                    fixed_convos += 1
                    print(f"  [CONVERSA #{c.id}] Telefone: {c.phone} | Antigo: '{old_name}' -> Novo: '{best_name}'")

        print(f"\n🔍 Verificando leads em webhook_leads com nomes numéricos/genéricos...")
        leads = db.query(models.WebhookLead).all()
        fixed_leads = 0

        for ld in leads:
            if is_generic_or_phone_name(ld.name):
                # Tenta achar nome na conversa correspondente
                suffix8 = ld.phone[-8:] if len(ld.phone) >= 8 else ld.phone
                convo_match = db.query(models.ChatConversation).filter(
                    models.ChatConversation.client_id == ld.client_id,
                    models.ChatConversation.phone.like(f"%{suffix8}")
                ).first()
                if convo_match and convo_match.contact_name and not is_generic_or_phone_name(convo_match.contact_name):
                    old_name = ld.name
                    ld.name = convo_match.contact_name.strip()
                    fixed_leads += 1
                    print(f"  [LEAD #{ld.id}] Telefone: {ld.phone} | Antigo: '{old_name}' -> Novo: '{ld.name}'")

        db.commit()
        print(f"\n✅ Sincronização concluída com sucesso!")
        print(f"   - Conversas atualizadas: {fixed_convos}")
        print(f"   - Leads atualizados: {fixed_leads}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro durante a sincronização: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_sync()
