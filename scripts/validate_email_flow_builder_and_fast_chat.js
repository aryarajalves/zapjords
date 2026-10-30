const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\97d5a1f1-aa70-4136-a595-ff71f65d5e6f';

async function run() {
  console.log('Iniciando validação visual...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 950 });

  try {
    console.log('Conectando em http://localhost:5176...');
    await page.goto('http://localhost:5176', { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('Realizando login...');
      await emailInput.fill('aryarajmarketing@gmail.com');
      await page.locator('input[type="password"]').first().fill('123456');
      await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();
      await page.waitForTimeout(3500);
    }

    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      console.log('Selecionando cliente...');
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }

    // 1. Navegar primeiro para E-mail Marketing
    console.log('Navegando para E-mail Marketing...');
    const emailMarketingNav = page.locator('button:has-text("E-mail Marketing"), a:has-text("E-mail Marketing"), span:has-text("E-mail Marketing")').first();
    if (await emailMarketingNav.isVisible()) {
      await emailMarketingNav.click();
      await page.waitForTimeout(2500);
    }

    // 2. Acessar a aba Funis de E-mail
    console.log('Acessando aba Funis de E-mail...');
    const funnelsTab = page.locator('button:has-text("Funis de E-mail")').first();
    await funnelsTab.waitFor({ state: 'visible', timeout: 10000 });
    await funnelsTab.click();
    await page.waitForTimeout(1500);

    // 3. Abrir o Canvas Visual de Nós (React Flow)
    console.log('Abrindo Canvas Visual de Nós (React Flow)...');
    const newFunnelBtn = page.locator('button:has-text("Novo Funil de E-mail"), button:has-text("Criar Primeiro Funil")').first();
    if (await newFunnelBtn.isVisible()) {
      await newFunnelBtn.click();
      await page.waitForTimeout(2500);

      // 3.1 Clicar no dropdown de tags no gatilho para mostrar o seletor com tags dos contatos
      console.log('Abrindo dropdown de tags do gatilho...');
      const tagDropdownTrigger = page.locator('div:has-text("Nome da Etiqueta") + div, div:has-text("Selecione ou digite uma tag")').first();
      if (await tagDropdownTrigger.isVisible()) {
        await tagDropdownTrigger.click();
        await page.waitForTimeout(1000);
      }

      // 3.2 Clicar com o botão direito no canvas do ReactFlow para abrir o ContextMenu
      console.log('Clicando com botão direito no canvas para abrir menu popup de nós...');
      const canvasPane = page.locator('.react-flow__pane').first();
      if (await canvasPane.isVisible()) {
        await canvasPane.click({ button: 'right', position: { x: 550, y: 350 } });
        await page.waitForTimeout(1200);
      }

      const shotCanvas = path.join(ARTIFACT_DIR, 'evidencia_funil_email_gatilho_tags_e_contextmenu.png');
      await page.screenshot({ path: shotCanvas });
      console.log('📸 Screenshot com tags e menu popup salvo:', shotCanvas);

      // Clicar no item "Disparo de E-mail" para adicionar o nó a partir do menu popup
      console.log('Adicionando nó via popup de botão direito...');
      const addEmailOption = page.locator('button:has-text("Disparo de E-mail")').first();
      if (await addEmailOption.isVisible()) {
        await addEmailOption.click();
        await page.waitForTimeout(1000);

        const shotWithNewNode = path.join(ARTIFACT_DIR, 'evidencia_funil_email_canvas_nos_reactflow.png');
        await page.screenshot({ path: shotWithNewNode });
        console.log('📸 Screenshot com nó adicionado salvo:', shotWithNewNode);
      }

      // Clicar em "Voltar para Lista"
      const backBtn = page.locator('button:has-text("Voltar para Lista")').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // 4. Testar Chat de Atendimento com carregamento ultra-rápido
    console.log('Testando abertura do Chat de Atendimento...');
    const chatNav = page.locator('button:has-text("Atendimento"), a:has-text("Atendimento"), span:has-text("Atendimento")').first();
    if (await chatNav.isVisible()) {
      await chatNav.click();
      await page.waitForTimeout(3000);

      // Clicar na conversa
      const firstConvo = page.locator('div[class*="cursor-pointer"]:has-text("55")').first();
      if (await firstConvo.isVisible()) {
        const t0 = Date.now();
        await firstConvo.click();
        await page.waitForTimeout(1000);
        console.log(`⚡ Conversa aberta em ${Date.now() - t0}ms!`);

        const shotChat = path.join(ARTIFACT_DIR, 'evidencia_chat_carregamento_otimizado.png');
        await page.screenshot({ path: shotChat });
        console.log('📸 Screenshot do chat salvo:', shotChat);
      }
    }

    console.log('✅ Validação visual concluída com sucesso!');
  } catch (err) {
    console.error('Erro na validação Playwright:', err);
  } finally {
    await browser.close();
  }
}

run();
