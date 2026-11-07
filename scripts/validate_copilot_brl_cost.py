import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\4fe8aef3-dd33-490a-b0c2-0ffea8624b34"

def test_copilot_brl_cost():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("1. Acessando frontend...")
        page.goto("http://localhost:5176", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)

        if page.locator('input[type="email"]').is_visible():
            print("2. Fazendo login...")
            page.fill('input[type="email"]', "aryarajmarketing@gmail.com")
            page.fill('input[type="password"]', "123456")
            page.click('button[type="submit"]')
            time.sleep(4)

        print("3. Entrando em Atendimento...")
        atendimento_btn = page.locator('button:has-text("Atendimento")').first
        if atendimento_btn.is_visible():
            atendimento_btn.click()
            time.sleep(3)

        # Selecionar uma conversa
        print("4. Selecionando uma conversa...")
        convo_card = page.locator(".group\\/convo").first
        convo_card.wait_for(state="visible", timeout=15000)
        convo_card.click()
        time.sleep(3)

        # Abrir Copiloto IA
        print("5. Abrindo Copiloto IA...")
        copilot_btn = page.locator('button:has-text("Copiloto IA")').first
        copilot_btn.wait_for(state="visible", timeout=10000)
        copilot_btn.click()
        time.sleep(2)

        # Enviar pergunta rápida ou mensagem para a IA
        print("6. Enviando mensagem no Copiloto IA...")
        sugerir_btn = page.locator('button:has-text("Sugerir Resposta")').first
        if sugerir_btn.is_visible():
            sugerir_btn.click()
        else:
            input_box = page.locator('input[placeholder*="Pergunte ao Copiloto"]')
            input_box.fill("Olá, como abordar este lead?")
            input_box.press("Enter")

        print("7. Aguardando resposta da IA (até 30s)...")
        # Esperar até que uma mensagem com '⚡' ou 'tok' apareça
        try:
            page.locator('text=⚡').first.wait_for(state="visible", timeout=35000)
            time.sleep(2)
        except Exception as e:
            print(f"Aviso ao aguardar resposta da IA: {e}")

        shot_path = os.path.join(ARTIFACT_DIR, "chat_copiloto_custo_em_reais.png")
        page.screenshot(path=shot_path)
        print(f"Screenshot salvo em: {shot_path}")

        browser.close()

if __name__ == "__main__":
    test_copilot_brl_cost()
