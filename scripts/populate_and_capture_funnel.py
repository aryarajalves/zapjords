import time
import requests
from playwright.sync_api import sync_playwright

def run():
    # 1. Login na API para obter token
    login_res = requests.post("http://localhost:8000/api/auth/token", data={"username": "aryarajmarketing@gmail.com", "password": "123456"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "X-Client-ID": "15"}

    # 2. Pegar pipelines
    pipes = requests.get("http://localhost:8000/api/crm/pipelines", headers=headers).json()
    if pipes:
        pipe_id = pipes[0]["id"]
        board = requests.get(f"http://localhost:8000/api/crm/pipelines/{pipe_id}/board", headers=headers).json()
        stages = {s["name"].upper(): s["id"] for s in board["stages"]}
        
        # Adicionar mais alguns leads em etapas diferentes para demonstrar o funil populado
        lead_stage_id = stages.get("LEAD")
        won_stage_id = stages.get("VENDA") or stages.get("FECHADO (GANHO)")
        desist_stage_id = stages.get("DESISTENCIA") or stages.get("DESISTÊNCIA")

        if lead_stage_id:
            requests.post("http://localhost:8000/api/crm/deals", json={
                "pipeline_id": pipe_id,
                "stage_id": lead_stage_id,
                "contact_name": "Ana Paula Rodrigues",
                "contact_phone": "5511988881111",
                "channel": "kiwify",
                "value": 1500.0,
                "status": "open"
            }, headers=headers)
            requests.post("http://localhost:8000/api/crm/deals", json={
                "pipeline_id": pipe_id,
                "stage_id": lead_stage_id,
                "contact_name": "Marcos Vinicius",
                "contact_phone": "5511988882222",
                "channel": "instagram",
                "value": 2000.0,
                "status": "open"
            }, headers=headers)

        if won_stage_id:
            requests.post("http://localhost:8000/api/crm/deals", json={
                "pipeline_id": pipe_id,
                "stage_id": won_stage_id,
                "contact_name": "Beatriz Mendes",
                "contact_phone": "5511988883333",
                "channel": "hotmart",
                "value": 5000.0,
                "status": "won"
            }, headers=headers)

        if desist_stage_id:
            requests.post("http://localhost:8000/api/crm/deals", json={
                "pipeline_id": pipe_id,
                "stage_id": desist_stage_id,
                "contact_name": "Rodrigo Silva",
                "contact_phone": "5511988884444",
                "channel": "whatsapp",
                "value": 0.0,
                "status": "lost",
                "lost_reason": "Sem orçamento no momento"
            }, headers=headers)

    # 3. Agora abrir o navegador Playwright e tirar o print com o funil distribuído
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        page.goto("http://localhost:5176/login", wait_until="networkidle")
        page.fill('input[type="email"]', 'aryarajmarketing@gmail.com')
        page.fill('input[type="password"]', '123456')
        page.click('button[type="submit"]')

        page.wait_for_selector('text=Kanban de Vendas', timeout=15000)
        page.locator("button:has-text('Kanban de Vendas')").first.click()
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        page.wait_for_selector('text=Taxa de Conversão', timeout=10000)
        page.wait_for_selector('text=Distribuição do Funil', timeout=10000)

        screenshot_path = "C:/Users/aryar/.gemini/antigravity/brain/0e0eda03-2ae8-4834-a90a-b2b532b5f4a8/kanban_taxa_conversao_funil_completo_depois.png"
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"Screenshot com funil populado salvo em: {screenshot_path}")

        browser.close()

if __name__ == '__main__':
    run()
