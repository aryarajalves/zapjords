import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\9e4e5d4f-9650-40ba-9791-e5841d28c9de"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1400, "height": 950})

        print("1. Navegando para o sistema...")
        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)

        # Login
        print("2. Efetuando login...")
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()

        print("3. Aguardando autenticação...")
        await page.wait_for_timeout(3000)

        # Set active client to Crassus (14)
        print("4. Configurando cliente ativo 14 (Crassus)...")
        await page.evaluate("""() => {
            localStorage.setItem('activeClientId', '14');
        }""")
        await page.goto("http://localhost:5176", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Click sidebar button Integrações Webhook
        print("5. Clicando em Integrações Webhook...")
        nav_btn = page.locator('aside button:has-text("Integrações Webhook")').first
        await nav_btn.click()
        await page.wait_for_timeout(3000)

        # Clicar no botão HISTÓRICO da linha 0 (Checkout Personalizado)
        print("6. Localizando botão Histórico na linha 0...")
        row = page.locator('table tbody tr').first
        history_btn = row.locator('button').nth(2)
        print("Clicando no botão de histórico...")
        await history_btn.click()

        print("7. Aguardando modal de Histórico abrir...")
        await page.wait_for_timeout(4000)

        # Rolar até o banner de criptomoeda se necessário
        crypto_banner = page.locator('text="Pagamento em Criptomoeda Confirmado"').first
        if await crypto_banner.count() > 0:
            print("Banner de criptomoeda encontrado! Rolando...")
            await crypto_banner.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)

        screenshot_path = os.path.join(ARTIFACT_DIR, "evidencia_depois_checkout_jords_crypto.png")
        print(f"8. Capturando screenshot do modal em {screenshot_path}...")
        await page.screenshot(path=screenshot_path)

        # 9. Fechar modal de histórico e abrir Nova Integração para mostrar "Checkout Jords" no seletor
        print("9. Validando seletor de plataforma com Checkout Jords...")
        close_modal = page.locator('div[role="dialog"] button:has-text("✕"), div[role="dialog"] button[title*="Fechar"]').first
        if await close_modal.count() > 0:
            await close_modal.click()
            await page.wait_for_timeout(1000)

        new_int_btn = page.locator('button:has-text("NOVA INTEGRAÇÃO")').first
        if await new_int_btn.count() == 0:
            new_int_btn = page.locator('button:has-text("Nova Integração")').first

        if await new_int_btn.count() > 0:
            await new_int_btn.click()
            await page.wait_for_timeout(1500)
            select_plat = page.locator('select').first
            if await select_plat.count() > 0:
                await select_plat.select_option(value='checkout_jords')
                await page.wait_for_timeout(1000)
            
            modal_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_checkout_jords_platform_option.png")
            await page.screenshot(path=modal_shot)
            print(f"Screenshot do modal de Nova Integração salvo em {modal_shot}")

        await browser.close()
        print("Validação visual concluída com sucesso!")

if __name__ == "__main__":
    asyncio.run(main())
