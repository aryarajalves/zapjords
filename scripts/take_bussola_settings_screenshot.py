import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\bac392c0-e46e-4ffb-b46b-e2d6a6480f85"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1400, "height": 950})

        print("1. Navegando para o ZapVoice...")
        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)

        # Login
        print("2. Realizando login...")
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()

        print("3. Aguardando painel carregar...")
        await page.wait_for_timeout(4000)

        # Step 4: Open Settings Modal
        print("4. Abrindo Configurações...")
        settings_btn = page.locator('aside button:has-text("Configurações")')
        await settings_btn.click()
        await page.wait_for_timeout(1500)

        # Click Tab "Avançado" in Settings
        print("5. Clicando na aba Avançado das Configurações...")
        advanced_tab_btn = page.locator('button:has-text("Avançado")').first
        await advanced_tab_btn.click()
        await page.wait_for_timeout(1500)

        # Scroll to Bussola section
        bussola_heading = page.locator('text="App Bússola Astrológica"').first
        if await bussola_heading.count() > 0:
            await bussola_heading.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)

        settings_shot = os.path.join(ARTIFACT_DIR, "bussola_settings_depois.png")
        print(f"Salvando screenshot depois em {settings_shot}...")
        await page.screenshot(path=settings_shot)

        await browser.close()
        print("Concluído!")

if __name__ == "__main__":
    asyncio.run(main())
