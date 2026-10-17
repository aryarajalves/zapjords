import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\9e4e5d4f-9650-40ba-9791-e5841d28c9de"

async def main():
    print("Iniciando Playwright...", flush=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        print("1. Verificando autenticação no mobile...", flush=True)
        await page.goto("http://127.0.0.1:5176", wait_until="commit")
        try:
            await page.wait_for_selector('input[type="email"]', state="visible", timeout=3500)
            print("Preenchendo login...", flush=True)
            await page.locator('input[type="email"]').fill('aryarajmarketing@gmail.com')
            await page.locator('input[type="password"]').fill('123456')
            await page.locator('button[type="submit"]').click()
            await page.wait_for_timeout(3500)
            print("Login efetuado!", flush=True)
        except Exception:
            print("Usuário já está autenticado na sessão!", flush=True)

        # 2. Navegar para Atendimento
        print("2. Navegando para Atendimento...", flush=True)
        menu_btn = page.locator('button[data-testid="open-mobile-sidebar-btn"]').first
        if await menu_btn.count() > 0:
            await menu_btn.click()
            await page.wait_for_timeout(1000)
            chat_nav = page.locator('button:has-text("Atendimento")').first
            if await chat_nav.count() > 0:
                await chat_nav.click()
                await page.wait_for_timeout(3000)
        print("Atendimento carregado!", flush=True)

        # 3. Clicar em uma conversa
        print("3. Abrindo conversa...", flush=True)
        convo_item = page.locator('div[role="button"], button').filter(has_text="Confirm").or_(page.locator('text="Contato"').or_(page.locator('text="Cíntia"'))).first
        if await convo_item.count() > 0:
            await convo_item.click()
        else:
            first_convo = page.locator('.cursor-pointer').filter(has_text=":").first
            if await first_convo.count() > 0:
                await first_convo.click()

        await page.wait_for_timeout(2500)

        # 4. Capturar evidencia do novo input com foco e espaço (HERO)
        print("4. Capturando evidencia do input hero no mobile...", flush=True)
        input_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_mobile_input_foco.png")
        await page.screenshot(path=input_shot)
        print(f"Salvo: {input_shot}", flush=True)

        # 5. Abrir menu de ações extras (+) do input e capturar
        print("5. Abrindo menu de acoes (+) no mobile...", flush=True)
        plus_btn = page.locator('button[data-testid="mobile-actions-toggle-btn"]').first
        if await plus_btn.count() > 0:
            await plus_btn.click()
            await page.wait_for_timeout(800)
            menu_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_mobile_input_menu_aberto.png")
            await page.screenshot(path=menu_shot)
            print(f"Salvo: {menu_shot}", flush=True)
            # Fechar menu clicando no backdrop
            backdrop = page.locator('.fixed.inset-0.z-30').first
            if await backdrop.count() > 0:
                await backdrop.click()
            else:
                await plus_btn.click()
            await page.wait_for_timeout(500)

        # 6. Abrir sidebar de dados do contato (Drawer overlay) e capturar
        print("6. Abrindo dados do contato (Drawer overlay)...", flush=True)
        details_btn = page.locator('button[data-testid="toggle-chat-details-btn"]').first
        if await details_btn.count() > 0:
            await details_btn.click()
            await page.wait_for_timeout(1200)
            sidebar_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_mobile_contact_sidebar_overlay.png")
            await page.screenshot(path=sidebar_shot)
            print(f"Salvo: {sidebar_shot}", flush=True)

        await browser.close()
        print("Todas as capturas concluidas com sucesso!", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
