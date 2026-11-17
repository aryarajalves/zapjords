/**
 * Detecta variáveis de criação automática de convites (Área de Membros / App Bússola)
 * ao editar mapeamentos de variáveis ou mensagens de um gatilho, ativando automaticamente
 * os switches correspondentes caso ainda estejam desligados.
 */

const INVITE_FIELDS = new Set([
  'variables_mapping',
  'followup_variables_mapping',
  'custom_text',
  'private_note',
]);

function hasTokenInVars(vars = [], tokens = []) {
  return (vars || []).some((v) => v && tokens.includes(String(v.value || '').trim()));
}

function hasTokenInText(text = '', tokens = []) {
  const lower = String(text || '').toLowerCase();
  return tokens.some((t) => lower.includes(`{{${t}}}`));
}

export function applyInviteAutoEnable(prevMapping, nextMapping, changedField) {
  if (!INVITE_FIELDS.has(changedField)) {
    return { mapping: nextMapping, enabledPlatform: false, enabledBussola: false };
  }

  const updated = { ...nextMapping };
  let enabledPlatform = false;
  let enabledBussola = false;

  const platformDetected =
    hasTokenInVars(updated.variables_mapping, ['link_cadastro', 'invite_url']) ||
    hasTokenInVars(updated.followup_variables_mapping, ['link_cadastro', 'invite_url']) ||
    hasTokenInText(updated.custom_text, ['link_cadastro', 'invite_url']) ||
    hasTokenInText(updated.private_note, ['link_cadastro', 'invite_url']);

  if (platformDetected && !prevMapping?.auto_create_invite && !updated.auto_create_invite) {
    updated.auto_create_invite = true;
    enabledPlatform = true;
  }

  const bussolaDetected =
    hasTokenInVars(updated.variables_mapping, ['link_bussola']) ||
    hasTokenInVars(updated.followup_variables_mapping, ['link_bussola']) ||
    hasTokenInText(updated.custom_text, ['link_bussola']) ||
    hasTokenInText(updated.private_note, ['link_bussola']);

  if (bussolaDetected && !prevMapping?.bussola_auto_create_invite && !updated.bussola_auto_create_invite) {
    updated.bussola_auto_create_invite = true;
    enabledBussola = true;
  }

  return { mapping: updated, enabledPlatform, enabledBussola };
}
