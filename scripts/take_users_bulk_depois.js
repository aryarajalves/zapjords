const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const artifactDir = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\0e0eda03-2ae8-4834-a90a-b2b532b5f4a8';
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  try {
    console.log('1. Navegando para login...');
    await page.goto('http://localhost:5176', { timeout: 60000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[inputmode="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }
    await page.waitForSelector('aside, nav', { timeout: 15000 });

    console.log('2. Acessando Gestão de Usuários...');
    await page.locator('button:has-text("Gestão de Usuários"), a:has-text("Gestão de Usuários")').first().click();
    await page.waitForTimeout(3000);

    // Selecionar todos os usuários da página atual via checkbox do cabeçalho
    console.log('3. Clicando no checkbox do cabeçalho para selecionar todos os usuários da página...');
    const headerCheckbox = page.locator('thead input[type="checkbox"]');
    await headerCheckbox.first().click();
    await page.waitForTimeout(1000);

    // Evidência 1: Tabela com seleção e barra de ação em lote
    const fileSelecao = path.join(screenshotsDir, 'usuarios_bulk_depois_selecao.png');
    await page.screenshot({ path: fileSelecao, fullPage: false });
    console.log('Screenshot seleção salvo em:', fileSelecao);
    fs.copyFileSync(fileSelecao, path.join(artifactDir, 'usuarios_bulk_depois_selecao.png'));

    // Clicar no botão de excluir selecionados
    console.log('4. Clicando no botão "Excluir Selecionados"...');
    await page.locator('button:has-text("Excluir Selecionados")').first().click();
    await page.waitForTimeout(1000);

    // Evidência 2: Modal de confirmação aberto
    const fileModal = path.join(screenshotsDir, 'usuarios_bulk_depois_modal.png');
    await page.screenshot({ path: fileModal, fullPage: false });
    console.log('Screenshot modal salvo em:', fileModal);
    fs.copyFileSync(fileModal, path.join(artifactDir, 'usuarios_bulk_depois_modal.png'));

    console.log('✅ Evidências visuais de bulk delete salvas com sucesso!');
  } catch (err) {
    console.error('Erro na captura visual:', err);
  } finally {
    await browser.close();
  }
})();
