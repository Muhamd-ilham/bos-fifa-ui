import { useEffect, useState } from 'react';
import MatchEngine from './MatchEngine';
import './App.css';

function App() {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);

  // --- STATE BARU UNTUK NAVIGASI PEKAN ---
  const [currentMatchday, setCurrentMatchday] = useState(1);

  useEffect(() => {
    fetch('http://localhost:3000/api/leagues')
      .then(res => res.json())
      .then(data => {
        setLeagues(data);
        if (data.length > 0) {
          setSelectedLeague(data[0].id);
        }
      });
  }, []);

  const fetchData = (leagueId) => {
    if (!leagueId) return;

    fetch(`http://localhost:3000/api/players/${leagueId}`)
      .then(res => res.json())
      .then(data => setPlayers(data));

    fetch(`http://localhost:3000/api/matches/${leagueId}`)
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        // setCurrentMatchday(1) DIHAPUS dari sini
      });

    fetch(`http://localhost:3000/api/standings/${leagueId}`)
      .then(res => res.json())
      .then(data => setStandings(data));
};

// useEffect terpisah KHUSUS buat reset pekan, HANYA jalan saat selectedLeague berubah
useEffect(() => {
    fetchData(selectedLeague);
    setCurrentMatchday(1); // Reset ke pekan 1 HANYA saat ganti liga
}, [selectedLeague]);

  const handleSimulate = (matchId) => {
    window.dispatchEvent(new CustomEvent('startMatch'));
    fetch(`http://localhost:3000/api/matches/simulate/${matchId}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setTimeout(() => {
          // Menampilkan Skor Akhir
          alert(data.message);
          // (Opsional) Cek Console Browser (F12) buat lihat detail menit gol & kartu dari Mesin Poisson Abang!
          console.log("TIMELINE PERTANDINGAN:", data.timeline); 
          fetchData(selectedLeague); 
        }, 3000);
      });
  };

  const handleGenerateSchedule = () => {
    if (window.confirm("Buat jadwal semusim Home-Away untuk liga ini? Jadwal lama akan terhapus!")) {
      fetch(`http://localhost:3000/api/schedule/generate/${selectedLeague}`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          fetchData(selectedLeague);
        });
    }
  };

  // --- LOGIKA FILTER PEKAN ---
  // Cari tau liga ini mentok di pekan berapa (38 atau 34)
  const maxMatchday = matches.length > 0 ? Math.max(...matches.map(m => Number(m.matchday) || 1)) : 1;
  // Saring jadwal: HANYA TAMPILKAN pertandingan yang sesuai dengan Pekan saat ini
  const displayedMatches = matches.filter(m => m.matchday === currentMatchday);

  return (
    <div className="dashboard-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🏆 Dashboard Bos FIFA</h1>
          <p>Control Panel Manajemen Sepak Bola Global</p>
        </div>
        
        <div style={{ background: '#1e293b', padding: '10px 20px', borderRadius: '10px', border: '1px solid #334155' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold', color: '#94a3b8' }}>Pilih Liga:</label>
          <select 
            value={selectedLeague} 
            onChange={(e) => setSelectedLeague(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', background: '#0f172a', color: '#fff', border: '1px solid #38bdf8', fontSize: '1rem', cursor: 'pointer' }}
          >
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.total_clubs} Klub)</option>
            ))}
          </select>
        </div>
      </header>

      <main>
        <MatchEngine />

        <div className="card" style={{ marginBottom: '25px' }}>
          <h2>📊 Klasemen Liga</h2>
          <table className="player-table">
            <thead>
              <tr>
                <th>Pos</th><th>Klub</th><th>Main</th><th>M</th><th>S</th><th>K</th><th>GM</th><th>GK</th><th>Poin</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 'bold', color: index === 0 ? '#00ff87' : '#94a3b8' }}>{index + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>{team.club}</td>
                  <td>{team.played}</td><td>{team.won}</td><td>{team.drawn}</td><td>{team.lost}</td>
                  <td>{team.goals_for}</td><td>{team.goals_against}</td>
                  <td style={{ color: '#00f0ff', fontWeight: '900', fontSize: '1.1rem' }}>{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>🗓️ Jadwal Pertandingan</h2>
            <button onClick={handleGenerateSchedule} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              🔄 Generate Jadwal Baru
            </button>
          </div>

          {/* --- KONTROL NAVIGASI PEKAN --- */}
          {matches.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px', padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
              <button 
                onClick={() => setCurrentMatchday(prev => Math.max(1, prev - 1))}
                disabled={currentMatchday === 1}
                style={{ padding: '8px 15px', cursor: currentMatchday === 1 ? 'not-allowed' : 'pointer', background: currentMatchday === 1 ? '#334155' : '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
              >
                ◀ Pekan Sebelumnya
              </button>
              
              <h3 style={{ margin: 0, color: '#00ff87' }}>PEKAN {currentMatchday} <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>dari {maxMatchday}</span></h3>
              
              <button 
                onClick={() => setCurrentMatchday(prev => Math.min(maxMatchday, prev + 1))}
                disabled={currentMatchday === maxMatchday}
                style={{ padding: '8px 15px', cursor: currentMatchday === maxMatchday ? 'not-allowed' : 'pointer', background: currentMatchday === maxMatchday ? '#334155' : '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
              >
                Pekan Selanjutnya ▶
              </button>
            </div>
          )}

          {/* Menampilkan hanya pertandingan di pekan yang dipilih */}
          <div className="match-list">
            {displayedMatches.map((match) => (
              <div key={match.id} className="match-card">
                <div className="team-name">{match.home_team}</div>
                <div className="score-display">
                  {match.status === 'FINISHED' ? <span className="score-numbers">{match.home_score} - {match.away_score}</span> : <span className="vs-badge">VS</span>}
                </div>
                <div className="team-name">{match.away_team}</div>
                <div className="match-action">
                  {match.status === 'SCHEDULED' ? <button className="btn-simulate" onClick={() => handleSimulate(match.id)}>Simulasikan</button> : <span className="badge-finished">Selesai</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>⭐ Top Pemain di Liga Ini</h2>
          <table className="player-table">
            <thead>
              <tr><th>Nama Pemain</th><th>Posisi</th><th>OVR</th><th>Klub</th></tr>
            </thead>
            <tbody>
              {players.map((p, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                  <td><span className="badge">{p.position}</span></td>
                  <td style={{ color: '#00f0ff', fontWeight: '900' }}>{p.overall_rating}</td>
                  <td>{p.club}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;