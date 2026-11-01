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

        page.on("console", lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}".encode('ascii', errors='replace').decode('ascii')))
        page.on("pageerror", lambda exc: print(f"[PAGE ERROR] {exc}".encode('ascii', errors='replace').decode('ascii')))

        print("1. Acessando http://localhost:5176...")
        page.goto("http://localhost:5176", wait_until="domcontentloaded")
        time.sleep(3)

        if page.locator('input[type="email"]').is_visible():
            print("2. Realizando login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            time.sleep(4)

        print("3. Navegando para o Kanban de Vendas...")
        # Procurar botão ou item de navegação para Kanban
        kanban_nav = page.locator('button:has-text("Kanban"), a:has-text("Kanban")').first
        if kanban_nav.is_visible():
            kanban_nav.click()
            time.sleep(4)
        else:
            print("Tentando menu lateral...")
            menu_btn = page.locator('button:has-text("Kanban de Vendas")').first
            if menu_btn.is_visible():
                menu_btn.click()
                time.sleep(4)

        print("4. Aguardando carregamento do Kanban de Vendas...")
        page.wait_for_selector('h1:has-text("Kanban de Vendas"), div:has-text("Kanban de Vendas")', timeout=15000)
        time.sleep(3)

        # Captura 1: Visão geral do Kanban com carimbos de data/hora e botão de histórico
        screen_kanban = os.path.join(ARTIFACT_DIR, "evidencia_kanban_datas_e_vendas.png")
        page.screenshot(path=screen_kanban)
        print(f"Screenshot do Kanban salvo em: {screen_kanban}")

        # 5. Localizar o botão de histórico em algum card
        history_buttons = page.locator('button[title*="histórico"]')
        count = history_buttons.count()
        print(f"Botões de histórico encontrados: {count}")

        if count > 0:
            print("6. Clicando no primeiro botão de histórico...")
            history_buttons.first.click()
            time.sleep(3)

            # Aguardar modal de histórico estar visível
            modal = page.locator('[data-testid="lead-history-modal"]')
            modal.wait_for(state="visible", timeout=10000)
            time.sleep(2)

            screen_modal = os.path.join(ARTIFACT_DIR, "evidencia_modal_historico_lead.png")
            page.screenshot(path=screen_modal)
            print(f"Screenshot do Modal de Histórico salvo em: {screen_modal}")
        else:
            print("Nenhum botão de histórico encontrado diretamente no viewport.")

        browser.close()
        print("Validação visual concluída com sucesso!")

if __name__ == "__main__":
    run()
