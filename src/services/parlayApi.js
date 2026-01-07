import api from './api.js';

export async function getUserParlays() {
  return api.get('/parlays');
}

export async function saveParlay(parlay) {
  return api.post('/parlays', parlay);
}

export async function updateParlay(id, data) {
  return api.put(`/parlays/${id}`, data);
}

export async function deleteParlay(id) {
  return api.delete(`/parlays/${id}`);
}

export default {
  getUserParlays,
  saveParlay,
  updateParlay,
  deleteParlay,
};
