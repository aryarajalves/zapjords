import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\9e4e5d4f-9650-40ba-9791-e5841d28c9de"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        # Emula um iPhone 14/15 (390 x 844)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        print("1. Acessando frontend...")
        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)

        # Login
        print("2. Preenchendo credenciais...")
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()

        print("3. Aguardando login...")
        await page.wait_for_timeout(3000)

        # Configurar cliente ativo 14 (Crassus) e view templates
        print("4. Configurando localStorage com cliente 14 e view 'templates'...")
        await page.evaluate("""() => {
            localStorage.setItem('activeClientId', '14');
            localStorage.setItem('currentView', 'templates');
        }""")
        await page.goto("http://localhost:5176", wait_until="networkidle")
        await page.wait_for_timeout(3500)

        # 5. Validar Aba 1 (Criar Template)
        print("5. Validando visualização da Aba 1 (Criar Template)...")
        tab_create = page.locator('[data-testid="tab-create-template"]')
        await tab_create.wait_for(state="visible", timeout=15000)
        
        path_aba_criar = os.path.join(ARTIFACT_DIR, "evidencia_depois_template_mobile_aba_criar.png")
        await page.screenshot(path=path_aba_criar)
        print(f"-> Salvo: {path_aba_criar}")

        # 6. Validar Aba 2 (Meus Templates)
        print("6. Clicando na aba 'Meus Templates'...")
        tab_list = page.locator('[data-testid="tab-my-templates"]')
        await tab_list.click()
        await page.wait_for_timeout(2000)

        path_aba_lista = os.path.join(ARTIFACT_DIR, "evidencia_depois_template_mobile_aba_lista.png")
        await page.screenshot(path=path_aba_lista)
        print(f"-> Salvo: {path_aba_lista}")

        # 7. Clicar em EDITAR em algum template da lista para validar o auto-switch
        print("7. Testando clique em EDITAR para validar retorno automático ao formulário...")
        edit_btn = page.locator('button:has-text("EDITAR")').first
        if await edit_btn.count() > 0:
            await edit_btn.click()
            await page.wait_for_timeout(2000)

            path_auto_switch = os.path.join(ARTIFACT_DIR, "evidencia_depois_template_mobile_auto_switch_editar.png")
            await page.screenshot(path=path_auto_switch)
            print(f"-> Salvo auto switch de edição: {path_auto_switch}")
        else:
            print("Nenhum botão de editar disponível no momento.")

        await browser.close()
        print("Validação visual concluída com sucesso!")

if __name__ == "__main__":
    asyncio.run(main())
