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

        # Scroll to Bussola section
        bussola_heading = page.locator('text="App Bússola Astrológica"').first
        if await bussola_heading.count() > 0:
            await bussola_heading.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)

        settings_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_bussola_settings.png")
        print(f"Salvando screenshot das Configurações em {settings_shot}...")
        await page.screenshot(path=settings_shot)

        # Fechar Modal de Configurações clicando em Cancelar
        print("Fechando modal de configurações...")
        cancel_btn = page.locator('button:has-text("Cancelar")').first
        if await cancel_btn.count() > 0:
            await cancel_btn.click()
        else:
            await page.keyboard.press("Escape")
        await page.wait_for_timeout(2000)

        # Step 5: Navigate to Integrations
        print("6. Navegando para Integrações Webhook...")
        integrations_nav = page.locator('aside button:has-text("Integrações Webhook")')
        await integrations_nav.click()
        await page.wait_for_timeout(3000)

        # Look for edit button on existing integration or "Nova Integração"
        edit_buttons = page.locator('button[title="Editar"], button:has-text("Editar")')
        if await edit_buttons.count() > 0:
            print("Abrindo edição da integração existente...")
            await edit_buttons.first.click()
        else:
            print("Nenhuma integração encontrada, clicando em Nova Integração...")
            new_btn = page.locator('button:has-text("Nova Integração")')
            await new_btn.click()

        await page.wait_for_timeout(2500)

        # Go to Tab "Gatilhos" in modal
        print("7. Acessando aba Gatilhos...")
        gatilhos_tab = page.locator('button:has-text("Gatilhos")').first
        if await gatilhos_tab.count() > 0:
            await gatilhos_tab.click()
            await page.wait_for_timeout(1500)

        # Check if there is a trigger mapping, or create one
        mapping_advanced_tab = page.locator('button:has-text("Avançado")')
        add_trigger_btn = page.locator('button:has-text("Adicionar Gatilho"), button:has-text("Novo Gatilho")')
        if await mapping_advanced_tab.count() == 0 and await add_trigger_btn.count() > 0:
            print("Adicionando novo gatilho...")
            await add_trigger_btn.first.click()
            await page.wait_for_timeout(1500)

        # Click Tab "Avançado" inside the trigger mapping
        print("8. Clicando na aba Avançado do gatilho...")
        advanced_subtabs = page.locator('button:has-text("Avançado")')
        if await advanced_subtabs.count() > 0:
            await advanced_subtabs.last.click()
            await page.wait_for_timeout(1200)

        # Find Bussola invite checkbox and check it
        print("9. Ativando switch de Criação Automática de Acesso (Bússola)...")
        bussola_card = page.locator('div.border-amber-500\\/10, div:has(h5:has-text("Bússola Astrológica"))').last
        if await bussola_card.count() > 0:
            checkbox = bussola_card.locator('input[type="checkbox"]').first
            if await checkbox.count() > 0:
                await checkbox.click(force=True)
                await page.wait_for_timeout(1000)
            
            # Rolar container interno para baixo para revelar os novos campos abertos
            scrollable = page.locator('.overflow-y-auto')
            count = await scrollable.count()
            for i in range(count):
                await scrollable.nth(i).evaluate("el => { el.scrollTop = el.scrollHeight; }")
            await page.wait_for_timeout(1000)

        gatilho_shot = os.path.join(ARTIFACT_DIR, "evidencia_depois_bussola_gatilho.png")
        print(f"Salvando screenshot do Gatilho em {gatilho_shot}...")
        await page.screenshot(path=gatilho_shot)

        await browser.close()
        print("Validação visual concluída com sucesso!")

if __name__ == "__main__":
    asyncio.run(main())
