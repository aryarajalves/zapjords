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

    // Clicar em Atendimento
    console.log('Clicando na aba Atendimento...');
    const chatBtn = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento")');
    if (await chatBtn.count() > 0) {
      await chatBtn.first().click();
      await page.waitForTimeout(3000);
    }

    // Clicar na conversa "Aryaraj"
    console.log('Clicando na conversa Aryaraj...');
    const convoName = page.locator('h4:has-text("Aryaraj"), span:has-text("Aryaraj"), div:has-text("Aryaraj")').last();
    await convoName.click();
    await page.waitForTimeout(3000);

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Screenshot com a conversa aberta e o botão CRM visível na barra lateral
    const chatScreenshot = path.join(screenshotDir, 'chat_crm_convo_open.png');
    await page.screenshot({ path: chatScreenshot, fullPage: false });
    console.log('Screenshot Chat com conversa aberta salvo em:', chatScreenshot);

    // Clicar no botão "Kanban de Vendas"
    const crmBtn = page.locator('[data-testid="crm-add-deal-button"], button:has-text("Kanban de Vendas")').last();
    if (await crmBtn.count() > 0) {
      console.log('Clicando no botão Kanban de Vendas...');
      await crmBtn.click();
      await page.waitForTimeout(1500);

      const modalScreenshot = path.join(screenshotDir, 'chat_crm_modal_open.png');
      await page.screenshot({ path: modalScreenshot, fullPage: false });
      console.log('Screenshot Chat CRM Modal aberto salvo em:', modalScreenshot);
    }
  } catch (error) {
    console.error('Erro na execução do script:', error);
  } finally {
    await browser.close();
  }
}

run();
