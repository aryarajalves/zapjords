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
      console.log('Preenchendo credenciais de login...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('Aguardando interface carregar...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Screenshot mostrando o menu lateral com Disparo em Massa, Kanban de Vendas, Disparo Recorrente Criado e sem E-mail Marketing
    const sidebarCleanPath = path.join(screenshotDir, 'sidebar_without_email_marketing.png');
    await page.screenshot({ path: sidebarCleanPath, fullPage: false });
    console.log('Screenshot salvo em:', sidebarCleanPath);

  } catch (error) {
    console.error('Erro na captura:', error);
  } finally {
    await browser.close();
  }
}

run();
