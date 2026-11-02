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
        time.sleep(2)

        if page.locator('input[type="email"]').is_visible():
            print("2. Realizando login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            time.sleep(3)

        print("3. Clicando no menu 'Atendimento'...")
        atendimento_btn = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento")').first
        atendimento_btn.wait_for(state="visible", timeout=15000)
        atendimento_btn.click()
        time.sleep(3)

        print("4. Selecionando a primeira conversa...")
        convo_locator = page.locator(".group\\/convo").first
        convo_locator.wait_for(state="visible", timeout=15000)
        convo_locator.click()
        time.sleep(2)

        print("5. Verificando se o painel lateral de detalhes está aberto...")
        edit_btn = page.locator('[data-testid="edit-contact-name-btn"]')
        if not edit_btn.is_visible():
            print("Abrindo detalhes do contato...")
            page.locator('[data-testid="toggle-chat-details-btn"]').click()
            time.sleep(1)

        print("6. Clicando no botão de editar nome do contato...")
        edit_btn.wait_for(state="visible", timeout=5000)
        edit_btn.click()
        time.sleep(1)

        print("7. Focando no input e apagando caracteres com Backspace...")
        input_name = page.locator('[data-testid="edit-contact-name-input"]')
        input_name.wait_for(state="visible", timeout=5000)
        input_name.focus()
        page.keyboard.press("End")
        for _ in range(5):
            page.keyboard.press("Backspace")
            time.sleep(0.1)

        print("8. Digitando novo sufixo para testar edição ativa...")
        page.keyboard.type(" Editado")

        print("9. Aguardando 6.5 segundos para garantir que o polling de 5s não fecha nem pula o contato...")
        time.sleep(6.5)

        is_still_editing = input_name.is_visible()
        current_val = input_name.input_value()
        print(f"Input continua visível? {is_still_editing} | Valor atual: '{current_val}'")

        screenshot_path = os.path.join(ARTIFACT_DIR, "evidencia_edicao_nome_contato_estavel.png")
        page.screenshot(path=screenshot_path)
        print(f"Screenshot salva em: {screenshot_path}")

        assert is_still_editing, "Erro: O input de edição fechou sozinho durante a digitação/espera!"
        print("✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO! O input permaneceu perfeitamente aberto e estável.")

if __name__ == "__main__":
    run()
