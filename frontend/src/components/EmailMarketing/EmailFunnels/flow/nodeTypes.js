import EmailTriggerNode from './nodes/EmailTriggerNode';
import EmailMessageNode from './nodes/EmailMessageNode';
import EmailDelayNode from './nodes/EmailDelayNode';
import EmailTagNode from './nodes/EmailTagNode';
import EmailWebhookNode from './nodes/EmailWebhookNode';
import EmailKanbanNode from './nodes/EmailKanbanNode';
import EmailWhatsAppNode from './nodes/EmailWhatsAppNode';
import EmailConditionNode from './nodes/EmailConditionNode';
import EmailSplitNode from './nodes/EmailSplitNode';
import EmailWaitUntilNode from './nodes/EmailWaitUntilNode';
import EmailSubFunnelNode from './nodes/EmailSubFunnelNode';

export const emailNodeTypes = {
  triggerNode: EmailTriggerNode,
  emailNode: EmailMessageNode,
  delayNode: EmailDelayNode,
  tagNode: EmailTagNode,
  webhookNode: EmailWebhookNode,
  kanbanNode: EmailKanbanNode,
  whatsappNode: EmailWhatsAppNode,
  conditionNode: EmailConditionNode,
  splitNode: EmailSplitNode,
  waitUntilNode: EmailWaitUntilNode,
  subFunnelNode: EmailSubFunnelNode
};

export default emailNodeTypes;
