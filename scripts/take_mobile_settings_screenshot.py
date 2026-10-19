import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\bac392c0-e46e-4ffb-b46b-e2d6a6480f85"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        # Resolução mobile clássica (largura estreita 412x844)
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 412, "height": 844})

        print("1. Navegando para o ZapVoice no mobile (412x844)...")
        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)

        # Login
        print("2. Login...")
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()

        print("3. Aguardando painel carregar...")
        await page.wait_for_timeout(4000)

        # Step 4: Open Settings Modal via mobile header button
        print("4. Abrindo Configurações pelo botão do header mobile...")
        mobile_settings_btn = page.locator('header button[title="Configurações"]').first
        if await mobile_settings_btn.count() > 0:
            await mobile_settings_btn.click()
        else:
            await page.locator('button[aria-label="Configurações"]').first.click()
        await page.wait_for_timeout(1500)

        # Click Tab "Avançado" in Settings
        print("5. Clicando na aba Avançado...")
        advanced_tab_btn = page.locator('button:has-text("Avançado")').first
        await advanced_tab_btn.click()
        await page.wait_for_timeout(1500)

        mobile_depois_shot = os.path.join(ARTIFACT_DIR, "settings_mobile_depois.png")
        print(f"Salvando screenshot mobile depois em {mobile_depois_shot}...")
        await page.screenshot(path=mobile_depois_shot)

        await browser.close()
        print("Concluído!")

if __name__ == "__main__":
    asyncio.run(main())
