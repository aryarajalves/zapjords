const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Define activeClientId = 14 (Cliente - Crassus)
  await context.addInitScript(() => {
    localStorage.setItem('activeClientId', '14');
  });

  const page = await context.newPage();
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

    // Garante que o cliente 14 está selecionado
    await page.evaluate(() => {
      localStorage.setItem('activeClientId', '14');
    });

    // Navegar para Atendimento (Chat)
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

    // Abrir seletor de templates
    const tplSelect = page.locator('button:has-text("Selecione o template"), button:has-text("abertura_janela")').first();
    await tplSelect.click();
    await page.waitForTimeout(1000);

    // Filtrar video_02
    const searchInput = page.locator('input[placeholder*="Digitar para filtrar templates"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('video_02');
      await page.waitForTimeout(1000);
    }

    // Clicar em video_02_evento_astrowake
    const astrowakeOption = page.locator('div.absolute.z-50 button:has-text("video_02_evento_astrowake")').first();
    if (await astrowakeOption.isVisible()) {
      await astrowakeOption.click();
      await page.waitForTimeout(2500);
    } else {
      console.log('Opção astrowake não achada, pegando primeira');
      await page.locator('div.absolute.z-50 button').first().click();
      await page.waitForTimeout(2500);
    }

    // 1. Screenshot com uploader de mídia de vídeo (Upload de Arquivo, Mídias Salvas e Prévia)
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'evidencia_template_video_astrowake_completo.png'),
      fullPage: false
    });
    console.log('✅ Screenshot 1 (Template Vídeo Astrowake Completo) capturada!');

    // 2. Clicar na aba "Mídias Salvas" dentro do uploader
    const savedMediasTab = page.locator('#media-header-uploader button:has-text("Mídias Salvas")').first();
    if (await savedMediasTab.isVisible()) {
      await savedMediasTab.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'evidencia_midias_salvas_anteriores.png'),
        fullPage: false
      });
      console.log('✅ Screenshot 2 (Mídias Salvas Anteriores) capturada!');
    }

    // 3. Selecionar um template com variáveis: confirmacao_webinario_astrologia
    const tplSelectAgain = page.locator('button:has-text("video_02_evento_astrowake")').first();
    if (await tplSelectAgain.isVisible()) {
      await tplSelectAgain.click();
      await page.waitForTimeout(1000);

      const searchInput2 = page.locator('input[placeholder*="Digitar para filtrar templates"]').first();
      if (await searchInput2.isVisible()) {
        await searchInput2.fill('confirmacao_webinario');
        await page.waitForTimeout(1000);
      }

      const webinarioOption = page.locator('div.absolute.z-50 button:has-text("confirmacao_webinario_astrologia")').first();
      if (await webinarioOption.isVisible()) {
        await webinarioOption.click();
        await page.waitForTimeout(2000);

        // Preencher a variável {{1}} clicando em +primeiro_nome
        const quickTag = page.locator('button:has-text("+primeiro_nome")').first();
        if (await quickTag.isVisible()) {
          await quickTag.click();
          await page.waitForTimeout(1500);
        }

        await page.screenshot({
          path: path.join(ARTIFACT_DIR, 'evidencia_variaveis_e_preview_interativo.png'),
          fullPage: false
        });
        console.log('✅ Screenshot 3 (Variáveis Preenchidas e Preview Interativo) capturada!');
      }
    }

  } catch (err) {
    console.error('❌ Erro durante o teste visual:', err);
  } finally {
    await browser.close();
  }
}

run();
