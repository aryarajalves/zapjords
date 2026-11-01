/**
 * Utilitários de conversão e criação de nós para o EmailFunnelFlowBuilder.
 */

export function createDefaultNodeData({
  type,
  templates = [],
  funnels = [],
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
    case 'condition':
      return {
        nodeType: 'conditionNode',
        data: {
          type: 'condition',
          condition_type: 'has_tag',
          tag_name: '',
          ...common
        }
      };

    case 'split':
    case 'ab_split':
      return {
        nodeType: 'splitNode',
        data: {
          type: 'ab_split',
          split_ratio: 50,
          ...common
        }
      };

    case 'wait_until':
      return {
        nodeType: 'waitUntilNode',
        data: {
          type: 'wait_until',
          wait_mode: 'time_window',
          start_time: '08:00',
          end_time: '18:00',
          weekdays_only: true,
          ...common
        }
      };

    case 'sub_funnel':
    case 'enroll_funnel':
      return {
        nodeType: 'subFunnelNode',
        data: {
          type: 'enroll_funnel',
          target_funnel_id: funnels[0]?.id || '',
          exit_current_funnel: true,
          funnels,
          ...common
        }
      };

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
    case 'condition':
      return 'conditionNode';
    case 'split':
    case 'ab_split':
      return 'splitNode';
    case 'wait_until':
      return 'waitUntilNode';
    case 'sub_funnel':
    case 'enroll_funnel':
      return 'subFunnelNode';
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
    case 'conditionNode':
      return {
        id: node.id,
        type: 'condition',
        condition_type: d.condition_type || 'has_tag',
        tag_name: d.tag_name || ''
      };
    case 'splitNode':
      return {
        id: node.id,
        type: 'ab_split',
        split_ratio: d.split_ratio ?? 50
      };
    case 'waitUntilNode':
      return {
        id: node.id,
        type: 'wait_until',
        wait_mode: d.wait_mode || 'time_window',
        start_time: d.start_time || '08:00',
        end_time: d.end_time || '18:00',
        weekdays_only: d.weekdays_only ?? true
      };
    case 'subFunnelNode':
      return {
        id: node.id,
        type: 'enroll_funnel',
        target_funnel_id: d.target_funnel_id || '',
        exit_current_funnel: d.exit_current_funnel ?? true
      };
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
