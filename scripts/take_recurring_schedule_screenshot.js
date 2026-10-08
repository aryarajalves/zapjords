const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
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

    // Selecionar Cliente ID 14 (Cliente - Crassus) se não estiver selecionado
    const clientSelector = page.locator('aside button:has-text("Cliente - Crassus"), aside button:has-text("ID: 14")');
    if (await clientSelector.count() === 0) {
      console.log('Selecionando Cliente - Crassus (ID: 14) no menu lateral...');
      // Clica no dropdown de clientes
      const dropdownBtn = page.locator('aside button').first();
      await dropdownBtn.click();
      await page.waitForTimeout(1000);
      
      const crassusBtn = page.locator('button:has-text("Cliente - Crassus")');
      if (await crassusBtn.count() > 0) {
        await crassusBtn.first().click();
        await page.waitForTimeout(2000);
      }
    }

    // Clicar na aba "Disparo Recorrente Criado"
    console.log('Clicando na aba Disparo Recorrente Criado...');
    const recurringTab = page.locator('button:has-text("Disparo Recorrente Criado"), a:has-text("Disparo Recorrente Criado")');
    await recurringTab.first().click();
    await page.waitForTimeout(3000);

    // Aguardar o card aparecer
    await page.waitForSelector('text=cartao_recusado_bussula, text=Ativo', { timeout: 10000 });
    console.log('Card do disparo recorrente encontrado na tela!');

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, 'disparo_recorrente_criado.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot salvo com sucesso em:', screenshotPath);

  } catch (err) {
    console.error('Erro na automação do browser:', err);
    // Tenta tirar screenshot do erro se a página estiver aberta
    try {
      await page.screenshot({ path: path.join(__dirname, 'screenshots', 'erro_screenshot.png') });
    } catch (_) {}
  } finally {
    await browser.close();
  }
}

run();
