/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// export default {
// 	async fetch(request, env, ctx) {
// 		const url = new URL(request.url);
// 		switch (url.pathname) {
// 			case '/message':
// 				return new Response('Hello, World!');
// 			case '/random':
// 				return new Response(crypto.randomUUID());
// 			default:
// 				return new Response('Not Found', { status: 404 });
// 		}
// 	},
// };

// import dashboardHTML from './dashboard.html';

export default {
	async fetch(request, env) {
	  const url = new URL(request.url);
	  
	  // API route
	  if (url.pathname === '/api/feedback') {
		try {
		  const ranked = await getRankedFeedback(env);
		  return new Response(JSON.stringify(ranked, null, 2), {
			headers: { 
			  'Content-Type': 'application/json',
			  'Access-Control-Allow-Origin': '*'
			}
		  });
		} catch (error) {
		  console.error('API Error:', error);
		  return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		  });
		}
	  }
	  
	  // Let assets middleware handle static files
	  // Don't return anything - undefined is fine
	}
  };
  
  async function getRankedFeedback(env) {
	const { results } = await env.feedback_db
	  .prepare('SELECT * FROM feedback')
	  .all();
	
	if (!results || results.length === 0) {
	  return [];
	}
	
	const groups = await deduplicateWithAI(results, env.AI);
	
	const ranked = groups.map(group => {
	  const recencyScore = calculateRecency(group.items);
	  const frequencyScore = group.items.length;
	  const severityScore = group.items.reduce((sum, item) => sum + item.upvotes, 0);
	  
	  const urgencyScore =
		(recencyScore * 0.3) +
		(frequencyScore * 0.3) +
		(severityScore * 0.4);
	  
	  return {
		title: group.title,
		count: group.items.length,
		total_upvotes: severityScore,
		sources: [...new Set(group.items.map(i => i.source))],
		urgency_score: Math.round(urgencyScore * 100) / 100,
		latest_timestamp: Math.max(...group.items.map(i => i.timestamp))
	  };
	});
	
	return ranked.sort((a, b) => b.urgency_score - a.urgency_score);
  }
  
  async function deduplicateWithAI(feedback, AI) {
	const feedbackList = feedback
	  .map((item, idx) => `${idx}. [${item.source}] ${item.title}`)
	  .join('\n');
  
	const prompt = `
  Group the feedback into issue categories based on meaning.
  
  FEEDBACK:
  ${feedbackList}
  
  Rules:
  - Create as many groups as needed to cover all issues
  - Each group must represent one distinct issue
  - Similar feedback having common words must be in the same group
  - Indices refer to positions in FEEDBACK without duplicate and ignorance.
  
  Return ONLY valid JSON in this format:
  {"groups":[{"title":"Issue name","indices":[0,2]}]}
  `;
  
	try {
	  const response = await AI.run('@cf/meta/llama-3-8b-instruct', {
		messages: [
		  { role: 'system', content: 'You are a JSON API. Return ONLY the JSON object. No explanations, no markdown, no extra text before or after.' },
		  { role: 'user', content: prompt }
		],
		max_tokens: 2048,
	  });
  
	  console.log('AI Raw Response:', response.response);
  
	  let jsonText = response.response.trim();
  
	  // Remove markdown code fences
	  jsonText = jsonText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  
	  // Find the first opening brace
	  const firstBrace = jsonText.indexOf('{');
	  if (firstBrace === -1) {
		throw new Error('No opening brace found');
	  }
  
	  // Count braces to find the MATCHING closing brace
	  let braceCount = 0;
	  let lastBrace = -1;
  
	  for (let i = firstBrace; i < jsonText.length; i++) {
		if (jsonText[i] === '{') {
		  braceCount++;
		} else if (jsonText[i] === '}') {
		  braceCount--;
		  if (braceCount === 0) {
			// Found the matching closing brace!
			lastBrace = i;
			break;
		  }
		}
	  }
  
	  if (lastBrace !== -1) {
		jsonText = jsonText.substring(firstBrace, lastBrace + 1);
		console.log('Extracted JSON:', jsonText);
	  } else {
		throw new Error('No matching closing brace found');
	  }
  
	  const json = JSON.parse(jsonText);
      const groups = json.groups || json.group;

	  if (!groups || !Array.isArray(json.groups)) {
		throw new Error('Invalid JSON structure');
	  }
  
	  console.log(`AI grouped ${feedback.length} items into ${json.groups.length} groups`);
  
	  return json.groups.map(group => ({
		title: group.title,
		items: group.indices.map(i => feedback[i]).filter(Boolean)
	  }));
	} catch (err) {
	  console.error('AI parsing failed:', err.message);
	  console.log('Using fallback grouping...');
	  return fallbackGrouping(feedback);
	}
  }
  function fallbackGrouping(feedback) {
	const groups = new Map();
	
	feedback.forEach(item => {
	  const lower = item.title.toLowerCase();
	  let groupKey = item.title;
	  
	  if (lower.includes('deploy') || lower.includes('timeout') || lower.includes('hanging')) {
		groupKey = 'Deployment Issues';
	  } else if (lower.includes('d1') || lower.includes('database') || lower.includes('queries') || lower.includes('migration')) {
		groupKey = 'D1 Database Issues';
	  } else if (lower.includes('dashboard') || lower.includes('ui') || lower.includes('loading') || lower.includes('freezing')) {
		groupKey = 'Dashboard Performance';
	  } else if (lower.includes('ai') || lower.includes('rate limit') || lower.includes('throttl')) {
		groupKey = 'Workers AI Rate Limits';
	  } else if (lower.includes('doc') || lower.includes('example')) {
		groupKey = 'Documentation Issues';
	  } else if (lower.includes('bill') || lower.includes('pric') || lower.includes('cost')) {
		groupKey = 'Billing & Pricing';
	  } else if (lower.includes('r2') || lower.includes('upload')) {
		groupKey = 'R2 Upload Issues';
	  } else if (lower.includes('domain')) {
		groupKey = 'Custom Domain Issues';
	  }
	  
	  if (!groups.has(groupKey)) {
		groups.set(groupKey, []);
	  }
	  groups.get(groupKey).push(item);
	});
	
	console.log(` Fallback grouped into ${groups.size} groups`);
	
	return Array.from(groups.entries()).map(([title, items]) => ({
	  title,
	  items
	}));
  }
  
  function calculateRecency(items) {
	const now = Date.now();
	const latest = Math.max(...items.map(i => i.timestamp));
	const daysOld = (now - latest) / (1000 * 60 * 60 * 24);
	return Math.max(0, 100 - daysOld * 10);
  }