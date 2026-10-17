import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\9e4e5d4f-9650-40ba-9791-e5841d28c9de"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        # 1. Teste Mobile (iPhone 14/15, 390 x 844)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        print("1. Acessando frontend em resolução mobile...")
        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)

        # Login
        print("2. Login...")
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page.wait_for_timeout(3000)

        # Configura cliente 14 e view 'schedules'
        print("3. Abrindo Agenda de Disparos ('schedules')...")
        await page.evaluate("""() => {
            localStorage.setItem('activeClientId', '14');
            localStorage.setItem('currentView', 'schedules');
        }""")
        await page.goto("http://localhost:5176", wait_until="networkidle")
        await page.wait_for_timeout(3500)

        # Captura 1: Visualização Mês + Agenda do Dia no Mobile
        print("4. Capturando tela do Calendário Mês (Mobile)...")
        path_mes = os.path.join(ARTIFACT_DIR, "evidencia_depois_agenda_mobile_mes.png")
        await page.screenshot(path=path_mes)
        print(f"-> Salvo: {path_mes}")

        # Captura 2: Alternar para Modo Lista no Mobile
        print("5. Alternando para modo Lista...")
        btn_list = page.locator('[data-testid="btn-view-list"]')
        await btn_list.wait_for(state="visible", timeout=10000)
        await btn_list.click()
        await page.wait_for_timeout(2000)

        path_lista = os.path.join(ARTIFACT_DIR, "evidencia_depois_agenda_mobile_lista.png")
        await page.screenshot(path=path_lista)
        print(f"-> Salvo: {path_lista}")

        await context.close()

        # 2. Teste Desktop (1400 x 900)
        print("6. Abrindo em resolução Desktop...")
        page_desk = await browser.new_page(viewport={"width": 1400, "height": 900})
        await page_desk.goto("http://localhost:5176", wait_until="networkidle")
        await page_desk.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page_desk.locator('input[type="password"]').first.fill('123456')
        await page_desk.locator('button[type="submit"], button:has-text("Entrar")').first.click()
        await page_desk.wait_for_timeout(3000)

        await page_desk.evaluate("""() => {
            localStorage.setItem('activeClientId', '14');
            localStorage.setItem('currentView', 'schedules');
        }""")
        await page_desk.goto("http://localhost:5176", wait_until="networkidle")
        await page_desk.wait_for_timeout(3500)

        path_desk = os.path.join(ARTIFACT_DIR, "evidencia_depois_agenda_desktop.png")
        await page_desk.screenshot(path=path_desk)
        print(f"-> Salvo Desktop: {path_desk}")

        await browser.close()
        print("Validação visual concluída com sucesso!")

if __name__ == "__main__":
    asyncio.run(main())
