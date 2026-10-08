const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5176', { timeout: 60000 });

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    // Selecionar Cliente ID 14
    const clientSelector = page.locator('aside button:has-text("Cliente - Crassus"), aside button:has-text("ID: 14")');
    if (await clientSelector.count() === 0) {
      const dropdownBtn = page.locator('aside button').first();
      await dropdownBtn.click();
      await page.waitForTimeout(1000);
      const crassusBtn = page.locator('button:has-text("Cliente - Crassus")');
      if (await crassusBtn.count() > 0) {
        await crassusBtn.first().click();
        await page.waitForTimeout(2000);
      }
    }

    // Clicar na aba
    const recurringTab = page.locator('button:has-text("Disparo Recorrente Criado"), a:has-text("Disparo Recorrente Criado")');
    await recurringTab.first().click();
    await page.waitForTimeout(2500);

    // Clicar no botão "Ver Contatos" (ícone de usuários / title="Ver Contatos")
    console.log('Clicando em Ver Contatos...');
    const contactsBtn = page.locator('button[title="Ver Contatos"]');
    if (await contactsBtn.count() > 0) {
      await contactsBtn.first().click();
      await page.waitForTimeout(2000);
      
      // Selecionar "Últimos 14 dias" no filtro de interação
      const interactionSelect = page.locator('select').filter({ hasText: 'Todas as interações' });
      if (await interactionSelect.count() > 0) {
        await interactionSelect.selectOption('14');
        await page.waitForTimeout(1500);
      }

      await page.screenshot({ path: path.join(__dirname, 'screenshots', 'disparo_recorrente_modal_contatos_filtrado.png') });
      console.log('Screenshot do modal de contatos com filtro ativo capturado!');
    }
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await browser.close();
  }
}

run();
