import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\9e4e5d4f-9650-40ba-9791-e5841d28c9de"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})

        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(3000)

        await page.evaluate("""() => {
            localStorage.setItem('activeClientId', '14');
            localStorage.setItem('currentView', 'templates');
        }""")
        await page.goto("http://localhost:5176", wait_until="networkidle")
        await page.wait_for_timeout(3500)

        path_desk = os.path.join(ARTIFACT_DIR, "evidencia_depois_template_desktop.png")
        await page.screenshot(path=path_desk)
        print(f"Salvo desktop: {path_desk}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
