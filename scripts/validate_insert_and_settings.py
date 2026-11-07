import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\4fe8aef3-dd33-490a-b0c2-0ffea8624b34"

def run_validation():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("1. Acessando http://127.0.0.1:5176...")
        page.goto("http://127.0.0.1:5176", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector('input[type="email"], nav, button:has-text("Atendimento")', timeout=20000)

        if page.locator('input[type="email"]').is_visible():
            print("2. Fazendo login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            page.wait_for_selector('button:has-text("Atendimento"), nav', timeout=20000)
            time.sleep(2)

        # 1. Validar Configurações -> IA sem campo manual de chave
        print("3. Abrindo Modal de Configurações...")
        settings_btn = page.locator('button:has-text("Configurações"), [title="Configurações"]').first
        if not settings_btn.is_visible():
            settings_btn = page.locator('nav button').last

        if settings_btn.is_visible():
            settings_btn.click()
            time.sleep(2)
            ai_tab = page.locator('button:has-text("Inteligência Artificial")').first
            if ai_tab.is_visible():
                ai_tab.click()
                time.sleep(2)
                shot1 = os.path.join(ARTIFACT_DIR, "configuracoes_ia_sem_chave_manual.png")
                page.screenshot(path=shot1)
                print(f"[OK] Screenshot Configurações sem chave salvo em: {shot1}")

            close_btn = page.locator('button:has-text("Fechar")').first
            if close_btn.is_visible():
                close_btn.click()
                time.sleep(1)

        # 2. Validar Atendimento -> Inserir resposta limpa
        print("4. Navegando para Atendimento...")
        atendimento_btn = page.locator('button:has-text("Atendimento")').first
        if atendimento_btn.is_visible():
            atendimento_btn.click()
            time.sleep(3)

        print("5. Selecionando conversa...")
        convo_card = page.locator(".group\\/convo").first
        convo_card.wait_for(state="visible", timeout=15000)
        convo_card.click()
        time.sleep(3)

        print("6. Abrindo Copiloto IA...")
        copilot_btn = page.locator('button:has-text("Copiloto IA")').first
        copilot_btn.wait_for(state="visible", timeout=10000)
        copilot_btn.click()
        time.sleep(2)

        # Gerar resposta rápida
        print("7. Solicitando sugestão no Copiloto IA...")
        sugerir_btn = page.locator('button:has-text("Sugerir Resposta")').first
        if sugerir_btn.is_visible():
            sugerir_btn.click()
            time.sleep(2)
            # Aguarda a resposta aparecer
            try:
                page.locator('button:has-text("Inserir")').first.wait_for(state="visible", timeout=35000)
            except Exception as e:
                print(f"Aviso ao aguardar botão Inserir: {e}")

        # Clicar em Inserir
        print("8. Clicando em Inserir...")
        insert_btn = page.locator('button:has-text("Inserir")').first
        if insert_btn.is_visible():
            insert_btn.click()
            time.sleep(2)

        shot2 = os.path.join(ARTIFACT_DIR, "chat_inserir_somente_resposta_limpa.png")
        page.screenshot(path=shot2)
        print(f"[OK] Screenshot Inserir resposta limpa salvo em: {shot2}")

        browser.close()

if __name__ == "__main__":
    run_validation()
