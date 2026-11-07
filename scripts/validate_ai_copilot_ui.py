import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\4fe8aef3-dd33-490a-b0c2-0ffea8624b34"

def run():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("1. Acessando http://127.0.0.1:5176...")
        page.goto("http://127.0.0.1:5176", wait_until="load", timeout=45000)
        time.sleep(4)

        if page.locator('input[type="email"]').is_visible():
            print("2. Realizando login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            time.sleep(4)

        # 3. Abrir configurações primeiro para demonstrar aba de IA
        print("3. Abrindo modal de Configurações...")
        settings_btn = page.locator('button:has-text("Configurações"), [title="Configurações"]').first
        if not settings_btn.is_visible():
            settings_btn = page.locator('nav button').last

        if settings_btn.is_visible():
            settings_btn.click()
            time.sleep(2)

            # Clicar na aba Inteligência Artificial
            ai_tab = page.locator('button:has-text("Inteligência Artificial")').first
            if ai_tab.is_visible():
                ai_tab.click()
                time.sleep(2)
                shot_settings = os.path.join(ARTIFACT_DIR, "configuracoes_ia_modelos.png")
                page.screenshot(path=shot_settings)
                print(f"[OK] Screenshot das configuracoes de IA salvo: {shot_settings}")

                # Sub-aba Consumo & Financeiro
                fin_tab = page.locator('button:has-text("Consumo & Financeiro")').first
                if fin_tab.is_visible():
                    fin_tab.click()
                    time.sleep(2)
                    shot_fin = os.path.join(ARTIFACT_DIR, "configuracoes_ia_financeiro.png")
                    page.screenshot(path=shot_fin)
                    print(f"[OK] Screenshot do financeiro de IA salvo: {shot_fin}")

            # Fechar configurações
            close_btn = page.locator('button:has-text("Fechar"), button[aria-label="Fechar"]').first
            if close_btn.is_visible():
                close_btn.click()
                time.sleep(1)

        # 4. Navegar para Atendimento
        print("4. Navegando para Atendimento...")
        atendimento_btn = page.locator('button:has-text("Atendimento")').first
        if atendimento_btn.is_visible():
            atendimento_btn.click()
            time.sleep(4)

        # Selecionar uma conversa na lista
        convo_card = page.locator(".group\\/convo").first
        if convo_card.is_visible():
            convo_card.click()
            time.sleep(2)

        # Screenshot do Chat com o botão flutuante de Copiloto IA fechado
        shot_chat_closed = os.path.join(ARTIFACT_DIR, "chat_com_copiloto_ia_fechado.png")
        page.screenshot(path=shot_chat_closed)
        print(f"[OK] Screenshot do botao flutuante fechado salvo: {shot_chat_closed}")

        # Clicar no botão flutuante Copiloto IA
        copilot_btn = page.locator('button:has-text("Copiloto IA")').first
        if copilot_btn.is_visible():
            copilot_btn.click()
            time.sleep(2)

            shot_chat_open = os.path.join(ARTIFACT_DIR, "chat_com_copiloto_ia_aberto.png")
            page.screenshot(path=shot_chat_open)
            print(f"[OK] Screenshot do Copiloto Aberto salvo: {shot_chat_open}")

        print("Finalizado com sucesso!")
        browser.close()

if __name__ == "__main__":
    run()
