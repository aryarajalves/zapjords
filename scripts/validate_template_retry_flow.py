import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\f8d39e89-6886-42e1-be82-3debab7e0ff3"

def run():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.goto("http://localhost:5176", wait_until="domcontentloaded")
        time.sleep(3)

        if page.locator('input[type="email"]').is_visible():
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            time.sleep(3)

        atendimento_btn = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento")').first
        if atendimento_btn.is_visible():
            atendimento_btn.click()
            time.sleep(3)

        first_convo = page.locator(".group\\/convo").first
        first_convo.wait_for(state="visible", timeout=10000)
        first_convo.click()
        time.sleep(2)

        # 1. Screenshot da tela de conversa com o contato Lucas Jordão e o erro
        shot1 = os.path.join(ARTIFACT_DIR, "evidence_template_retry_chat.png")
        page.screenshot(path=shot1, full_page=False)
        print(f"Screenshot 1: {shot1}")

        # 2. Clicar em Editar e Reenviar
        edit_retry_btn = page.locator('button:has-text("Editar e Reenviar")').first
        edit_retry_btn.wait_for(state="visible", timeout=10000)
        edit_retry_btn.click()
        time.sleep(2)

        # 3. Screenshot do modal aberto para edição
        shot2 = os.path.join(ARTIFACT_DIR, "evidence_template_retry_modal_open.png")
        page.screenshot(path=shot2, full_page=False)
        print(f"Screenshot 2: {shot2}")

        browser.close()
        print("Evidências salvas com sucesso!")

if __name__ == "__main__":
    run()
