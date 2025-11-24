const axios = require('axios');
const BASE_URL = 'https://www.basketball-bund.net/rest';

async function fetchTeamMatches(teamId) {
  const url = `${BASE_URL}/team/id/${teamId}/matches`;
  try {
    const res = await axios.get(url);
    return res.data?.data?.matches || [];
  } catch (err) {
    console.error('API error for matches', teamId, err.response ? err.response.status : err.message);
    return [];
  }
}

async function fetchMatchInfo(matchId) {
  const url = `${BASE_URL}/match/id/${matchId}/matchInfo`;
  try {
    const res = await axios.get(url);
    return res.data?.data || null;
  } catch (err) {
    console.error('API error for matchInfo', matchId, err.response ? err.response.status : err.message);
    return null;
  }
}

module.exports = { fetchTeamMatches, fetchMatchInfo };
