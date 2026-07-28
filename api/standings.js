export default async function handler(req, res) {
  try {
    const response = await fetch('https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings');
    const raw = await response.json();

    const groups = [];
    function walk(node, ancestors) {
      if (node.standings && Array.isArray(node.standings.entries)) {
        const conference = ancestors.find(a => a.isConference);
        groups.push({
          groupName: node.name,
          size: node.standings.entries.length,
          conferenceAbbr: conference ? conference.abbreviation : null,
          entries: node.standings.entries
        });
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(child => walk(child, [...ancestors, node]));
      }
    }
    walk(raw, []);

    const best = {};
    groups.forEach(group => {
      group.entries.forEach(entry => {
        const abbr = entry.team.abbreviation;
        if (!best[abbr] || group.size < best[abbr].groupSize) {
          best[abbr] = { group, entry, groupSize: group.size };
        }
      });
    });

    function statValue(stats, name) {
      const found = (stats || []).find(s => s.name && s.name.toLowerCase() === name.toLowerCase());
      return found ? Number(found.value) : 0;
    }

    const standings = Object.values(best).map(({ group, entry }) => {
      const wins = statValue(entry.stats, 'wins');
      const losses = statValue(entry.stats, 'losses');
      const ties = statValue(entry.stats, 'ties');
      const totalGames = wins + losses + ties;
      return {
        rank: { conference: null, division: null, clinched: null },
        team: {
          name: entry.team.displayName || entry.team.name,
          abbreviation: entry.team.abbreviation
        },
        wins,
        losses,
        ties,
        win_percentage: totalGames > 0 ? +(wins / totalGames).toFixed(3) : 0,
        conference: group.conferenceAbbr === 'AFC' ? 'AFC' : 'NFC',
        division: group.groupName
      };
    });

    res.status(200).json(standings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch standings', details: String(error) });
  }
}
