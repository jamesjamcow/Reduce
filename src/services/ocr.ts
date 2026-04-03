const sampleOcrPayloads = [
  "Alex: let's grab coffee next Tuesday at Blue Bottle and talk about the startup idea. I'm also hosting another UCLA hackathon next month.",
  'Mina: You should meet Chris from Stripe. He is strong at AI design systems and wants to review your onboarding flow sometime next week.',
  "Jordan: I'm in SF Friday. We should finally do dinner and I can introduce you to the Google AI team.",
];

export async function mockOcrFromImage(uri?: string) {
  const seed = uri ? uri.length % sampleOcrPayloads.length : Date.now() % sampleOcrPayloads.length;
  return sampleOcrPayloads[seed];
}

export function getShareSheetSample() {
  return sampleOcrPayloads[0];
}
