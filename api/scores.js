function dateRangeParam(daysAhead){
  const fmt = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);
  return `${fmt(start)}-${fmt(end)}`;
}

export default async function handler(req, res) {
  try {
    const range = dateRangeParam(30);
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${range}`);
    const raw = await response.json();
    const events = raw.events || [];

    const games = events.map(event => {
      const comp = event.competitions[0];
      const away = comp.competitors.find(c => c.homeAway === 'away');
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const state = comp.status.type.state;
      const status = state === 'in' ? 'inprogress' : state === 'post' ? 'final' : 'scheduled';

      const situation = comp.situation || {};
      let yard_line_pct = 50;
      if (typeof situation.yardLine === 'number') {
        yard_line_pct = Math.max(0, Math.min(100, situation.yardLine));
      }

      const note = (comp.notes && comp.notes[0] && comp.notes[0].headline) || null;
      let possessionAbbr = null;
      if (situation.possession) {
        const possTeam = comp.competitors.find(c => c.id === situation.possession);
        if (possTeam) possessionAbbr = possTeam.team.abbreviation;
      }

      return {
        id: event.id,
        status,
        start_time: event.date,
        local_start: new Date(event.date).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit'
        }),
        home: home.team.abbreviation,
        away: away.team.abbreviation,
        home_score: Number(home.score) || 0,
        away_score: Number(away.score) || 0,
        quarter: comp.status.period || null,
        clock: comp.status.displayClock || null,
        down: situation.down || null,
        distance: situation.distance || null,
        yard_line_label: situation.possessionText || null,
        yard_line_pct,
        possession: possessionAbbr,
        title: note
      };
    });

    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scores', details: String(error) });
  }
}
