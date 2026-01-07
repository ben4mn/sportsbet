import api from './api.js';

export async function getOddsBySport(sport) {
  return api.get(`/odds/${sport}`);
}

export async function getGameOdds(sport, gameId) {
  return api.get(`/odds/${sport}/${gameId}`);
}

export default {
  getOddsBySport,
  getGameOdds,
};
