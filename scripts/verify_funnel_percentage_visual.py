import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        print("1. Acessando página de login...")
        page.goto("http://localhost:5176/login", wait_until="networkidle")

        print("2. Preenchendo credenciais...")
        page.fill('input[type="email"]', 'aryarajmarketing@gmail.com')
        page.fill('input[type="password"]', '123456')
        page.click('button[type="submit"]')

        print("3. Aguardando login concluir...")
        page.wait_for_selector('text=Kanban de Vendas', timeout=15000)

        print("4. Navegando para o Kanban de Vendas...")
        page.locator("button:has-text('Kanban de Vendas')").first.click()
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        print("5. Aguardando elementos do Kanban...")
        page.wait_for_selector('text=Taxa de Conversão', timeout=10000)
        page.wait_for_selector('text=Distribuição do Funil', timeout=10000)

        print("6. Capturando screenshot do Kanban com Taxa de Conversão e Barra de Funil...")
        screenshot_path = "C:/Users/aryar/.gemini/antigravity/brain/0e0eda03-2ae8-4834-a90a-b2b532b5f4a8/kanban_taxa_conversao_funil_depois.png"
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"Screenshot salvo com sucesso em: {screenshot_path}")

        browser.close()

if __name__ == '__main__':
    run()
