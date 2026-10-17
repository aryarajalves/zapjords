import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\9e4e5d4f-9650-40ba-9791-e5841d28c9de"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Viewport padrão de smartphone moderno (390 x 844)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        print("1. Efetuando login no modo mobile...")
        await page.goto("http://localhost:5176", wait_until="domcontentloaded", timeout=30000)
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(3500)

        # 2. Navegar para Integrações se não estiver
        print("2. Abrindo menu mobile para navegar até Integrações Webhook...")
        menu_btn = page.locator('button[data-testid="open-mobile-sidebar-btn"]').first
        if await menu_btn.count() > 0:
            await menu_btn.click()
            await page.wait_for_timeout(1000)

            # Capturar screenshot do Drawer Mobile Aberto
            drawer_shot_path = os.path.join(ARTIFACT_DIR, "evidencia_depois_mobile_drawer.png")
            await page.screenshot(path=drawer_shot_path)
            print(f"Screenshot do Drawer Mobile salva em: {drawer_shot_path}")

            # Clicar em Integrações Webhook
            integrations_nav = page.locator('button:has-text("Integrações Webhook")').first
            if await integrations_nav.count() > 0:
                await integrations_nav.click()
                await page.wait_for_timeout(2000)

        # Capturar screenshot da Página de Integrações no Mobile
        print("3. Capturando tela da página no Mobile...")
        page_shot_path = os.path.join(ARTIFACT_DIR, "evidencia_depois_mobile_page.png")
        await page.screenshot(path=page_shot_path)
        print(f"Screenshot da página Mobile salva em: {page_shot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
