import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\97d5a1f1-aa70-4136-a595-ff71f65d5e6f"

def run():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("1. Acessando http://localhost:5176...")
        page.goto("http://localhost:5176", wait_until="domcontentloaded")
        time.sleep(3)

        if page.locator('input[type="email"]').is_visible():
            print("2. Login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            time.sleep(4)

        print("3. Clicando em Integrações Webhook...")
        int_menu_btn = page.locator('button:has-text("Integrações Webhook")').first
        int_menu_btn.wait_for(state="visible", timeout=10000)
        int_menu_btn.click()
        time.sleep(3)

        print("4. Clicando em Editar na primeira integração...")
        edit_btn = page.locator('button[title="Editar"]').first
        edit_btn.wait_for(state="visible", timeout=10000)
        edit_btn.click()
        time.sleep(3)

        print("5. Clicando na aba Gatilhos dentro do modal...")
        modal = page.locator('.fixed.inset-0')
        modal_gatilhos = modal.locator('button:has-text("Gatilhos")').first
        modal_gatilhos.wait_for(state="visible", timeout=10000)
        modal_gatilhos.click(force=True)
        time.sleep(2)

        # Rolar modal ou dar foco na prévia do template
        screenshot_path = os.path.join(ARTIFACT_DIR, "evidencia_previa_apenas_whatsapp_oficial.png")
        page.screenshot(path=screenshot_path)
        print(f"Screenshot salvo em: {screenshot_path}")

        browser.close()
        print("Validação visual concluída com sucesso!")

if __name__ == "__main__":
    run()
