const ESPN_TEAM_IDS = {
  ARI:22, ATL:1, BAL:33, BUF:2, CAR:29, CHI:3, CIN:4, CLE:5, DAL:6, DEN:7,
  DET:8, GB:9, HOU:34, IND:11, JAC:30, KC:12, LV:13, LAC:24, LA:14, MIA:15,
  MIN:16, NE:17, NO:18, NYG:19, NYJ:20, PHI:21, PIT:23, SF:25, SEA:26, TB:27,
  TEN:10, WAS:28
};

async function resolveRef(refUrl) {
  if (!refUrl) return null;
  try {
    const r = await fetch(refUrl);
    return await r.json();
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const team = (req.query.team || '').toUpperCase();
  const teamId = ESPN_TEAM_IDS[team];
  if (!teamId) {
    res.status(400).json({ error: `Unknown team abbreviation: ${team}` });
    return;
  }

  try {
    const listUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/${teamId}/injuries`;
    const listResp = await fetch(listUrl);
    const list = await listResp.json();
    const items = list.items || [];

    const notes = await Promise.all(items.map(async (item) => {
      const detail = item.$ref ? await resolveRef(item.$ref) : item;
      if (!detail) return null;

      let athleteName = detail.athlete?.displayName;
      if (!athleteName && detail.athlete?.$ref) {
        const athlete = await resolveRef(detail.athlete.$ref);
        athleteName = athlete?.displayName;
      }

      return {
        name: athleteName || 'Unknown player',
        status: detail.status || detail.type?.description || 'Unknown',
        comment: detail.shortComment || detail.longComment || ''
      };
    }));

    res.status(200).json(notes.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch notes for ${team}`, details: String(error) });
  }
}
