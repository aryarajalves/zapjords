/**
 * Utilitários de conversão e criação de nós para o EmailFunnelFlowBuilder.
 */

export function createDefaultNodeData({
  type,
  templates = [],
  handleUpdateNode,
  handleDeleteNode,
  handleDuplicateNode
}) {
  const common = {
    onUpdateNode: handleUpdateNode,
    onDeleteNode: handleDeleteNode,
    onDuplicateNode: handleDuplicateNode
  };

  switch (type) {
    case 'delay':
      return {
        nodeType: 'delayNode',
        data: {
          type: 'delay',
          delay_value: 2,
          delay_unit: 'hours',
          ...common
        }
      };

    case 'tag':
      return {
        nodeType: 'tagNode',
        data: {
          type: 'tag_action',
          action: 'add',
          tag: '',
          ...common
        }
      };

    case 'webhook':
      return {
        nodeType: 'webhookNode',
        data: {
          type: 'webhook',
          url: '',
          method: 'POST',
          ...common
        }
      };

    case 'kanban':
      return {
        nodeType: 'kanbanNode',
        data: {
          type: 'kanban',
          stage_name: 'Follow-up',
          ...common
        }
      };

    case 'whatsapp':
      return {
        nodeType: 'whatsappNode',
        data: {
          type: 'whatsapp_message',
          message: '',
          ...common
        }
      };

    case 'email':
    default:
      return {
        nodeType: 'emailNode',
        data: {
          type: 'email',
          template_id: templates[0]?.id || null,
          subject: '',
          templates,
          ...common
        }
      };
  }
}

export function mapStepToNodeType(stepType) {
  switch (stepType) {
    case 'delay':
      return 'delayNode';
    case 'tag_action':
      return 'tagNode';
    case 'webhook':
      return 'webhookNode';
    case 'kanban':
      return 'kanbanNode';
    case 'whatsapp_message':
      return 'whatsappNode';
    case 'email':
    default:
      return 'emailNode';
  }
}

export function serializeNodeToStep(node) {
  const d = node.data || {};
  switch (node.type) {
    case 'emailNode':
      return {
        id: node.id,
        type: 'email',
        template_id: d.template_id,
        subject: d.subject || ''
      };
    case 'delayNode':
      return {
        id: node.id,
        type: 'delay',
        delay_value: d.delay_value || 1,
        delay_unit: d.delay_unit || 'hours'
      };
    case 'tagNode':
      return {
        id: node.id,
        type: 'tag_action',
        action: d.action || 'add',
        tag: d.tag || ''
      };
    case 'webhookNode':
      return {
        id: node.id,
        type: 'webhook',
        url: d.url || '',
        method: d.method || 'POST'
      };
    case 'kanbanNode':
      return {
        id: node.id,
        type: 'kanban',
        stage_name: d.stage_name || ''
      };
    case 'whatsappNode':
      return {
        id: node.id,
        type: 'whatsapp_message',
        message: d.message || ''
      };
    default:
      return d;
  }
}
