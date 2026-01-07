import api from './api.js';

export async function getTeams(sport) {
  return api.get(`/stats/${sport}/teams`);
}

export async function getTeamStats(sport, teamId) {
  return api.get(`/stats/${sport}/team/${teamId}`);
}

export async function getPlayerStats(sport, playerId) {
  return api.get(`/stats/${sport}/player/${playerId}`);
}

export async function searchPlayers(sport, query) {
  return api.get(`/stats/${sport}/players?search=${encodeURIComponent(query)}`);
}

export default {
  getTeams,
  getTeamStats,
  getPlayerStats,
  searchPlayers,
};
