const RAMS_TEAM_ID = 14;

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
  try {
    const listUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/${RAMS_TEAM_ID}/injuries`;
    const listResp = await fetch(listUrl);
    const list = await listResp.json();
    const items = list.items || [];

    const injuries = await Promise.all(items.map(async (item) => {
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

    res.status(200).json(injuries.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Rams injuries', details: String(error) });
  }
}
