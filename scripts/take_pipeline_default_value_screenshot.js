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
    await page.waitForTimeout(2000);

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Clicar no botão de editar pipeline ou Novo Pipeline
    console.log('Abrindo modal de configuração do pipeline...');
    // Procurar botão de editar pipeline (ícone FiSettings ou tooltip)
    const editPipelineBtn = page.locator('button[title*="Configurações"], button[title*="Editar"], button:has-text("Editar")');
    if (await editPipelineBtn.count() > 0) {
      await editPipelineBtn.first().click();
    } else {
      // Fallback para botão "Novo Pipeline"
      const newPipelineBtn = page.locator('button:has-text("Novo Pipeline")');
      if (await newPipelineBtn.count() > 0) {
        await newPipelineBtn.first().click();
      }
    }

    await page.waitForTimeout(1500);

    // Localizar o campo "Valor Padrão da Venda (R$)"
    const defaultValueInput = page.locator('input[placeholder="0.00"]');
    if (await defaultValueInput.count() > 0) {
      console.log('Preenchendo o valor padrão com 497.00 para demonstração visual...');
      await defaultValueInput.fill('497.00');
    }

    await page.waitForTimeout(1000);

    // Screenshot do Modal com o novo campo "Valor Padrão da Venda (R$)"
    const modalScreenshot = path.join(screenshotDir, 'pipeline_default_value_modal.png');
    await page.screenshot({ path: modalScreenshot, fullPage: false });
    console.log('Screenshot do Modal salvo em:', modalScreenshot);

  } catch (error) {
    console.error('Erro na execução do script:', error);
  } finally {
    await browser.close();
  }
}

run();
