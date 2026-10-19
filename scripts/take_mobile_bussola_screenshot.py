import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\bac392c0-e46e-4ffb-b46b-e2d6a6480f85"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 412, "height": 844})

        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)

        # Login
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(4000)

        # Open Settings Modal
        mobile_settings_btn = page.locator('header button[title="Configurações"]').first
        if await mobile_settings_btn.count() > 0:
            await mobile_settings_btn.click()
        else:
            await page.locator('button[aria-label="Configurações"]').first.click()
        await page.wait_for_timeout(1500)

        # Click Tab "Avançado"
        advanced_tab_btn = page.locator('button:has-text("Avançado")').first
        await advanced_tab_btn.click()
        await page.wait_for_timeout(1500)

        # Scroll to Bussola
        bussola = page.locator('text="App Bússola Astrológica"').first
        await bussola.scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)

        shot = os.path.join(ARTIFACT_DIR, "settings_mobile_bussola.png")
        await page.screenshot(path=shot)
        await browser.close()
        print("Bussola mobile screenshot capturado!")

if __name__ == "__main__":
    asyncio.run(main())
