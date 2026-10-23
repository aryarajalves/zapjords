import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\0e0eda03-2ae8-4834-a90a-b2b532b5f4a8"

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
            print("Realizando login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            time.sleep(4)

        print("2. Clicando no item 'Atendimento' no menu lateral...")
        atendimento_btn = page.locator('button:has-text("Atendimento")').first
        atendimento_btn.wait_for(state="visible", timeout=15000)
        atendimento_btn.click()
        time.sleep(5)

        # Salvar screenshot da tela de Atendimento para inspecionar
        screen_atendimento = os.path.join(ARTIFACT_DIR, "debug_atendimento_carregado.png")
        page.screenshot(path=screen_atendimento)
        print(f"Screenshot da tela de atendimento salva em: {screen_atendimento}")

        print("3. Procurando conversas na lista lateral...")
        convo_locator = page.locator(".group\\/convo")
        convo_count = convo_locator.count()
        print(f"Total de conversas encontradas: {convo_count}")

        if convo_count > 0:
            first_convo = convo_locator.first
            first_convo.click()
            time.sleep(3)
        else:
            print("Nenhuma conversa na lista, tentando encontrar qualquer card de contato...")
            fallback = page.locator('div[class*="cursor-pointer"]:has(p)').first
            if fallback.is_visible():
                fallback.click()
                time.sleep(3)

        print("4. Verificando o botão do Kanban no cabeçalho...")
        kanban_btn = page.locator('[data-testid="chat-header-kanban-btn"]').first
        kanban_btn.wait_for(state="visible", timeout=15000)
        print("Botão do Kanban no cabeçalho encontrado com sucesso!")

        screenshot_header = os.path.join(ARTIFACT_DIR, "chat_header_kanban_btn_depois.png")
        page.screenshot(path=screenshot_header)
        print(f"Screenshot 1 salva: {screenshot_header}")

        print("5. Clicando no botão do Kanban...")
        kanban_btn.click()
        time.sleep(3)

        print("6. Verificando o modal do Kanban de Vendas...")
        modal = page.locator('div.fixed.inset-0:has-text("Kanban de Vendas")').first
        modal.wait_for(state="visible", timeout=15000)
        print("Modal do CRM/Kanban aberto com sucesso!")

        screenshot_modal = os.path.join(ARTIFACT_DIR, "chat_kanban_modal_mover_etapa_depois.png")
        page.screenshot(path=screenshot_modal)
        print(f"Screenshot 2 salva: {screenshot_modal}")

        print("7. Testando seleção de etapa de Desistência/Perda...")
        stage_select = page.locator('select').nth(1)
        options = stage_select.locator('option').all_text_contents()
        desistencia_opt = next((opt for opt in options if "desist" in opt.lower() or "perdid" in opt.lower()), None)
        if desistencia_opt:
            stage_select.select_option(label=desistencia_opt)
            time.sleep(2)
            screenshot_desistencia = os.path.join(ARTIFACT_DIR, "chat_kanban_modal_desistencia_depois.png")
            page.screenshot(path=screenshot_desistencia)
            print("Screenshot 3 com Desistencia salva!")

        browser.close()
        print("Validação visual concluída com 100% de sucesso!")

if __name__ == "__main__":
    run()
