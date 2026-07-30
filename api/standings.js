export default async function handler(req, res) {
  try {
    const response = await fetch('https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings');
    const raw = await response.json();

    const DIVISIONS = {
      BUF:['AFC','AFC East'], MIA:['AFC','AFC East'], NE:['AFC','AFC East'], NYJ:['AFC','AFC East'],
      BAL:['AFC','AFC North'], CIN:['AFC','AFC North'], CLE:['AFC','AFC North'], PIT:['AFC','AFC North'],
      HOU:['AFC','AFC South'], IND:['AFC','AFC South'], JAX:['AFC','AFC South'], JAC:['AFC','AFC South'], TEN:['AFC','AFC South'],
      DEN:['AFC','AFC West'], KC:['AFC','AFC West'], LV:['AFC','AFC West'], LAC:['AFC','AFC West'],
      DAL:['NFC','NFC East'], NYG:['NFC','NFC East'], PHI:['NFC','NFC East'], WSH:['NFC','NFC East'], WAS:['NFC','NFC East'],
      CHI:['NFC','NFC North'], DET:['NFC','NFC North'], GB:['NFC','NFC North'], MIN:['NFC','NFC North'],
      ATL:['NFC','NFC South'], CAR:['NFC','NFC South'], NO:['NFC','NFC South'], TB:['NFC','NFC South'],
      ARI:['NFC','NFC West'], LAR:['NFC','NFC West'], LA:['NFC','NFC West'], SF:['NFC','NFC West'], SEA:['NFC','NFC West']
    };

    const seen = {};
    function walk(node) {
      if (node.standings && Array.isArray(node.standings.entries)) {
        node.standings.entries.forEach(entry => {
          const abbr = entry.team.abbreviation;
          if (!seen[abbr]) seen[abbr] = entry;
        });
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    }
    walk(raw);

    function statValue(stats, name) {
      const found = (stats || []).find(s => s.name && s.name.toLowerCase() === name.toLowerCase());
      return found ? Number(found.value) : 0;
    }

    const standings = Object.values(seen).map(entry => {
      const abbr = entry.team.abbreviation;
      const [conference, division] = DIVISIONS[abbr] || ['NFC', 'Unknown'];
      const wins = statValue(entry.stats, 'wins');
      const losses = statValue(entry.stats, 'losses');
      const ties = statValue(entry.stats, 'ties');
      const totalGames = wins + losses + ties;
      return {
        rank: { conference: null, division: null, clinched: null },
        team: { name: entry.team.displayName || entry.team.name, abbreviation: abbr },
        wins, losses, ties,
        win_percentage: totalGames > 0 ? +(wins / totalGames).toFixed(3) : 0,
        conference, division
      };
    });

    res.status(200).json(standings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch standings', details: String(error) });
  }
}
