import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\97d5a1f1-aa70-4136-a595-ff71f65d5e6f"

def run():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("1. Acessando http://127.0.0.1:5176...")
        page.goto("http://127.0.0.1:5176", timeout=60000)
        time.sleep(2)

        if page.locator('input[type="email"]').is_visible():
            print("2. Efetuando login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            time.sleep(3)

        print("3. Navegando para o Kanban de Vendas...")
        kanban_btn = page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")').first
        kanban_btn.wait_for(state="visible", timeout=15000)
        kanban_btn.click()
        time.sleep(3)

        print("4. Localizando botão de conversa no card do Kanban...")
        chat_btn = page.locator('button[data-testid^="deal-chat-btn-"]').first
        chat_btn.wait_for(state="visible", timeout=15000)

        # Captura o evento de nova página ao clicar com Ctrl
        print("5. Clicando com Ctrl no botão de conversa para abrir nova aba...")
        with context.expect_page() as new_page_info:
            chat_btn.click(modifiers=["Control"])
        
        new_tab = new_page_info.value
        print("6. Nova aba detectada! URL aberta:", new_tab.url)

        # Aguarda a nova aba carregar a conversa selecionada
        print("7. Aguardando a nova aba selecionar a conversa e carregar o chat...")
        active_header = new_tab.locator('[data-testid="active-chat-header"]')
        active_header.wait_for(state="visible", timeout=20000)

        time.sleep(2)

        header_text = active_header.inner_text()
        print(f"Header da conversa aberta na nova aba: {header_text.replace(chr(10), ' | ')[:100]}")

        screenshot_path = os.path.join(ARTIFACT_DIR, "evidencia_nova_aba_conversa_aberta.png")
        new_tab.screenshot(path=screenshot_path)
        print(f"Screenshot da nova aba salva em: {screenshot_path}")

        assert active_header.is_visible(), "Falha: O chat não abriu com a conversa selecionada na nova aba!"
        print("VALIDACAO CONCLUIDA COM SUCESSO! A nova aba abriu direto na conversa do contato.")

if __name__ == "__main__":
    run()
