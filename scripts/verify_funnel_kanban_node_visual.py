import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\0e0eda03-2ae8-4834-a90a-b2b532b5f4a8"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1440, "height": 900})

        print("1. Acessando a aplicação...")
        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Login
        email = page.locator('input[type="email"]').first
        if await email.is_visible():
            print("2. Fazendo login...")
            await email.fill("aryarajmarketing@gmail.com")
            await page.locator('input[type="password"]').first.fill("123456")
            await page.locator('button[type="submit"]').first.click()
            await page.wait_for_timeout(4000)

        print("3. Navegando para funnels...")
        await page.evaluate("window.dispatchEvent(new CustomEvent('navigate-view', { detail: 'funnels' }))")
        await page.wait_for_timeout(3000)

        print("4. Clicando em 'Novo Funil'...")
        novo_funil_btn = page.locator('button:has-text("Novo Funil")').first
        await novo_funil_btn.wait_for(state="visible", timeout=10000)
        await novo_funil_btn.click()
        await page.wait_for_timeout(3000)

        print("5. Aguardando Canvas do React Flow...")
        pane = page.locator('.react-flow__pane').first
        await pane.wait_for(state="visible", timeout=10000)
        await page.wait_for_timeout(1000)

        print("6. Abrindo ContextMenu via right-click no canvas...")
        await page.click(".react-flow__pane", button="right", position={"x": 500, "y": 300})
        await page.wait_for_timeout(1500)

        print("7. Digitando 'Kanban'...")
        await page.keyboard.type("Kanban", delay=100)
        await page.wait_for_timeout(1000)

        menu_screenshot = os.path.join(ARTIFACT_DIR, "funil_context_menu_kanban_depois.png")
        await page.screenshot(path=menu_screenshot)
        print(f"Screenshot do menu filtrado: {menu_screenshot}")

        print("8. Clicando no item 'Kanban de Vendas' dentro do menu...")
        # nth(1) é o item dentro do ContextMenu (o nth(0) é o item da sidebar)
        await page.locator('button:has-text("Kanban de Vendas")').nth(1).click()
        await page.wait_for_timeout(3000)

        print("9. Verificando o nó 'Kanban de Vendas' renderizado no Canvas...")
        kanban_node = page.locator('.react-flow__node-kanbanNode, div:has-text("Kanban de Vendas")').last
        await kanban_node.wait_for(state="visible", timeout=10000)
        print("Nó 'Kanban de Vendas' renderizado com sucesso no Canvas!")

        full_screenshot = os.path.join(ARTIFACT_DIR, "funil_kanban_node_depois.png")
        await page.screenshot(path=full_screenshot)
        print(f"Screenshot completo: {full_screenshot}")

        # Se houver selects dentro do nó, vamos inspecionar e interagir
        selects = await kanban_node.locator('select').all()
        print(f"Total de selects encontrados no nó: {len(selects)}")

        zoom_screenshot = os.path.join(ARTIFACT_DIR, "funil_kanban_node_zoom_depois.png")
        await kanban_node.screenshot(path=zoom_screenshot)
        print(f"Screenshot com zoom do nó: {zoom_screenshot}")

        await browser.close()
        print("Tudo concluído com sucesso!")

if __name__ == "__main__":
    asyncio.run(main())
