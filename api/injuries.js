export default async function handler(req, res) {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries');
    const raw = await response.json();
    const list = raw.injuries || [];

    const byTeam = {};
    list.forEach(teamBlock => {
      const abbr = teamBlock.team && teamBlock.team.abbreviation;
      if (!abbr) return;
      const players = (teamBlock.injuries || []).map(inj => {
        const athlete = inj.athlete || {};
        const status = inj.status || (inj.type && inj.type.name) || 'Unknown';
        const comment = inj.shortComment || inj.longComment || '';
        return {
          name: athlete.displayName || 'Unknown',
          position: (athlete.position && athlete.position.abbreviation) || '',
          status,
          comment
        };
      });
      byTeam[abbr] = players;
    });

    res.status(200).json(byTeam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch injuries', details: String(error) });
  }
}
