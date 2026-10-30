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
    console.log('1. Navegando para o frontend http://localhost:5176...');
    await page.goto('http://localhost:5176', { timeout: 60000 });

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      console.log('2. Preenchendo login...');
      await emailInput.first().fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    console.log('3. Clicando na aba Kanban de Vendas...');
    await page.waitForSelector('aside, nav', { timeout: 15000 });
    const kanbanNavBtn = page.locator('button:has-text("Kanban de Vendas"), a:has-text("Kanban de Vendas")');
    if (await kanbanNavBtn.count() > 0) {
      await kanbanNavBtn.first().click();
      await page.waitForTimeout(3000);
    }

    await page.waitForSelector('text=Kanban de Vendas', { timeout: 15000 });
    await page.waitForTimeout(2500);

    console.log('4. Selecionando leads pelo checkbox da coluna...');
    const columnCheckboxes = page.locator('input[aria-label^="Selecionar todos os leads da coluna"]');
    const colCount = await columnCheckboxes.count();
    console.log(`Encontradas ${colCount} colunas com checkbox de seleção.`);

    if (colCount > 0) {
      await columnCheckboxes.first().click();
      await page.waitForTimeout(1000);
    } else {
      const anyCheckbox = page.locator('input[type="checkbox"]').first();
      await anyCheckbox.click();
      await page.waitForTimeout(1000);
    }

    console.log('5. Verificando botão "Disparar Template" na barra de ações em massa...');
    const bulkTemplateBtn = page.locator('[data-testid="kanban-bulk-template-btn"]');
    await bulkTemplateBtn.waitFor({ state: 'visible', timeout: 8000 });
    console.log('Botão "Disparar Template" visível e ativo!');

    console.log('6. Clicando em "Disparar Template" para abrir o modal...');
    await bulkTemplateBtn.click();
    await page.waitForTimeout(2000);

    console.log('7. Verificando abertura do BulkTemplateModal...');
    await page.waitForSelector('text=Disparo de Template', { timeout: 8000 });

    const modalScreenshotPath = path.join(artifactDir, 'evidencia_kanban_disparo_template_modal.png');
    await page.screenshot({ path: modalScreenshotPath, fullPage: false });
    console.log('Evidência 1 salva:', modalScreenshotPath);

    console.log('8. Clicando na aba "Contatos" dentro do modal...');
    const modalContainer = page.locator('div.fixed.inset-0.z-\\[999\\]');
    const destTab = modalContainer.locator('button:has-text("Contatos")');
    if (await destTab.count() > 0) {
      await destTab.first().click();
      await page.waitForTimeout(2000);
      const destScreenshotPath = path.join(artifactDir, 'evidencia_kanban_template_destinatarios.png');
      await page.screenshot({ path: destScreenshotPath, fullPage: false });
      console.log('Evidência 2 salva:', destScreenshotPath);
    }

    console.log('Validação visual concluída com sucesso!');
  } catch (err) {
    console.error('Erro na validação visual:', err);
  } finally {
    await browser.close();
  }
}

run();
