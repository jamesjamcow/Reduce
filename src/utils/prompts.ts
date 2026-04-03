export const reduceSystemPrompt = `
You structure social screenshots into people, plans, and insights.
Return JSON with personNames, title, body, events, insights, and tags.
Prefer precision over speculation.
`;

export const reduceOutputGuide = {
  events: ['title', 'description', 'eventDate', 'location', 'personName'],
  insights: ['category', 'content', 'subject', 'personName', 'confidence'],
};
