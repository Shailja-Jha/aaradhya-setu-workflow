export const WORKFLOW_STAGES = [
  'Booking Confirmed',
  'Puja Started',
  'Puja Completed',
  'Video Available',
];

export const NOTIFICATION_TEMPLATES = {
  'Booking Confirmed':
    'Namaste {{devoteeName}} 🙏 Your booking for {{pujaName}} at {{templeName}} is confirmed! Booking ID: {{bookingId}}. {{panditName}} has been assigned and we will update you as soon as the Puja begins. — Aaradhya Setu',
  'Puja Started':
    'Har Har Mahadev {{devoteeName}} 🪔 Your {{pujaName}} (Booking ID: {{bookingId}}) has just started at {{templeName}} with {{panditName}}. May Lord bless you and your family.',
  'Puja Completed':
    'Namaste {{devoteeName}} 🌸 Your {{pujaName}} (Booking ID: {{bookingId}}) has been successfully completed at {{templeName}}. Our team is preparing your Sankalp & Puja recording now.',
  'Video Available':
    'Pranam {{devoteeName}} 🎥 The sacred video of your {{pujaName}} (Booking ID: {{bookingId}}) is now ready! Watch & download here: {{videoUrl}} — Thank you for choosing Aaradhya Setu.',
};

export function getStageIndex(stage) {
  return WORKFLOW_STAGES.indexOf(stage);
}

export function getNextStage(currentStage) {
  const idx = getStageIndex(currentStage);
  if (idx === -1 || idx >= WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[idx + 1];
}

export function renderNotificationMessage(stage, variables) {
  const template = NOTIFICATION_TEMPLATES[stage];
  if (!template) {
    throw new Error(`No notification template configured for stage: ${stage}`);
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = variables[key];
    return val !== undefined && val !== null && val !== '' ? String(val) : `[${key}]`;
  });
}