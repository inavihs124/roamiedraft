import { BaseAgent, AgentContext } from './BaseAgent';

export class ClawbotAgent extends BaseAgent<any, string> {
  constructor() {
    super('ClawbotAgent', 'User-facing conversational agent that delivers news/options natively.');
  }

  async execute(input: { type: 'success' | 'failure', booking?: any, reason?: string }, context: AgentContext): Promise<string> {
    let prompt = '';
    
    if (input.type === 'success' && input.booking) {
      prompt = `
      You are Clawbot, a proactive travel assistant.
      The user's flight was just cancelled, but you (the Booking Agent) found the cheapest alternative: 
      Flight ${input.booking.flight.flightNumber} on ${input.booking.flight.airline} for ₹${input.booking.flight.price}.
      Draft a comforting, urgent 2-sentence SMS alerting them to tap to pay to secure this flight before it sells out.
      `;
    } else {
      prompt = `
      You are Clawbot, a proactive travel assistant.
      The user's flight was just cancelled, and catastrophically, there are 0 alternative flights available in the area right now.
      Draft a 2-sentence urgent "voicemail/message" alerting them of the situation and advising them to seek ground staff immediately.
      `;
    }

    try {
      const response = await fetch((process.env.OLLAMA_BASE_URL || 'http://localhost:11434') + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'llama3',
          prompt: prompt,
          stream: false
        })
      });
      const data: any = await response.json();
      return (data.response || '').trim() || (input.type === 'success'
        ? `Hey! Your flight was cancelled, but I've secured the cheapest alternative for ₹${input.booking?.flight?.price}. Tap the button below to review and pay immediately.`
        : `URGENT: Your flight was cancelled and unfortunately there are NO alternative flights available right now. Please seek ground staff assistance immediately.`);
    } catch (error) {
      if (input.type === 'success') {
        return `Hey! Your flight was cancelled, but I've secured the cheapest alternative for ₹${input.booking?.flight?.price}. Tap the button below to review and pay immediately.`;
      }
      return `URGENT: Your flight was cancelled and unfortunately there are NO alternative flights available right now. Please seek ground staff assistance immediately.`;
    }
  }
}
