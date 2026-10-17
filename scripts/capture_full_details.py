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
        await page.goto("http://localhost:5176", wait_until="domcontentloaded", timeout=15000)
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(3000)

        print("2. Navegando para Integrações do cliente 14...")
        await page.evaluate("""() => {
            localStorage.setItem('activeClientId', '14');
        }""")
        await page.goto("http://localhost:5176", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(2000)

        nav_btn = page.locator('aside button:has-text("Integrações Webhook")').first
        await nav_btn.click()
        await page.wait_for_timeout(3000)

        # 1. Abrir Nova Integração
        print("3. Abrindo Nova Integração...")
        new_int_btn = page.locator('button:has-text("NOVA INTEGRAÇÃO")').first
        await new_int_btn.click()
        await page.wait_for_timeout(1500)

        # Clicar no seletor de plataforma para abrir o dropdown
        plat_btn = page.locator('div[role="dialog"] button:has-text("Hotmart")').first
        await plat_btn.click()
        await page.wait_for_timeout(1000)

        # Screenshot com o menu aberto mostrando Checkout Jords
        platform_open_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_checkout_jords_lista_plataformas.png")
        await page.screenshot(path=platform_open_shot)
        print("Screenshot da lista com Checkout Jords salva!")

        # Selecionar Checkout Jords
        jords_opt = page.locator('li:has-text("Checkout Jords")').first
        await jords_opt.click()
        await page.wait_for_timeout(1000)

        platform_selected_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_checkout_jords_plataforma.png")
        await page.screenshot(path=platform_selected_shot)
        print("Screenshot com Checkout Jords selecionado salva!")

        await browser.close()
        print("Concluído!")

if __name__ == "__main__":
    asyncio.run(main())
