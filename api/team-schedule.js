const ESPN_TEAM_IDS = {
  ARI:22, ATL:1, BAL:33, BUF:2, CAR:29, CHI:3, CIN:4, CLE:5, DAL:6, DEN:7,
  DET:8, GB:9, HOU:34, IND:11, JAC:30, KC:12, LV:13, LAC:24, LA:14, MIA:15,
  MIN:16, NE:17, NO:18, NYG:19, NYJ:20, PHI:21, PIT:23, SF:25, SEA:26, TB:27,
  TEN:10, WAS:28
};

export default async function handler(req, res) {
  const team = (req.query.team || '').toUpperCase();
  const teamId = ESPN_TEAM_IDS[team];
  if (!teamId) {
    res.status(400).json({ error: `Unknown team abbreviation: ${team}` });
    return;
  }

  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule`);
    const raw = await response.json();
    const events = raw.events || [];

    const games = events.map(event => {
      const comp = event.competitions?.[0];
      const opponent = event.competitions?.[0]?.competitors?.find(c => c.id !== String(teamId));
      const self = event.competitions?.[0]?.competitors?.find(c => c.id === String(teamId));
      const isHome = self?.homeAway === 'home';

      return {
        week: event.week?.number ?? null,
        date: event.date,
        local_date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        opponent: opponent?.team?.abbreviation || '???',
        homeAway: isHome ? 'home' : 'away',
        status: comp?.status?.type?.state === 'post' ? 'final' : comp?.status?.type?.state === 'in' ? 'inprogress' : 'scheduled',
        selfScore: self?.score ?? null,
        opponentScore: opponent?.score ?? null,
        result: comp?.status?.type?.state === 'post'
          ? (Number(self?.score) > Number(opponent?.score) ? 'W' : Number(self?.score) < Number(opponent?.score) ? 'L' : 'T')
          : null
      };
    });

    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch schedule for ${team}`, details: String(error) });
  }
}
