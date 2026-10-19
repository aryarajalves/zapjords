import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\bac392c0-e46e-4ffb-b46b-e2d6a6480f85"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 950})
        page = await context.new_page()

        print("1. Navegando para o ZapVoice...")
        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)

        # Login se necessário
        email = page.locator('input[type="email"]')
        if await email.count() > 0 and await email.is_visible():
            print("2. Realizando login...")
            await email.first.fill('aryarajmarketing@gmail.com')
            await page.locator('input[type="password"]').first.fill('123456')
            await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
            await page.wait_for_timeout(3000)

        # Definir activeClientId = '14' (Cliente - Crassus, que possui compra_aprovada_astrowake)
        print("3. Definindo activeClientId=14 no localStorage...")
        await page.evaluate('''() => {
            localStorage.setItem("activeClientId", "14");
        }''')
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(4000)

        # Aguardar container de templates
        print("4. Aguardando container de templates...")
        await page.wait_for_selector('.template-dropdown-container', timeout=15000)

        # Abre o dropdown de templates
        print("5. Abrindo dropdown de templates...")
        dropdown_trigger = page.locator('.template-dropdown-container > div').first
        await dropdown_trigger.click()
        await page.wait_for_timeout(1500)

        # Procura especificamente o template 'compra_aprovada_astrowake'
        print("6. Procurando compra_aprovada_astrowake...")
        template_opt = page.locator('.template-dropdown-container .overflow-y-auto > div:has-text("compra_aprovada_astrowake")')
        if await template_opt.count() > 0:
            print("Encontrado compra_aprovada_astrowake! Clicando...")
            await template_opt.first.click()
        else:
            print("Item com compra_aprovada_astrowake não encontrado por has-text, listando itens disponíveis:")
            items = page.locator('.template-dropdown-container .overflow-y-auto > div')
            cnt = await items.count()
            for i in range(cnt):
                print(f"[{i}]: {repr(await items.nth(i).inner_text())}")
            if cnt > 1:
                await items.nth(1).click()

        await page.wait_for_timeout(2000)

        # Localiza o botão 'Resetar Janela de 24h'
        reset_btn = page.locator('button:has-text("Resetar Janela de 24h")')
        await reset_btn.wait_for(state="visible", timeout=10000)
        print("Botão 'Resetar Janela de 24h' localizado com sucesso!")

        # Redimensiona para 600px de largura (simulando viewport onde antes ficava cortado)
        print("7. Redimensionando para 600px de largura...")
        await page.set_viewport_size({"width": 600, "height": 900})
        await page.wait_for_timeout(1500)

        # Rola até o botão e template
        await reset_btn.first.scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)

        # Salva o screenshot Depois
        shot_path = os.path.join(ARTIFACT_DIR, "reset_24h_badge_depois.png")
        print(f"8. Salvando screenshot Depois em {shot_path}...")
        await page.screenshot(path=shot_path)
        print("Concluído com sucesso!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
