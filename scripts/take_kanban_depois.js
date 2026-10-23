const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

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
    console.log('Clicando na aba Kanban de Vendas no menu lateral...');
    const kanbanNavBtn = page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")');
    if (await kanbanNavBtn.count() > 0) {
      await kanbanNavBtn.first().click();
      await page.waitForTimeout(3000);
    }

    // Aguardar o cabeçalho e as colunas do Kanban
    console.log('Aguardando carregamento do quadro Kanban...');
    await page.waitForSelector('text=Kanban de Vendas', { timeout: 15000 });
    await page.waitForTimeout(2500);

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Screenshot 1: Visão Geral do Kanban de Vendas (com canais nos cards e botão + Nova Coluna)
    const boardScreenshot = path.join(screenshotDir, 'kanban_vendas_board_depois.png');
    await page.screenshot({ path: boardScreenshot, fullPage: false });
    console.log('Screenshot 1 (Board Depois) salvo em:', boardScreenshot);

    // Screenshot 2: Modal de Oportunidade com Canal de Origem
    const newDealBtn = page.locator('button:has-text("Nova Oportunidade")');
    if (await newDealBtn.count() > 0) {
      await newDealBtn.first().click();
      await page.waitForTimeout(1500);
      const modalScreenshot = path.join(screenshotDir, 'kanban_vendas_modal_depois.png');
      await page.screenshot({ path: modalScreenshot, fullPage: false });
      console.log('Screenshot 2 (Modal Oportunidade com Canal) salvo em:', modalScreenshot);
      
      // Fechar modal
      await page.locator('button:has-text("Cancelar")').first().click();
      await page.waitForTimeout(1000);
    }

    // Screenshot 3: Modal de Nova Coluna do CRM
    const newStageBtn = page.locator('button:has-text("+ Nova Coluna"), button:has-text("Nova Coluna")').first();
    if (await newStageBtn.count() > 0) {
      await newStageBtn.click();
      await page.waitForTimeout(1500);
      const stageModalScreenshot = path.join(screenshotDir, 'kanban_vendas_stage_modal_depois.png');
      await page.screenshot({ path: stageModalScreenshot, fullPage: false });
      console.log('Screenshot 3 (Modal Nova Coluna) salvo em:', stageModalScreenshot);
    }

  } catch (error) {
    console.error('Erro na execução do script:', error);
  } finally {
    await browser.close();
  }
}

run();
