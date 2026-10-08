const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  const dir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const brainDir = 'C:\\Users\\aryar\\.gemini\\antigravity\\brain\\a9f4d023-a83c-4a76-9ecc-f4dfdfc25e09';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navegando para o ZapVoice...');
    await page.goto('http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Login
    console.log('Realizando login...');
    await page.locator('input[type="email"]').first().fill('aryarajmarketing@gmail.com');
    await page.locator('input[type="password"]').first().fill('123456');
    await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();

    console.log('Aguardando painel principal...');
    await page.waitForTimeout(5000);

    // Selecionar cliente se não houver cliente ativo
    const hasNoClient = await page.locator('button:has-text("Sem cliente selecionado")').count();
    if (hasNoClient > 0) {
      console.log('Selecionando primeiro cliente disponível...');
      await page.locator('button:has-text("Sem cliente selecionado")').click();
      await page.waitForTimeout(1000);
      await page.locator('div.max-h-60 button').first().click();
      await page.waitForTimeout(3000);
    }

    await page.setViewportSize({ width: 1400, height: 950 });

    // Navegar para Integrações Webhook
    console.log('Navegando para Integrações Webhook...');
    await page.locator('aside button:has-text("Integrações Webhook")').click();
    await page.waitForTimeout(3000);

    // Clica no botão "Nova Integração"
    const newIntegrationBtn = page.locator('button:has-text("Nova Integração")').first();
    const editBtn = page.locator('button[title="Editar"]').first();

    if (await editBtn.count() > 0) {
      console.log('Abrindo modal de edição...');
      await editBtn.click();
    } else if (await newIntegrationBtn.count() > 0) {
      console.log('Abrindo modal de Nova Integração...');
      await newIntegrationBtn.click();
    }
    await page.waitForTimeout(2500);

    // Seleciona uma plataforma se estiver na etapa de criação (ex: Kiwify ou Hotmart)
    const platformSelect = page.locator('select[name="platform"]');
    if (await platformSelect.count() > 0) {
      await platformSelect.selectOption('kiwify');
      await page.waitForTimeout(500);
    }

    // Ir para a aba de Mapeamentos / Gatilhos
    const triggersTab = page.locator('button:has-text("Mapeamentos"), button:has-text("Gatilhos")').first();
    if (await triggersTab.count() > 0) {
      console.log('Acessando aba Mapeamentos/Gatilhos...');
      await triggersTab.click();
      await page.waitForTimeout(1000);
    }

    // Clica no botão "+ NOVO GATILHO"
    const addTriggerBtn = page.locator('button:has-text("NOVO GATILHO")').first();
    if (await addTriggerBtn.count() > 0) {
      console.log('Clicando em + NOVO GATILHO...');
      await addTriggerBtn.click();
      await page.waitForTimeout(1500);
    }

    // Expandir o primeiro gatilho se estiver recolhido
    const triggerHeader = page.locator('span:has-text("Gatilho #1")').first();
    if (await triggerHeader.count() > 0) {
      console.log('Gatilho #1 presente.');
    }

    // Clicar na aba Avançado do Gatilho
    console.log('Clicando na aba Avançado do Gatilho...');
    const gatilhoAdvancedTab = page.locator('button:has-text("Avançado")').last();
    if (await gatilhoAdvancedTab.count() > 0) {
      await gatilhoAdvancedTab.click();
      await page.waitForTimeout(1500);
    }

    // Localizar o cabeçalho da seção de Plataforma
    const platformSectionHeader = page.locator('h5:has-text("Criação Automática de Acesso")');
    if (await platformSectionHeader.count() > 0) {
      console.log('Seção de Plataforma encontrada!');
      await platformSectionHeader.scrollIntoViewIfNeeded();

      // Ativa o switch da plataforma se não estiver ativo
      const toggle = platformSectionHeader.locator('xpath=../../..').locator('input[type="checkbox"]');
      const isChecked = await toggle.isChecked();
      if (!isChecked) {
        console.log('Ativando toggle de criação de convite...');
        await platformSectionHeader.locator('xpath=../../..').locator('label').click();
        await page.waitForTimeout(1500);
      }

      // Clica em Adicionar Curso se a lista estiver vazia
      const addCourseBtn = page.locator('button:has-text("Adicionar Curso")');
      if (await addCourseBtn.count() > 0) {
        console.log('Adicionando curso no convite...');
        await addCourseBtn.click();
        await page.waitForTimeout(1000);

        // Preenche dados do curso para ficar visualmente completo
        const courseInputs = page.locator('input[placeholder="Ex: 1"]');
        if (await courseInputs.count() > 0) {
          await courseInputs.first().fill('42');
        }
      }

      await platformSectionHeader.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }

    const webhookShotPath = path.join(dir, 'platform_invite_webhook_advanced.png');
    await page.screenshot({ path: webhookShotPath });
    console.log('Screenshot do Webhook salvo:', webhookShotPath);

    if (fs.existsSync(brainDir)) {
      fs.copyFileSync(webhookShotPath, path.join(brainDir, 'platform_invite_webhook_advanced.png'));
      console.log('Copiado para o brain:', path.join(brainDir, 'platform_invite_webhook_advanced.png'));
    }

    console.log('Validação concluída com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    await page.screenshot({ path: path.join(dir, 'webhook_error.png') });
  } finally {
    await browser.close();
  }
}

run();
