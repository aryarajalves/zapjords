import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Resolução comum de tela (notebook / desktop compacto)
        context = browser.new_context(viewport={'width': 1366, 'height': 768})
        page = context.new_page()

        print("1. Login...")
        page.goto("http://localhost:5176/login", wait_until="networkidle")
        page.fill('input[type="email"]', 'aryarajmarketing@gmail.com')
        page.fill('input[type="password"]', '123456')
        page.click('button[type="submit"]')

        print("2. Navegando para o Kanban...")
        page.wait_for_selector('text=Kanban de Vendas', timeout=15000)
        page.locator("button:has-text('Kanban de Vendas')").first.click()
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        print("3. Aguardando Kanban carregar...")
        page.wait_for_selector('text=Taxa de Conversão', timeout=10000)

        # Captura 1: Layout compacto com métricas visíveis e colunas estendidas até embaixo
        path1 = "C:/Users/aryar/.gemini/antigravity/brain/0e0eda03-2ae8-4834-a90a-b2b532b5f4a8/kanban_colunas_expandidas_abaixo_depois.png"
        page.screenshot(path=path1, full_page=False)
        print(f"Screenshot 1 salvo em: {path1}")

        # Captura 2: Clicando em "Recolher Métricas" (Modo Foco Máximo)
        print("4. Clicando em Recolher Métricas...")
        collapse_btn = page.locator("button:has-text('Recolher Métricas')")
        if collapse_btn.count() > 0:
            collapse_btn.first.click()
            time.sleep(1)
            path2 = "C:/Users/aryar/.gemini/antigravity/brain/0e0eda03-2ae8-4834-a90a-b2b532b5f4a8/kanban_modo_foco_maximo_depois.png"
            page.screenshot(path=path2, full_page=False)
            print(f"Screenshot 2 salvo em: {path2}")

        browser.close()

if __name__ == '__main__':
    run()
