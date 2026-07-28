export default async function handler(req, res) {
  const eventId = req.query.id;
  if (!eventId) {
    res.status(400).json({ error: 'Missing ?id= event ID' });
    return;
  }
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`);
    const raw = await response.json();

    const box = raw.boxscore || {};
    const teams = (box.teams || []).map(t => ({
      team: t.team?.abbreviation,
      stats: (t.statistics || []).map(s => ({
        name: s.name,
        label: s.label || s.displayName,
        value: s.displayValue
      }))
    }));

    res.status(200).json({ teams });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game summary', details: String(error) });
  }
}
