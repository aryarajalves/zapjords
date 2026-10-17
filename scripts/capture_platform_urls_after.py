import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\9e4e5d4f-9650-40ba-9791-e5841d28c9de"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1400, "height": 950})

        print("1. Efetuando login...")
        await page.goto("http://localhost:5176", wait_until="domcontentloaded", timeout=30000)
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(3000)

        # Open Settings Modal
        print("2. Abrindo Configurações...")
        settings_btn = page.locator('aside button:has-text("Configurações")').first
        await settings_btn.click()
        await page.wait_for_timeout(1500)

        # Click Tab "Avançado"
        print("3. Clicando na aba Avançado...")
        advanced_tab_btn = page.locator('button:has-text("Avançado")').first
        await advanced_tab_btn.click()
        await page.wait_for_timeout(1500)

        # Scroll to Plataforma Externa section
        print("4. Localizando seção Plataforma Externa...")
        heading = page.locator('text="Plataforma Externa (Área de Membros)"').first
        if await heading.count() > 0:
            await heading.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)

        shot_path = os.path.join(ARTIFACT_DIR, "evidencia_depois_platform_urls.png")
        await page.screenshot(path=shot_path)
        print(f"Screenshot Depois salva em {shot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
