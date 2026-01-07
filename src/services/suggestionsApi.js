import api from './api.js';

export async function getDailySuggestions() {
  return api.get('/suggestions/daily');
}

export async function analyzeParlay(legs) {
  return api.post('/suggestions/analyze', { legs });
}

export default {
  getDailySuggestions,
  analyzeParlay,
};
