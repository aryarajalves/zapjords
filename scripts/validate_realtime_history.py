import asyncio
import os
import requests
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\aryar\.gemini\antigravity\brain\e001089d-fecd-4eb8-881b-8f17ed9f40ed"

async def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1400, "height": 950})

        print("1. Navegando para o sistema...")
        await page.goto("http://localhost:5176", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)

        # Login
        print("2. Efetuando login...")
        await page.locator('input[type="email"]').first.fill('aryarajmarketing@gmail.com')
        await page.locator('input[type="password"]').first.fill('123456')
        await page.locator('button[type="submit"], button:has-text("Entrar")').first.click()

        print("3. Aguardando autenticação...")
        await page.wait_for_timeout(4000)

        # Configurar cliente ativo 14
        print("4. Configurando cliente ativo 14...")
        await page.evaluate("""() => {
            localStorage.setItem('activeClientId', '14');
        }""")
        await page.goto("http://localhost:5176", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # Navegar para Integrações
        print("5. Clicando em Integrações...")
        nav_btn = page.locator('aside button:has-text("Integrações")').first
        await nav_btn.click()
        await page.wait_for_timeout(4000)

        # Captura print ANTES
        antes_path = os.path.join(ARTIFACT_DIR, "integrations_realtime_antes.png")
        print(f"6. Capturando print ANTES em {antes_path}...")
        await page.screenshot(path=antes_path)

        # Obter o token JWT do localStorage para disparar webhook de teste
        token = await page.evaluate("() => localStorage.getItem('token')")
        print("7. Disparando teste de webhook para gerar novo dado no histórico em tempo real...")
        
        # Obter IDs das integrações via API
        resp = requests.get(
            "http://localhost:8000/api/webhook-integrations",
            headers={"Authorization": f"Bearer {token}", "x-client-id": "14"}
        )
        integrations = resp.json() if resp.status_code == 200 else []
        if integrations:
            target_int = integrations[0]
            int_id = target_int["id"]
            print(f"Disparando webhook de teste na integração: {target_int.get('name')} (ID: {int_id})...")
            
            test_resp = requests.post(
                f"http://localhost:8000/api/webhook-integrations/{int_id}/test",
                headers={"Authorization": f"Bearer {token}", "x-client-id": "14"},
                json={
                    "event": "PURCHASE_APPROVED",
                    "data": {
                        "buyer": {"name": "Cliente Realtime WebSocket", "checkout_phone": "5511977776666"},
                        "product": {"name": "Produto WebSocket Realtime"},
                        "purchase": {"status": "APPROVED"}
                    }
                }
            )
            print("Resposta do teste:", test_resp.status_code, test_resp.json() if test_resp.status_code == 200 else test_resp.text)

        # Aguardar evento de WebSocket ser recebido na interface
        print("8. Aguardando WebSocket atualizar a tabela em tempo real...")
        await page.wait_for_timeout(1500)

        # Captura print DEPOIS com indicador de tempo real e pulso no botão
        depois_table_path = os.path.join(ARTIFACT_DIR, "integrations_realtime_depois_tabela.png")
        print(f"9. Capturando print DEPOIS (Tabela com feedback em tempo real) em {depois_table_path}...")
        await page.screenshot(path=depois_table_path)

        # Clicar no botão Histórico
        print("10. Clicando no botão Histórico...")
        history_btn = page.locator('button:has-text("Histórico")').first
        await history_btn.click()
        await page.wait_for_timeout(3000)

        # Captura print do Modal de Histórico aberto
        modal_path = os.path.join(ARTIFACT_DIR, "integrations_realtime_modal_historico.png")
        print(f"11. Capturando print do Modal de Histórico em {modal_path}...")
        await page.screenshot(path=modal_path)

        print(" Validação visual concluída com sucesso!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
