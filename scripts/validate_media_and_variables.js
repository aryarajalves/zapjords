const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    await page.goto('http://127.0.0.1:5176', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(4000);
    }

    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }

    const chatNavBtn = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento")').first();
    if (await chatNavBtn.isVisible()) {
      await chatNavBtn.click();
      await page.waitForTimeout(4000);
    }

    // Selecionar conversas
    const selectAllBtn = page.locator('button:has-text("Selecionar todas")').first();
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
      await page.waitForTimeout(1500);
    }

    // Clicar em Disparo Template
    const bulkTemplateBtn = page.locator('#bulk-template-btn');
    await bulkTemplateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await bulkTemplateBtn.click();
    await page.waitForTimeout(2500);

    // Clica para abrir o dropdown de templates
    const tplSelect = page.locator('button:has-text("Selecione o template"), button:has-text("abertura_janela")').first();
    await tplSelect.click();
    await page.waitForTimeout(1000);

    // Digita no input de pesquisa do template
    const searchInput = page.locator('input[placeholder*="Pesquisar template"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('video_02');
      await page.waitForTimeout(1000);
    }

    // Clica no template filtrado
    const astrowakeOption = page.locator('div.absolute.z-50 button:has-text("video_02_evento_astrowake")').first();
    if (await astrowakeOption.isVisible()) {
      await astrowakeOption.click();
      await page.waitForTimeout(2500);
    } else {
      console.log('Template video_02 não encontrado na busca, clicando no primeiro da lista filtrada');
      await page.locator('div.absolute.z-50 button').first().click();
      await page.waitForTimeout(2500);
    }

    // 1. Screenshot com o uploader de vídeo completo e prévia
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_template_video_upload_e_preview.png'),
      fullPage: false
    });
    console.log('✅ Screenshot 1 (Upload de Vídeo e Prévia) capturada com sucesso!');

    // 2. Clicar na aba "Mídias Salvas" dentro do uploader
    const savedMediasTab = page.locator('button:has-text("Mídias Salvas")').first();
    if (await savedMediasTab.isVisible()) {
      await savedMediasTab.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'evidencia_template_midias_salvas_anteriores.png'),
        fullPage: false
      });
      console.log('✅ Screenshot 2 (Mídias Salvas Anteriores) capturada com sucesso!');
    } else {
      console.log('Aba Mídias Salvas não visível');
    }

  } catch (err) {
    console.error('❌ Erro durante o teste visual:', err);
  } finally {
    await browser.close();
  }
}

run();
