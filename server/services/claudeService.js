import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export function isAvailable() {
  return !!anthropic;
}

export async function generateSuggestions(preferences) {
  if (!anthropic) {
    return getDefaultSuggestions();
  }

  try {
    const prompt = buildSuggestionsPrompt(preferences);

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const aiContent = response.content[0].text;

    // Add AI reasoning to default structure
    return getDefaultSuggestions().map((s, i) => ({
      ...s,
      aiReasoning: aiContent.split('\n\n')[i] || 'Analysis based on current odds and trends.'
    }));
  } catch (error) {
    console.error('AI suggestions error:', error);
    return getDefaultSuggestions();
  }
}

export async function analyzeParlay(legs) {
  if (!anthropic) {
    return getDefaultAnalysis(legs);
  }

  try {
    const prompt = `Analyze this sports parlay for research purposes. Be concise.

Legs: ${JSON.stringify(legs, null, 2)}

Provide:
1. Brief risk assessment
2. Key factors to consider
3. Potential concerns

End with a reminder this is for research only, not betting advice.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('AI analysis error:', error);
    return 'Analysis unavailable. Please try again later.';
  }
}

function buildSuggestionsPrompt(preferences) {
  let prompt = `Generate brief analysis for 3 sports parlay suggestions (conservative, balanced, aggressive).
Focus on general betting strategy principles for NBA and NHL games.

`;

  if (preferences?.favoriteTeams?.length) {
    prompt += `User's favorite teams: ${preferences.favoriteTeams.join(', ')}\n`;
  }

  if (preferences?.riskTolerance) {
    prompt += `Risk tolerance: ${preferences.riskTolerance}\n`;
  }

  prompt += `
Keep responses brief (2-3 sentences each). End with a research disclaimer.`;

  return prompt;
}

function getDefaultSuggestions() {
  return [
    {
      id: 'sug-1',
      name: 'Conservative Pick',
      description: 'Lower risk combination with favorites',
      legs: [
        { team: 'Example Team A', type: 'moneyline', price: -150 },
        { team: 'Example Team B', type: 'spread', point: -3.5, price: -110 }
      ],
      riskLevel: 'low',
      estimatedOdds: 2.6
    },
    {
      id: 'sug-2',
      name: 'Balanced Pick',
      description: 'Mix of favorites and slight underdogs',
      legs: [
        { team: 'Example Team C', type: 'moneyline', price: -120 },
        { team: 'Example Team D', type: 'totals', point: 'Over 45.5', price: -110 },
        { team: 'Example Team E', type: 'moneyline', price: +105 }
      ],
      riskLevel: 'medium',
      estimatedOdds: 5.2
    },
    {
      id: 'sug-3',
      name: 'Value Play',
      description: 'Higher risk, higher potential reward',
      legs: [
        { team: 'Example Team F', type: 'moneyline', price: +130 },
        { team: 'Example Team G', type: 'moneyline', price: +145 },
        { team: 'Example Team H', type: 'spread', point: +6.5, price: -105 }
      ],
      riskLevel: 'high',
      estimatedOdds: 10.8
    }
  ];
}

function getDefaultAnalysis(legs) {
  return `
**Parlay Analysis**

This ${legs.length}-leg parlay combines multiple bets that all must win for a payout.

**Risk Assessment**: ${legs.length <= 3 ? 'Moderate' : legs.length <= 5 ? 'High' : 'Very High'}

**Key Considerations**:
- Each additional leg significantly reduces win probability
- Consider the correlation between picks
- Check for any scheduling conflicts or injury reports

**Reminder**: This is for research purposes only. Past performance does not guarantee future results.
  `.trim();
}

export default {
  isAvailable,
  generateSuggestions,
  analyzeParlay
};
