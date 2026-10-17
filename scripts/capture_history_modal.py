import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\e001089d-fecd-4eb8-881b-8f17ed9f40ed"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1400, "height": 950})
        await page.goto("http://localhost:5176", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)

        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(3000)

        await page.evaluate("() => localStorage.setItem('activeClientId', '14')")
        await page.goto("http://localhost:5176", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        await page.locator('aside button:has-text("Integrações")').first.click()
        await page.wait_for_timeout(3000)

        # Clica no botão Histórico dentro da tabela (linha 1: Hotmart)
        table_history_btn = page.locator('table tbody tr').nth(1).locator('button:has-text("Histórico")')
        await table_history_btn.click()
        await page.wait_for_timeout(3000)

        modal_path = os.path.join(ARTIFACT_DIR, 'integrations_realtime_modal_webhook.png')
        await page.screenshot(path=modal_path)
        print('Modal capturado com sucesso em:', modal_path)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
