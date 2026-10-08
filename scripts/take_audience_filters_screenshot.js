const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  try {
    console.log('Acessando interface do ZapVoice...');
    await page.goto('http://localhost:5176', { timeout: 60000 });

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('Preenchendo credenciais...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    // Selecionar Cliente ID 14 (Crassus)
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

    // Clicar na aba de Disparos Recorrentes
    console.log('Navegando para a aba de Disparo Recorrente Criado...');
    const recurringTab = page.locator('button:has-text("Disparo Recorrente Criado"), a:has-text("Disparo Recorrente Criado")');
    await recurringTab.first().click();
    await page.waitForTimeout(2500);

    // Clicar no botão "Ver Contatos"
    console.log('Abrindo modal de Público Alvo (Ver Contatos)...');
    const contactsBtn = page.locator('button[title="Ver Contatos"]');
    if (await contactsBtn.count() > 0) {
      await contactsBtn.first().click();
      await page.waitForTimeout(2000);

      const targetPath = path.join(__dirname, 'screenshots', 'publico_alvo_filtros_depois.png');
      await page.screenshot({ path: targetPath });
      console.log(`✅ Screenshot salvo com sucesso em: ${targetPath}`);
    } else {
      console.error('Botão Ver Contatos não encontrado!');
    }
  } catch (err) {
    console.error('Erro na execução:', err);
  } finally {
    await browser.close();
  }
}

run();
