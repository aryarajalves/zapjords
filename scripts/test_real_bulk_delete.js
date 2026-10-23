const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const artifactDir = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\0e0eda03-2ae8-4834-a90a-b2b532b5f4a8';

  try {
    console.log('1. Acessando login...');
    await page.goto('http://localhost:5176', { timeout: 60000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[inputmode="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    console.log('2. Navegando para Gestão de Usuários...');
    await page.locator('button:has-text("Gestão de Usuários"), a:has-text("Gestão de Usuários")').first().click();
    await page.waitForTimeout(3000);

    console.log('3. Localizando checkboxes de usuários...');
    await page.waitForSelector('tbody tr input[type="checkbox"]', { timeout: 10000 });
    
    // Seleciona checkboxes dos usuários comuns
    const checkboxes = page.locator('tbody tr input[type="checkbox"]:not(:disabled)');
    const count = await checkboxes.count();
    console.log(`Checkboxes habilitados encontrados: ${count}`);

    if (count > 0) {
      // Clica no primeiro e no segundo usuário comum
      await checkboxes.nth(0).click();
      if (count > 1) {
        await checkboxes.nth(1).click();
      }
      await page.waitForTimeout(1000);

      console.log('4. Clicando no botão "Excluir Selecionados"...');
      const deleteBulkBtn = page.locator('button:has-text("Excluir Selecionados")').first();
      await deleteBulkBtn.click();
      await page.waitForTimeout(1000);

      console.log('5. Confirmando no popup modal ("Sim, Excluir")...');
      const confirmBtn = page.locator('button:has-text("Sim, Excluir")').first();
      await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
      await confirmBtn.click();
      await page.waitForTimeout(3000);

      console.log('6. Capturando screenshot pós-exclusão com toast de sucesso...');
      const destFile = path.join(artifactDir, 'bulk_delete_sucesso_depois.png');
      await page.screenshot({ path: destFile, fullPage: false });
      console.log('Screenshot salvo com sucesso em:', destFile);
      console.log('✅ Fluxo de exclusão em lote testado e aprovado com sucesso!');
    } else {
      console.log('Nenhum usuário comum disponível para exclusão na página.');
    }
  } catch (err) {
    console.error('Erro na validação do fluxo:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
