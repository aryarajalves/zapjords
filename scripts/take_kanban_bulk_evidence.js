const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactDir = 'C:/Users/aryar/.gemini/antigravity/brain/97d5a1f1-aa70-4136-a595-ff71f65d5e6f';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  try {
    console.log('Navegando para o frontend http://localhost:5176...');
    await page.goto('http://localhost:5176', { timeout: 60000 });

    // Login se estiver na tela de login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('Preenchendo login...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('Aguardando interface carregar...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    // Clicar na aba "Kanban de Vendas"
    console.log('Clicando na aba Kanban de Vendas...');
    const kanbanNavBtn = page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")');
    if (await kanbanNavBtn.count() > 0) {
      await kanbanNavBtn.first().click();
      await page.waitForTimeout(3000);
    }

    await page.waitForSelector('text=Kanban de Vendas', { timeout: 15000 });
    await page.waitForTimeout(2500);

    // Evidência: Selecionar todos os leads de uma única coluna pelo checkbox do cabeçalho da coluna
    const columnCheckboxes = page.locator('input[aria-label^="Selecionar todos os leads da coluna"]');
    const colCount = await columnCheckboxes.count();
    console.log(`Encontradas ${colCount} colunas com checkbox de seleção.`);

    if (colCount > 0) {
      // Clica no checkbox da primeira coluna com leads (geralmente LEAD ou VENDA)
      await columnCheckboxes.first().click();
      await page.waitForTimeout(1000);

      const colSelectionPath = path.join(artifactDir, 'evidencia_selecao_coluna_kanban.png');
      await page.screenshot({ path: colSelectionPath, fullPage: false });
      console.log('Evidência (Seleção de Coluna Única) salva:', colSelectionPath);
    }

  } catch (error) {
    console.error('Erro na captura:', error);
  } finally {
    await browser.close();
  }
}

run();
