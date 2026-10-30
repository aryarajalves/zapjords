import sys
import os

# Define DATABASE_URL antes de importar qualquer coisa do backend
os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"

# Adiciona o diretório backend ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.utils.bulk_helpers import render_template_body, sanitize_template_components

def test_sanitize_template_components_dynamic_vars():
    print("🧪 Iniciando testes de sanitização de template com variáveis dinâmicas...\n")
    
    # 1. Substituição de {{nome}} e {{telefone}}
    components = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": "Olá {{nome}}!"},
                {"type": "text", "text": "Seu telefone é {{telefone}}."}
            ]
        }
    ]
    
    sanitized = sanitize_template_components(
        components, 
        contact_name="Arya", 
        contact_phone="5511999999999"
    )
    
    body_params = sanitized[0]["parameters"]
    assert body_params[0]["text"] == "Olá Arya!", f"Falha var dinamica 1: {body_params[0]['text']}"
    assert body_params[1]["text"] == "Seu telefone é 5511999999999.", f"Falha var dinamica 2: {body_params[1]['text']}"
    print("✅ Teste 1: Substituição de {{nome}} e {{telefone}} com sucesso.")

    # 2. Substituição com {{name}} e {{phone}}
    components_en = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": "Hello {{name}}!"},
                {"type": "text", "text": "Phone: {{phone}}"}
            ]
        }
    ]
    sanitized_en = sanitize_template_components(
        components_en, 
        contact_name="John", 
        contact_phone="123456789"
    )
    body_params_en = sanitized_en[0]["parameters"]
    assert body_params_en[0]["text"] == "Hello John!", f"Falha var dinamica 3: {body_params_en[0]['text']}"
    assert body_params_en[1]["text"] == "Phone: 123456789", f"Falha var dinamica 4: {body_params_en[1]['text']}"
    # 3. Teste de fallback seguro contra Erro Meta 131009 quando o texto do parâmetro estiver em branco
    components_empty = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": "1"}, # Sem nome de contato
                {"type": "text", "text": ""}   # Parâmetro vazio
            ]
        }
    ]
    sanitized_empty = sanitize_template_components(
        components_empty,
        contact_name="", # Sem nome
        contact_phone="5511988888888"
    )
    empty_params = sanitized_empty[0]["parameters"]
    assert empty_params[0]["text"] == " ", f"Falha fallback 131009 (1): '{empty_params[0]['text']}'"
    assert empty_params[1]["text"] == " ", f"Falha fallback 131009 (2): '{empty_params[1]['text']}'"
    print("✅ Teste 3: Proteção Erro Meta 131009 - Parâmetro em branco convertido para ' ' (espaço neutro).")

    print("\n🎉 Todos os testes de sanitização dinâmica passaram!")

def test_render_template_body_scenarios():
    print("🧪 Iniciando testes de renderização de template...\n")
    
    # 1. Teste básico com {{1}} e placeholder "1"
    body = "Olá {{1}}, tudo bem?"
    components = [{"type": "body", "parameters": [{"type": "text", "text": "1"}]}]
    name = "Arya"
    rendered = render_template_body(body, components, contact_name=name)
    assert rendered == "Olá Arya, tudo bem?", f"Falha 1: {rendered}"
    print("✅ Teste 1: Placeholder '1' substituído por nome real.")

    # 2. Teste com {{nome}} e {{name}}
    body = "Oi {{nome}} (ou {{name}}), seu número é {{1}}."
    components = []
    name = "João"
    rendered = render_template_body(body, components, contact_name=name)
    assert rendered == "Oi João (ou João), seu número é João.", f"Falha 2: {rendered}"
    print("✅ Teste 2: Variáveis nomeadas {{nome}} e {{name}} substituídas.")

    # 3. Teste com placeholder "1" e SEM nome de contato (deve ficar vazio)
    body = "Olá {{1}}!"
    components = [{"type": "body", "parameters": [{"type": "text", "text": "1"}]}]
    name = "1" # Representa nome não encontrado
    rendered = render_template_body(body, components, contact_name=name)
    assert rendered == "Olá !", f"Falha 3: {rendered}"
    print("✅ Teste 3: Placeholder '1' removido quando nome não está disponível.")

    # 4. Teste com variáveis reais que NÃO são "1"
    body = "Seu código é {{1}} e seu vencimento {{2}}."
    components = [
        {"type": "body", "parameters": [
            {"type": "text", "text": "XYZ-99"},
            {"type": "text", "text": "20/10"}
        ]}
    ]
    rendered = render_template_body(body, components, contact_name="Maria")
    assert rendered == "Seu código é XYZ-99 e seu vencimento 20/10.", f"Falha 4: {rendered}"
    print("✅ Teste 4: Variáveis legítimas mantidas integralmente.")

    # 5. Teste de fallback sem components
    body = "Olá {{1}}!"
    rendered = render_template_body(body, [], contact_name="Carlos")
    assert rendered == "Olá Carlos!", f"Falha 5: {rendered}"
    print("✅ Teste 5: Fallback de {{1}} funcionando sem lista de componentes.")

    print("\n🎉 Todos os testes de renderização passaram!")

def test_sanitize_template_components_prevents_132000_and_empty_body_0():
    print("🧪 Testando proteção contra Erro Meta (#132000) em disparos agendados/dinâmicos...\n")

    # 1. Quando components é [] mas template_body exige {{1}}, deve gerar componente body automaticamente
    template_body = "Ooi, {{1}}! Tudo bem com você?"
    sanitized_missing = sanitize_template_components(
        [],
        contact_name="Camila Oliveira",
        contact_phone="5511999999999",
        template_body=template_body
    )
    assert len(sanitized_missing) == 1
    assert sanitized_missing[0]["type"] == "body"
    assert len(sanitized_missing[0]["parameters"]) == 1
    assert sanitized_missing[0]["parameters"][0]["text"] == "Camila"

    # 2. Quando parameter #1 vem vazio ("") no template_components global, usa contact_vars ou primeiro nome
    components_blank = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": ""}
            ]
        }
    ]
    sanitized_from_name = sanitize_template_components(
        components_blank,
        contact_name="Roberto Carlos",
        contact_phone="5511988887777",
        template_body=template_body
    )
    assert sanitized_from_name[0]["parameters"][0]["text"] == "Roberto"

    sanitized_from_vars = sanitize_template_components(
        components_blank,
        contact_name="Roberto Carlos",
        contact_phone="5511988887777",
        contact_vars={"BODY_0": "{{nome}}"},
        template_body=template_body
    )
    assert sanitized_from_vars[0]["parameters"][0]["text"] == "Roberto Carlos"
    print("✅ Proteção contra #132000 validada com sucesso!")

if __name__ == "__main__":
    test_sanitize_template_components_dynamic_vars()
    test_render_template_body_scenarios()
    test_sanitize_template_components_prevents_132000_and_empty_body_0()
