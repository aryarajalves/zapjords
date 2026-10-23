import os
import sys

# Adiciona o diretório do backend ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from database import SessionLocal
from models.crm import SalesPipeline, SalesPipelineStage, SalesDeal

NEW_DEFAULT_STAGES = [
    {"name": "Prospect", "color": "blue", "stage_type": "initial", "webhook_event_trigger": None, "order_index": 0},
    {"name": "Lead", "color": "cyan", "stage_type": "in_progress", "webhook_event_trigger": "carrinho_abandonado", "order_index": 1},
    {"name": "Oportunidade", "color": "amber", "stage_type": "in_progress", "webhook_event_trigger": "pix_gerado,boleto_gerado", "order_index": 2},
    {"name": "Venda", "color": "emerald", "stage_type": "won", "webhook_event_trigger": "compra_aprovada", "order_index": 3},
    {"name": "Desistencia", "color": "rose", "stage_type": "lost", "webhook_event_trigger": None, "order_index": 4},
]

def migrate_kanban_stages():
    db = SessionLocal()
    try:
        pipelines = db.query(SalesPipeline).all()
        print(f"Encontrados {len(pipelines)} pipelines para verificação...")

        for pipe in pipelines:
            stages = db.query(SalesPipelineStage).filter(
                SalesPipelineStage.pipeline_id == pipe.id
            ).order_by(SalesPipelineStage.order_index.asc()).all()

            stage_names = [s.name.lower().strip() for s in stages]
            print(f"Pipeline #{pipe.id} '{pipe.name}' - Estágios atuais: {stage_names}")

            # Mapeamento de migração de nomes antigos para os novos
            # Carrinho Abandonado -> Lead
            # Primeiro Contato -> Prospect
            # Em Negociação -> Oportunidade
            # Aguardando Pagamento -> Oportunidade (mover deals)
            # Venda Concluída -> Venda
            # Perdido -> Desistencia

            # Verifica se precisa de ajuste
            needs_update = any(old in stage_names for old in [
                "carrinho abandonado", "primeiro contato", "em negociação", "aguardando pagamento", "venda concluída", "perdido"
            ])

            if needs_update or len(stages) == 0:
                print(f"Migrando estágios do Pipeline #{pipe.id} para o novo padrão...")
                
                # Procura estágios existentes para reaproveitar ou renomear
                stage_map = {s.name.lower().strip(): s for s in stages}

                # 1. Prospect
                prospect_stg = stage_map.get("prospect") or stage_map.get("primeiro contato")
                if not prospect_stg and len(stages) > 0 and stages[0].name.lower() not in ["venda", "venda concluída", "perdido", "desistencia"]:
                    prospect_stg = stages[0]

                # 2. Lead
                lead_stg = stage_map.get("lead") or stage_map.get("carrinho abandonado")

                # 3. Oportunidade
                oportunidade_stg = stage_map.get("oportunidade") or stage_map.get("em negociação")

                # 4. Venda
                venda_stg = stage_map.get("venda") or stage_map.get("venda concluída")

                # 5. Desistencia
                desistencia_stg = stage_map.get("desistencia") or stage_map.get("desistência") or stage_map.get("perdido")

                # Se aguardando pagamento existir, seus deals vão para oportunidade
                aguardando_stg = stage_map.get("aguardando pagamento")

                # Criar os que faltam ou atualizar
                final_stages = []

                # Helper para garantir ou criar estágio
                def ensure_stage(target_name, current_stg, default_conf):
                    if current_stg:
                        current_stg.name = target_name
                        current_stg.color = default_conf["color"]
                        current_stg.stage_type = default_conf["stage_type"]
                        current_stg.order_index = default_conf["order_index"]
                        current_stg.webhook_event_trigger = default_conf["webhook_event_trigger"]
                        return current_stg
                    else:
                        new_s = SalesPipelineStage(
                            pipeline_id=pipe.id,
                            client_id=pipe.client_id,
                            name=target_name,
                            color=default_conf["color"],
                            stage_type=default_conf["stage_type"],
                            webhook_event_trigger=default_conf["webhook_event_trigger"],
                            order_index=default_conf["order_index"]
                        )
                        db.add(new_s)
                        return new_s

                s_prospect = ensure_stage("Prospect", prospect_stg, NEW_DEFAULT_STAGES[0])
                s_lead = ensure_stage("Lead", lead_stg, NEW_DEFAULT_STAGES[1])
                s_oportunidade = ensure_stage("Oportunidade", oportunidade_stg, NEW_DEFAULT_STAGES[2])
                s_venda = ensure_stage("Venda", venda_stg, NEW_DEFAULT_STAGES[3])
                s_desistencia = ensure_stage("Desistencia", desistencia_stg, NEW_DEFAULT_STAGES[4])

                db.flush()

                # Se aguardando pagamento era uma coluna separada, move os deals para oportunidade e remove
                if aguardando_stg and aguardando_stg.id not in [s_prospect.id, s_lead.id, s_oportunidade.id, s_venda.id, s_desistencia.id]:
                    db.query(SalesDeal).filter(SalesDeal.stage_id == aguardando_stg.id).update(
                        {"stage_id": s_oportunidade.id}
                    )
                    db.delete(aguardando_stg)

                db.commit()
                print(f"Pipeline #{pipe.id} atualizado com sucesso para as 5 colunas padrão: Prospect, Lead, Oportunidade, Venda, Desistencia.")

        print("Migração concluída com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"Erro na migração: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    migrate_kanban_stages()
