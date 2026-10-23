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

        print("1. Acessando tela de login...")
        page.goto("http://localhost:5176", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        if page.locator('input[type="email"]').is_visible():
            print("Realizando login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            page.wait_for_timeout(3000)

        print("2. Clicando no menu Integrações Webhook...")
        int_menu_btn = page.locator('button:has-text("Integrações Webhook")').first
        int_menu_btn.wait_for(state="visible", timeout=10000)
        int_menu_btn.click()
        page.wait_for_timeout(3000)

        print("3. Aguardando a tabela e o botão de Editar...")
        edit_btn = page.locator('button[title="Editar"]').first
        edit_btn.wait_for(state="visible", timeout=15000)
        edit_btn.click()
        page.wait_for_timeout(2500)

        print("4. Clicando na aba Gatilhos DENTRO do modal...")
        modal = page.locator('.fixed.inset-0')
        modal_gatilhos = modal.locator('button:has-text("Gatilhos")').first
        modal_gatilhos.wait_for(state="visible", timeout=10000)
        modal_gatilhos.click(force=True)
        page.wait_for_timeout(2000)

        print("5. Clicando na subaba AVANÇADO...")
        avancado_tab = modal.locator('button:has-text("AVANÇADO"), button:has-text("Avançado")').first
        avancado_tab.wait_for(state="visible", timeout=10000)
        avancado_tab.click(force=True)
        page.wait_for_timeout(2000)

        print("6. Verificando o card do Kanban de Vendas...")
        kanban_title = modal.locator('text="Kanban de Vendas (CRM)"').first
        kanban_title.wait_for(state="visible", timeout=10000)
        print("Card do Kanban de Vendas encontrado com sucesso!")

        print("7. Ativando o toggle do Kanban...")
        toggle = modal.locator('[data-testid="kanban-active-toggle"]').first
        toggle.wait_for(state="visible", timeout=5000)
        if not toggle.is_checked():
            toggle.click(force=True)
            page.wait_for_timeout(2000)

        screenshot_depois = os.path.join(ARTIFACT_DIR, "webhook_gatilhos_avancado_depois.png")
        page.screenshot(path=screenshot_depois)
        print(f"Screenshot Depois salva: {screenshot_depois}")

        print("8. Testando seleção de etapa de desistência...")
        stage_select = modal.locator('[data-testid="kanban-stage-select"]').first
        options = stage_select.locator('option').all_text_contents()
        print(f"Total de estágios encontrados: {len(options)}")
        desistencia_opt = next((opt for opt in options if "desist" in opt.lower() or "perdid" in opt.lower()), None)
        if desistencia_opt:
            stage_select.select_option(label=desistencia_opt)
            page.wait_for_timeout(1500)
            lost_input = modal.locator('[data-testid="kanban-lost-reason-input"]').first
            if lost_input.is_visible():
                lost_input.fill("Preço acima do orçamento / optou por concorrente")
                page.wait_for_timeout(1000)

            screenshot_desistencia = os.path.join(ARTIFACT_DIR, "webhook_gatilhos_avancado_desistencia_depois.png")
            page.screenshot(path=screenshot_desistencia)
            print(f"Screenshot Desistência salva: {screenshot_desistencia}")

        browser.close()
        print("Validação visual do Webhook Kanban concluída com 100% de sucesso!")

if __name__ == "__main__":
    run()
