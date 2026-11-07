import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\4fe8aef3-dd33-490a-b0c2-0ffea8624b34"

def test_visibility():
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

        # 3. Navegar para Atendimento pelo menu
        print("3. Clicando no menu Atendimento...")
        atendimento_btn = page.locator('button:has-text("Atendimento")').first
        if atendimento_btn.is_visible():
            atendimento_btn.click()
            time.sleep(3)

        # Estado 1: Nenhuma conversa selecionada
        copilot_btn = page.locator('button:has-text("Copiloto IA")')
        is_visible_empty = copilot_btn.is_visible()
        print(f"Estado 1 (Sem conversa selecionada) -> Botão Copiloto visível? {is_visible_empty}")
        
        shot1 = os.path.join(ARTIFACT_DIR, "chat_sem_conversa_sem_copiloto.png")
        page.screenshot(path=shot1)
        print(f"Screenshot 1 salvo em: {shot1}")

        # Estado 2: Clicar em uma conversa da lista
        print("4. Selecionando uma conversa da lista lateral...")
        convo_card = page.locator(".group\\/convo").first
        if convo_card.is_visible():
            convo_card.click()
            time.sleep(2)
            is_visible_active = copilot_btn.is_visible()
            print(f"Estado 2 (Com conversa selecionada) -> Botão Copiloto visível? {is_visible_active}")

            shot2 = os.path.join(ARTIFACT_DIR, "chat_com_conversa_com_copiloto.png")
            page.screenshot(path=shot2)
            print(f"Screenshot 2 salvo em: {shot2}")
        else:
            print("Item .group/convo não estava visível imediatamente, aguardando...")
            convo_card.wait_for(state="visible", timeout=10000)
            convo_card.click()
            time.sleep(2)
            is_visible_active = copilot_btn.is_visible()
            print(f"Estado 2 (Com conversa selecionada) -> Botão Copiloto visível? {is_visible_active}")

            shot2 = os.path.join(ARTIFACT_DIR, "chat_com_conversa_com_copiloto.png")
            page.screenshot(path=shot2)
            print(f"Screenshot 2 salvo em: {shot2}")

        browser.close()

if __name__ == "__main__":
    test_visibility()
