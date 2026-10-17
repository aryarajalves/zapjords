import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\9e4e5d4f-9650-40ba-9791-e5841d28c9de"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Viewport padrão de smartphone (390 x 844)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        print("1. Efetuando login...")
        await page.goto("http://127.0.0.1:5176", wait_until="commit", timeout=30000)
        await page.wait_for_selector('input[type="email"]', timeout=15000)
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(3500)

        # 2. Abrir Drawer e navegar para Atendimento
        print("2. Abrindo menu mobile para navegar para Atendimento...")
        menu_btn = page.locator('button[data-testid="open-mobile-sidebar-btn"]').first
        if await menu_btn.count() > 0:
            await menu_btn.click()
            await page.wait_for_timeout(1000)
            chat_nav = page.locator('button:has-text("Atendimento")').first
            if await chat_nav.count() > 0:
                await chat_nav.click()
                await page.wait_for_timeout(3000)

        # 3. Clicar em uma conversa na lista
        print("3. Clicando em uma conversa na lista...")
        convo_item = page.locator('div[role="button"], button').filter(has_text="Confirm").or_(page.locator('text="Contato"').or_(page.locator('text="Cíntia"'))).first
        if await convo_item.count() > 0:
            await convo_item.click()
        else:
            # Fallback para qualquer conversa disponível
            first_convo = page.locator('.cursor-pointer').filter(has_text=":").first
            if await first_convo.count() > 0:
                await first_convo.click()

        await page.wait_for_timeout(2500)

        # 4. Capturar screenshot com a conversa aberta no Mobile
        chat_shot_path = os.path.join(ARTIFACT_DIR, "evidencia_depois_mobile_chat_aberto.png")
        await page.screenshot(path=chat_shot_path)
        print(f"Screenshot da conversa aberta salva em: {chat_shot_path}")

        # 5. Clicar no botão voltar mobile e capturar retorno à lista
        print("5. Testando botão voltar mobile...")
        back_btn = page.locator('button[data-testid="chat-mobile-back-btn"]').first
        if await back_btn.count() > 0:
            await back_btn.click()
            await page.wait_for_timeout(1500)
            list_shot_path = os.path.join(ARTIFACT_DIR, "evidencia_depois_mobile_chat_lista.png")
            await page.screenshot(path=list_shot_path)
            print(f"Screenshot de volta à lista salva em: {list_shot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
