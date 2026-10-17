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

        print("1. Navegando para o ZapVoice...")
        await page.goto("http://localhost:5176", wait_until="networkidle", timeout=30000)

        # Login
        print("2. Realizando login...")
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()

        print("3. Aguardando painel carregar...")
        await page.wait_for_timeout(4000)

        # Select client if needed
        client_selector = page.locator('button:has-text("Sem cliente selecionado"), button:has-text("ID:")')
        if await client_selector.count() > 0:
            print("Selecionando cliente...")
            await client_selector.first.click()
            await page.wait_for_timeout(1000)
            fonte_oculta = page.locator('button:has-text("Fonte Oculta")')
            if await fonte_oculta.count() > 0:
                await fonte_oculta.first.click()
            else:
                first_option = page.locator('div.max-h-60 button').first
                if await first_option.count() > 0:
                    await first_option.click()
            await page.wait_for_timeout(3000)

        # Step 4: Open Settings Modal
        print("4. Abrindo Configurações...")
        settings_btn = page.locator('aside button:has-text("Configurações")')
        await settings_btn.click()
        await page.wait_for_timeout(1500)

        # Click Tab "Avançado" in Settings
        print("5. Clicando na aba Avançado das Configurações...")
        advanced_tab_btn = page.locator('button:has-text("Avançado")').first
        await advanced_tab_btn.click()
        await page.wait_for_timeout(1500)

        # Scroll to AgentFlow section
        print("6. Localizando painel unificado AgentFlow...")
        agentflow_heading = page.locator('text="AgentFlow (Agente de IA)"').first
        if await agentflow_heading.count() > 0:
            await agentflow_heading.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)

        agentflow_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_agentflow.png")
        print(f"Salvando screenshot do painel AgentFlow em {agentflow_shot}...")
        await page.screenshot(path=agentflow_shot)

        await browser.close()
        print("Validação visual do AgentFlow concluída com sucesso!")

if __name__ == "__main__":
    asyncio.run(main())
