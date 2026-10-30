import EmailTriggerNode from './nodes/EmailTriggerNode';
import EmailMessageNode from './nodes/EmailMessageNode';
import EmailDelayNode from './nodes/EmailDelayNode';
import EmailTagNode from './nodes/EmailTagNode';

export const emailNodeTypes = {
  triggerNode: EmailTriggerNode,
  emailNode: EmailMessageNode,
  delayNode: EmailDelayNode,
  tagNode: EmailTagNode
};

export default emailNodeTypes;
