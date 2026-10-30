import EmailTriggerNode from './nodes/EmailTriggerNode';
import EmailMessageNode from './nodes/EmailMessageNode';
import EmailDelayNode from './nodes/EmailDelayNode';
import EmailTagNode from './nodes/EmailTagNode';
import EmailWebhookNode from './nodes/EmailWebhookNode';
import EmailKanbanNode from './nodes/EmailKanbanNode';
import EmailWhatsAppNode from './nodes/EmailWhatsAppNode';

export const emailNodeTypes = {
  triggerNode: EmailTriggerNode,
  emailNode: EmailMessageNode,
  delayNode: EmailDelayNode,
  tagNode: EmailTagNode,
  webhookNode: EmailWebhookNode,
  kanbanNode: EmailKanbanNode,
  whatsappNode: EmailWhatsAppNode
};

export default emailNodeTypes;
