import Anthropic from '@anthropic-ai/sdk';
import { fetchOddsForSport, fetchPlayerProps } from './oddsService.js';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export function isAvailable() {
  return !!anthropic;
}

export async function generateSuggestions(preferences) {
  if (!anthropic) {
    console.log('Anthropic API not available, returning defaults');
    return getDefaultSuggestions();
  }

  try {
    // Fetch real odds data from both NBA and NHL
    const [nbaData, nhlData] = await Promise.all([
      fetchOddsForSport('nba').catch(() => ({ games: [] })),
      fetchOddsForSport('nhl').catch(() => ({ games: [] }))
    ]);

    const allGames = [
      ...nbaData.games.map(g => ({ ...g, sport: 'NBA' })),
      ...nhlData.games.map(g => ({ ...g, sport: 'NHL' }))
    ];

    // If no games available, return defaults with AI reasoning
    if (allGames.length === 0) {
      console.log('No games available, returning defaults');
      return getDefaultSuggestions();
    }

    // Fetch player props if enabled (limit to 3 games to minimize API calls)
    let playerProps = [];
    const propsEnabled = preferences?.betTypes?.includes('props');

    if (propsEnabled && allGames.length > 0) {
      console.log('Fetching player props for top games...');
      const propsPromises = allGames.slice(0, 3).map(game =>
        fetchPlayerProps(game.sport.toLowerCase(), game.id)
          .catch(err => {
            console.log(`Failed to fetch props for ${game.id}:`, err.message);
            return null;
          })
      );
      const propsResults = await Promise.all(propsPromises);
      playerProps = propsResults.filter(p => p !== null);
    }

    // Build prompt with real game data and props
    const prompt = buildRealSuggestionsPrompt(allGames, preferences, playerProps);

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const aiContent = response.content[0].text;

    // Parse Claude's JSON response
    const suggestions = parseAISuggestions(aiContent, allGames);

    if (suggestions && suggestions.length > 0) {
      return suggestions;
    }

    // Fallback if parsing fails
    console.log('Failed to parse AI suggestions, returning defaults');
    return getDefaultSuggestions();
  } catch (error) {
    console.error('AI suggestions error:', error);
    return getDefaultSuggestions();
  }
}

function buildRealSuggestionsPrompt(games, preferences, playerProps = []) {
  // Format games for the prompt
  let gamesText = '';

  games.slice(0, 12).forEach((game, idx) => {
    const markets = game.bookmakers?.[0]?.markets || [];
    const h2h = markets.find(m => m.type === 'h2h');
    const spreads = markets.find(m => m.type === 'spreads');
    const totals = markets.find(m => m.type === 'totals');

    gamesText += `\n${idx + 1}. [${game.sport}] ${game.awayTeam} @ ${game.homeTeam}`;
    gamesText += `\n   Game ID: ${game.id}`;
    gamesText += `\n   Start: ${new Date(game.startTime).toLocaleString()}`;

    if (h2h) {
      const away = h2h.outcomes.find(o => o.name === game.awayTeam);
      const home = h2h.outcomes.find(o => o.name === game.homeTeam);
      if (away && home) {
        gamesText += `\n   Moneyline: ${game.awayTeam} ${away.price > 0 ? '+' : ''}${away.price}, ${game.homeTeam} ${home.price > 0 ? '+' : ''}${home.price}`;
      }
    }

    if (spreads) {
      const away = spreads.outcomes.find(o => o.name === game.awayTeam);
      const home = spreads.outcomes.find(o => o.name === game.homeTeam);
      if (away && home) {
        gamesText += `\n   Spread: ${game.awayTeam} ${away.point > 0 ? '+' : ''}${away.point} (${away.price}), ${game.homeTeam} ${home.point > 0 ? '+' : ''}${home.point} (${home.price})`;
      }
    }

    if (totals) {
      const over = totals.outcomes.find(o => o.name === 'Over');
      const under = totals.outcomes.find(o => o.name === 'Under');
      if (over && under) {
        gamesText += `\n   Total: Over ${over.point} (${over.price}), Under ${under.point} (${under.price})`;
      }
    }
    gamesText += '\n';
  });

  let prompt = `You are a sports betting research assistant. Based on the following upcoming games with current odds from DraftKings, generate 3 parlay suggestions for research purposes.

AVAILABLE GAMES:
${gamesText}

`;

  if (preferences?.favoriteTeams?.length) {
    prompt += `User's favorite teams: ${preferences.favoriteTeams.join(', ')}\n`;
  }
  if (preferences?.riskTolerance) {
    prompt += `User's risk tolerance: ${preferences.riskTolerance}\n`;
  }

  // Add team focus instructions
  if (preferences?.teamFocus?.length) {
    prompt += `\nUSER'S TEAM FOCUS (prioritize these teams):\n`;
    preferences.teamFocus.forEach(tf => {
      prompt += `- ${tf.team}: Risk level "${tf.risk}"`;
      if (tf.alwaysInclude) {
        prompt += ` - MUST include this team in at least one suggestion if games available`;
      }
      prompt += `\n`;
    });
  }

  // Add teams to avoid
  if (preferences?.avoidTeams?.length) {
    prompt += `\nTEAMS TO AVOID (do NOT include in any suggestion): ${preferences.avoidTeams.join(', ')}\n`;
  }

  // Add player props if available
  if (playerProps.length > 0) {
    prompt += `\nAVAILABLE PLAYER PROPS:\n`;
    playerProps.forEach(propData => {
      if (propData.props && propData.props.length > 0) {
        prompt += `\nGame ID: ${propData.eventId}\n`;
        // Group by player
        const byPlayer = {};
        propData.props.forEach(prop => {
          if (!byPlayer[prop.player]) byPlayer[prop.player] = [];
          byPlayer[prop.player].push(prop);
        });

        Object.entries(byPlayer).slice(0, 4).forEach(([player, props]) => {
          prompt += `  ${player}:\n`;
          props.slice(0, 4).forEach(prop => {
            const marketName = prop.market.replace('player_', '').replace(/_/g, ' ');
            prompt += `    - ${marketName} ${prop.type} ${prop.point} (${prop.price > 0 ? '+' : ''}${prop.price})\n`;
          });
        });
      }
    });
    prompt += `\nYou may include player props in suggestions. For props, use the player name as "team" and the market type (e.g., "player_points") as "type".\n`;
  }

  prompt += `
REQUIREMENTS:
1. Conservative Pick (2 legs): Only heavy favorites, lowest risk
2. Balanced Pick (3 legs): Mix of favorites with one value pick
3. Value Play (3-4 legs): Include underdogs for higher potential payout

For each leg, use EXACT team names from the games above.

RESPOND WITH ONLY A JSON ARRAY (no markdown, no explanation before or after):
[
  {
    "name": "Conservative Pick",
    "description": "Brief 1-sentence description",
    "riskLevel": "low",
    "legs": [
      {"team": "EXACT Team Name", "type": "moneyline|spread|totals", "price": -150, "point": null, "gameId": "game-id-here"},
      ...
    ],
    "reasoning": "2-3 sentences explaining why these picks work together"
  },
  ...
]

For totals, use "Over" or "Under" as the team name and include the point value.
Include the gameId from the game data above.
Ensure all prices are integers (e.g., -110, +150).`;

  return prompt;
}

function parseAISuggestions(aiContent, allGames) {
  try {
    // Try to extract JSON from the response
    let jsonStr = aiContent.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    // Find JSON array in the response
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in AI response');
      return null;
    }

    // Fix invalid JSON: remove leading + signs on numbers (e.g., +750 -> 750)
    let fixedJson = jsonMatch[0].replace(/:\s*\+(\d+)/g, ': $1');

    const suggestions = JSON.parse(fixedJson);

    // Validate and enhance suggestions
    return suggestions.map((sug, idx) => {
      // Calculate estimated odds from leg prices
      let decimalOdds = 1;
      sug.legs.forEach(leg => {
        const price = leg.price;
        if (price > 0) {
          decimalOdds *= (price / 100) + 1;
        } else {
          decimalOdds *= (100 / Math.abs(price)) + 1;
        }
      });

      return {
        id: `sug-${idx + 1}`,
        name: sug.name || `Suggestion ${idx + 1}`,
        description: sug.description || 'AI-generated parlay suggestion',
        riskLevel: sug.riskLevel || 'medium',
        legs: sug.legs.map(leg => ({
          team: leg.team,
          type: leg.type,
          price: parseInt(leg.price) || -110,
          point: leg.point || null,
          gameId: leg.gameId
        })),
        estimatedOdds: Math.round(decimalOdds * 100) / 100,
        aiReasoning: sug.reasoning || 'Analysis based on current odds and matchup factors.'
      };
    });
  } catch (error) {
    console.error('Failed to parse AI suggestions:', error);
    console.error('AI content was:', aiContent.substring(0, 500));
    return null;
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

function getDefaultSuggestions() {
  return [
    {
      id: 'sug-1',
      name: 'Conservative Pick',
      description: 'Lower risk combination with favorites',
      legs: [
        { team: 'No games available', type: 'moneyline', price: -150 },
        { team: 'Check back later', type: 'spread', point: -3.5, price: -110 }
      ],
      riskLevel: 'low',
      estimatedOdds: 2.6,
      aiReasoning: 'No live games currently available. Please check back when games are scheduled.'
    },
    {
      id: 'sug-2',
      name: 'Balanced Pick',
      description: 'Mix of favorites and slight underdogs',
      legs: [
        { team: 'No games available', type: 'moneyline', price: -120 },
        { team: 'Check back later', type: 'totals', point: 'Over 210.5', price: -110 }
      ],
      riskLevel: 'medium',
      estimatedOdds: 3.5,
      aiReasoning: 'Suggestions will be generated once games are available from The Odds API.'
    },
    {
      id: 'sug-3',
      name: 'Value Play',
      description: 'Higher risk, higher potential reward',
      legs: [
        { team: 'No games available', type: 'moneyline', price: +130 },
        { team: 'Check back later', type: 'moneyline', price: +145 }
      ],
      riskLevel: 'high',
      estimatedOdds: 6.2,
      aiReasoning: 'Value plays require upcoming games. Check back when NBA or NHL games are scheduled.'
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
