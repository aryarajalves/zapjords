/**
 * Exportador e Parser modular para Blocos Avançados de E-mail Marketing:
 * - Countdown (Contador Regressivo)
 * - Callout (Caixa de Destaque / Depoimento)
 * - Product Card (Vitrine de Produto com Oferta)
 * - Columns 3 (Grade de 3 Colunas / Benefícios)
 * - Signature (Assinatura do Autor / Fundador)
 * - Spacer (Espaçador Customizado)
 * - HTML Embed (Código HTML Puro)
 */

export function renderAdvancedBlockToHtml(b) {
  switch (b.type) {
    case 'countdown': {
      const title = b.title || 'A Oferta Termina Em:';
      const days = b.days || '02';
      const hours = b.hours || '14';
      const minutes = b.minutes || '35';
      const seconds = b.seconds || '48';
      const bg = b.bgColor || '#0f172a';
      const textCol = b.textColor || '#ffffff';
      const accent = b.accentColor || '#ef4444';

      return `
        <div style="margin: 20px 0; text-align: center; font-family: Arial, sans-serif;" data-block-type="countdown" data-title="${title}" data-days="${days}" data-hours="${hours}" data-minutes="${minutes}" data-seconds="${seconds}" data-bg="${bg}" data-text="${textCol}" data-accent="${accent}">
          <div style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: ${accent}; letter-spacing: 1px; margin-bottom: 10px;">
            ⏳ ${title}
          </div>
          <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="padding: 0 4px;">
                <div style="background-color: ${bg}; color: ${textCol}; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; min-width: 44px; text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; line-height: 1.1;">${days}</div>
                  <div style="font-size: 9px; opacity: 0.7; text-transform: uppercase;">Dias</div>
                </div>
              </td>
              <td style="font-size: 18px; font-weight: bold; color: ${bg};">:</td>
              <td style="padding: 0 4px;">
                <div style="background-color: ${bg}; color: ${textCol}; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; min-width: 44px; text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; line-height: 1.1;">${hours}</div>
                  <div style="font-size: 9px; opacity: 0.7; text-transform: uppercase;">Horas</div>
                </div>
              </td>
              <td style="font-size: 18px; font-weight: bold; color: ${bg};">:</td>
              <td style="padding: 0 4px;">
                <div style="background-color: ${bg}; color: ${textCol}; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; min-width: 44px; text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; line-height: 1.1;">${minutes}</div>
                  <div style="font-size: 9px; opacity: 0.7; text-transform: uppercase;">Min</div>
                </div>
              </td>
              <td style="font-size: 18px; font-weight: bold; color: ${bg};">:</td>
              <td style="padding: 0 4px;">
                <div style="background-color: ${bg}; color: ${accent}; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; min-width: 44px; text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; line-height: 1.1;">${seconds}</div>
                  <div style="font-size: 9px; opacity: 0.7; text-transform: uppercase;">Seg</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    case 'callout': {
      const borderCol = b.borderColor || '#3b82f6';
      const bg = b.bgColor || '#f8fafc';
      const textCol = b.textColor || '#1e293b';
      const title = b.title || '';
      const text = b.text || '';
      const author = b.author || '';

      return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 18px 0;" data-block-type="callout" data-border="${borderCol}" data-bg="${bg}" data-textcol="${textCol}" data-title="${title}" data-author="${author}">
          <tr>
            <td style="background-color: ${bg}; border-left: 4px solid ${borderCol}; border-radius: 0 10px 10px 0; padding: 16px 20px; font-family: Arial, sans-serif;">
              ${title ? `<div style="font-size: 14px; font-weight: bold; color: ${textCol}; margin-bottom: 6px;">${title}</div>` : ''}
              <div style="font-size: 14px; color: ${textCol}; line-height: 1.6; font-style: ${author ? 'italic' : 'normal'};">
                ${text.replace(/\n/g, '<br />')}
              </div>
              ${author ? `<div style="margin-top: 8px; font-size: 12px; font-weight: bold; color: ${borderCol};">— ${author}</div>` : ''}
            </td>
          </tr>
        </table>
      `;
    }

    case 'product_card': {
      const title = b.productTitle || 'Oferta Exclusiva';
      const desc = b.productDesc || '';
      const img = b.imageUrl || '';
      const origPrice = b.originalPrice || '';
      const discPrice = b.discountPrice || '';
      const btnText = b.buttonText || 'Quero Comprar Agora';
      const btnUrl = b.buttonUrl || '#';
      const btnBg = b.buttonBgColor || '#10b981';

      return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; font-family: Arial, sans-serif;" data-block-type="product_card" data-title="${title}" data-orig="${origPrice}" data-disc="${discPrice}" data-btntext="${btnText}" data-btnurl="${btnUrl}" data-btnbg="${btnBg}" data-img="${img}">
          ${img ? `<tr><td align="center" style="padding: 16px 16px 0 16px;"><img src="${img}" alt="${title}" style="max-width: 100%; max-height: 220px; object-fit: contain; border-radius: 8px; display: block;" /></td></tr>` : ''}
          <tr>
            <td style="padding: 18px 20px; text-align: center;">
              <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 6px;">${title}</div>
              ${desc ? `<div style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 12px;">${desc.replace(/\n/g, '<br />')}</div>` : ''}
              <div style="margin: 12px 0;">
                ${origPrice ? `<span style="font-size: 13px; color: #94a3b8; text-decoration: line-through; margin-right: 8px;">${origPrice}</span>` : ''}
                ${discPrice ? `<span style="font-size: 22px; font-weight: 900; color: #059669;">${discPrice}</span>` : ''}
              </div>
              <div style="margin-top: 14px;">
                <a href="${btnUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: ${btnBg}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 8px rgba(16,185,129,0.25);">
                  ${btnText}
                </a>
              </div>
            </td>
          </tr>
        </table>
      `;
    }

    case 'columns_3': {
      const c1Icon = b.col1Icon || '⚡';
      const c1Title = b.col1Title || 'Recurso 1';
      const c1Text = b.col1Text || '';

      const c2Icon = b.col2Icon || '🛡️';
      const c2Title = b.col2Title || 'Recurso 2';
      const c2Text = b.col2Text || '';

      const c3Icon = b.col3Icon || '💬';
      const c3Title = b.col3Title || 'Recurso 3';
      const c3Text = b.col3Text || '';

      return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 18px 0; font-family: Arial, sans-serif;" data-block-type="columns_3">
          <tr>
            <td width="32%" valign="top" style="padding: 10px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
              <div style="font-size: 22px; margin-bottom: 6px;">${c1Icon}</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${c1Title}</div>
              <div style="font-size: 11px; color: #64748b; line-height: 1.4;">${c1Text.replace(/\n/g, '<br />')}</div>
            </td>
            <td width="2%">&nbsp;</td>
            <td width="32%" valign="top" style="padding: 10px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
              <div style="font-size: 22px; margin-bottom: 6px;">${c2Icon}</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${c2Title}</div>
              <div style="font-size: 11px; color: #64748b; line-height: 1.4;">${c2Text.replace(/\n/g, '<br />')}</div>
            </td>
            <td width="2%">&nbsp;</td>
            <td width="32%" valign="top" style="padding: 10px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
              <div style="font-size: 22px; margin-bottom: 6px;">${c3Icon}</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${c3Title}</div>
              <div style="font-size: 11px; color: #64748b; line-height: 1.4;">${c3Text.replace(/\n/g, '<br />')}</div>
            </td>
          </tr>
        </table>
      `;
    }

    case 'signature': {
      const name = b.authorName || 'Seu Nome';
      const role = b.authorRole || 'Especialista';
      const company = b.company || '';
      const avatar = b.avatarUrl || '';
      const signText = b.signatureText || name;

      return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 22px 0; font-family: Arial, sans-serif;" data-block-type="signature" data-name="${name}" data-role="${role}" data-company="${company}" data-avatar="${avatar}" data-sign="${signText}">
          <tr>
            ${avatar ? `<td width="64" valign="middle" style="padding-right: 14px;"><img src="${avatar}" alt="${name}" width="56" height="56" style="border-radius: 50%; display: block; border: 2px solid #3b82f6;" /></td>` : ''}
            <td valign="middle">
              <div style="font-family: 'Brush Script MT', 'Dancing Script', cursive, sans-serif; font-size: 24px; color: #1e293b; line-height: 1.1; margin-bottom: 4px;">
                ${signText}
              </div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${name}</div>
              <div style="font-size: 11px; color: #64748b;">${role}${company ? ` • ${company}` : ''}</div>
            </td>
          </tr>
        </table>
      `;
    }

    case 'spacer': {
      const h = Number(b.height) || 24;
      return `
        <div style="height: ${h}px; line-height: ${h}px; font-size: 1px;" data-block-type="spacer" data-height="${h}">&nbsp;</div>
      `;
    }

    case 'html_embed': {
      const code = b.htmlCode || '';
      return `
        <div style="margin: 16px 0;" data-block-type="html_embed">
          ${code}
        </div>
      `;
    }

    default:
      return null;
  }
}

export function parseAdvancedBlockFromElement(el, id) {
  const type = el.getAttribute('data-block-type');
  if (!type) return null;

  if (type === 'countdown') {
    return {
      id,
      type: 'countdown',
      title: el.getAttribute('data-title') || 'A Oferta Termina Em:',
      days: el.getAttribute('data-days') || '02',
      hours: el.getAttribute('data-hours') || '14',
      minutes: el.getAttribute('data-minutes') || '35',
      seconds: el.getAttribute('data-seconds') || '48',
      bgColor: el.getAttribute('data-bg') || '#0f172a',
      textColor: el.getAttribute('data-text') || '#ffffff',
      accentColor: el.getAttribute('data-accent') || '#ef4444'
    };
  }

  if (type === 'callout') {
    const textEl = el.querySelector('td > div:nth-child(2)') || el.querySelector('td');
    return {
      id,
      type: 'callout',
      title: el.getAttribute('data-title') || '',
      text: (textEl?.textContent || '').replace(/<br\s*\/?>/gi, '\n').trim(),
      author: el.getAttribute('data-author') || '',
      borderColor: el.getAttribute('data-border') || '#3b82f6',
      bgColor: el.getAttribute('data-bg') || '#f8fafc',
      textColor: el.getAttribute('data-textcol') || '#1e293b'
    };
  }

  if (type === 'product_card') {
    const descEl = el.querySelector('td > div:nth-child(2)');
    return {
      id,
      type: 'product_card',
      productTitle: el.getAttribute('data-title') || 'Oferta Exclusiva',
      productDesc: descEl ? descEl.textContent.trim() : '',
      imageUrl: el.getAttribute('data-img') || '',
      originalPrice: el.getAttribute('data-orig') || '',
      discountPrice: el.getAttribute('data-disc') || '',
      buttonText: el.getAttribute('data-btntext') || 'Quero Comprar Agora',
      buttonUrl: el.getAttribute('data-btnurl') || '#',
      buttonBgColor: el.getAttribute('data-btnbg') || '#10b981'
    };
  }

  if (type === 'columns_3') {
    const tds = el.querySelectorAll('td[width="32%"]');
    return {
      id,
      type: 'columns_3',
      col1Icon: tds[0]?.querySelector('div:nth-child(1)')?.textContent?.trim() || '⚡',
      col1Title: tds[0]?.querySelector('div:nth-child(2)')?.textContent?.trim() || 'Recurso 1',
      col1Text: tds[0]?.querySelector('div:nth-child(3)')?.textContent?.trim() || '',
      col2Icon: tds[1]?.querySelector('div:nth-child(1)')?.textContent?.trim() || '🛡️',
      col2Title: tds[1]?.querySelector('div:nth-child(2)')?.textContent?.trim() || 'Recurso 2',
      col2Text: tds[1]?.querySelector('div:nth-child(3)')?.textContent?.trim() || '',
      col3Icon: tds[2]?.querySelector('div:nth-child(1)')?.textContent?.trim() || '💬',
      col3Title: tds[2]?.querySelector('div:nth-child(2)')?.textContent?.trim() || 'Recurso 3',
      col3Text: tds[2]?.querySelector('div:nth-child(3)')?.textContent?.trim() || ''
    };
  }

  if (type === 'signature') {
    return {
      id,
      type: 'signature',
      authorName: el.getAttribute('data-name') || '',
      authorRole: el.getAttribute('data-role') || '',
      company: el.getAttribute('data-company') || '',
      avatarUrl: el.getAttribute('data-avatar') || '',
      signatureText: el.getAttribute('data-sign') || ''
    };
  }

  if (type === 'spacer') {
    return {
      id,
      type: 'spacer',
      height: Number(el.getAttribute('data-height')) || 24
    };
  }

  if (type === 'html_embed') {
    return {
      id,
      type: 'html_embed',
      htmlCode: el.innerHTML?.trim() || ''
    };
  }

  return null;
}
