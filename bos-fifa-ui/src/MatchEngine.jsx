import React, { useEffect, useRef, useState, useCallback } from 'react';

// Berapa milidetik nyata per 1 menit simulasi.
const MS_PER_MINUTE = 450;
const HALFTIME_PAUSE_MS = 4000;

// Commentary sekarang menyertakan nama pemain (scorer/assister/kartu) kalau event.playerName
// tersedia — dikirim backend berdasarkan starting XI tim terkait. Kalau untuk alasan apapun
// playerName tidak ada (misal lineup kosong), fallback ke frasa generik lama supaya tidak
// pernah menampilkan "undefined".
function commentaryLine(event, homeName, awayName) {
  const teamName = event.team === 'HOME' ? homeName : event.team === 'AWAY' ? awayName : null;
  switch (event.type) {
    case 'KICK_OFF':
      return `Pertandingan dimulai! ${homeName} vs ${awayName}.`;
    case 'GOAL': {
      const scorer = event.playerName ? event.playerName : `pemain ${teamName}`;
      const assistPart = event.assistName ? ` (assist: ${event.assistName})` : '';
      return `⚽ GOOOL! ${scorer} mencetak gol untuk ${teamName}${assistPart}! Skor kini ${event.score}.`;
    }
    case 'PELUANG_EMAS': {
      const who = event.playerName ? event.playerName : `pemain ${teamName}`;
      return `Peluang emas untuk ${who}! Nyaris saja gol tercipta.`;
    }
    case 'TENDANGAN_MELENCENG': {
      const who = event.playerName ? event.playerName : `Tendangan ${teamName}`;
      return event.playerName
        ? `Tendangan ${who} melenceng jauh dari gawang.`
        : `${who} melenceng jauh dari gawang.`;
    }
    case 'KARTU_KUNING': {
      const who = event.playerName ? event.playerName : `pemain ${teamName}`;
      return `🟨 Kartu kuning untuk ${who} (${teamName}) atas pelanggaran keras.`;
    }
    case 'KARTU_MERAH': {
      const who = event.playerName ? event.playerName : `pemain ${teamName}`;
      return `🟥 KARTU MERAH! ${who} (${teamName}) harus meninggalkan lapangan.`;
    }
    case 'FULL_TIME':
      return `Pertandingan selesai! Skor akhir ${event.score}.`;
    default:
      return null;
  }
}

/**
 * MatchEngine — text-only match viewer, SATU INSTANCE = SATU PERTANDINGAN.
 *
 * Untuk mendukung banyak pertandingan berjalan bersamaan, App.jsx sekarang me-render
 * komponen ini BERULANG (map atas activeMatchIds), masing-masing dengan matchId berbeda.
 * Setiap instance punya timer, state skor, dan commentary sendiri-sendiri — sepenuhnya
 * independen satu sama lain karena semua state (phase, currentMinute, dst) ada di dalam
 * komponen ini, bukan dibagi lewat variabel global/module-level manapun.
 *
 * Props:
 * - matchId: id pertandingan (wajib angka valid; parent hanya me-render instance ini
 *   kalau match tersebut memang sedang aktif).
 * - apiBaseUrl: base url backend.
 * - onLiveUpdate({ matchId, homeTeamId, awayTeamId, homeScore, awayScore, isFinal }):
 *     dipanggil setiap kali skor yang tampil di layar berubah, termasuk 0-0 di kick-off.
 * - onFinished(matchId): dipanggil sekali saat FULL_TIME, membawa matchId sendiri supaya
 *     parent tahu PERTANDINGAN MANA yang selesai (penting karena sekarang bisa ada banyak
 *     instance berjalan bersamaan).
 */
const MatchEngine = ({ matchId, apiBaseUrl = '', onLiveUpdate, onFinished }) => {
  const [phase, setPhase] = useState('idle');
  const [matchData, setMatchData] = useState(null);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [liveScore, setLiveScore] = useState({ home: 0, away: 0 });
  const [commentary, setCommentary] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const commentaryEndRef = useRef(null);
  const timerRef = useRef(null);
  const revealedMinutesRef = useRef(new Set());
  const finishedNotifiedRef = useRef(false);

  const homeName = matchData?.result?.home_team_name || 'Tim Kandang';
  const awayName = matchData?.result?.away_team_name || 'Tim Tandang';

  const fetchMatch = useCallback(async (id) => {
    setPhase('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${apiBaseUrl}/api/matches/simulate/${id}`, { method: 'POST' });
      if (!res.ok) {
        // Status 409 = match ini sudah FINISHED sebelumnya (dicegah backend agar stat
        // pemain tidak dobel-tercatat). Tampilkan pesan yang jelas, bukan error generik.
        if (res.status === 409) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || 'Pertandingan ini sudah selesai.');
        }
        throw new Error(`Server membalas status ${res.status}`);
      }
      const data = await res.json();

      setMatchData(data);
      setCurrentMinute(0);
      setLiveScore({ home: 0, away: 0 });
      setCommentary([]);
      revealedMinutesRef.current = new Set();
      finishedNotifiedRef.current = false;
      setPhase('first_half');

      onLiveUpdate?.({
        matchId: id,
        homeTeamId: data.result?.home_team_id,
        awayTeamId: data.result?.away_team_id,
        homeScore: 0,
        awayScore: 0,
        isFinal: false,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengambil data pertandingan.');
      setPhase('error');
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (matchId === null || matchId === undefined) {
      setPhase('idle');
      return;
    }
    fetchMatch(matchId);
    // Instance ini didedikasikan untuk satu matchId sepanjang hidupnya (parent me-render
    // ulang list dengan key=matchId), jadi effect ini cukup jalan sekali di mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'first_half' && phase !== 'second_half') return undefined;

    timerRef.current = setInterval(() => {
      setCurrentMinute((prev) => {
        const next = prev + 1;

        if (next === 45 && phase === 'first_half') {
          clearInterval(timerRef.current);
          setPhase('halftime');
          return next;
        }
        if (next >= 90) {
          clearInterval(timerRef.current);
          setPhase('full_time');
          return 90;
        }
        return next;
      });
    }, MS_PER_MINUTE);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'halftime') return undefined;
    const t = setTimeout(() => setPhase('second_half'), HALFTIME_PAUSE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Saat FULL_TIME: kirim skor final (isFinal:true) lalu panggil onFinished(matchId) —
  // matchId disertakan supaya parent tahu match spesifik mana yang harus dikeluarkan
  // dari daftar "sedang berjalan", tanpa mengganggu match lain yang masih live.
  useEffect(() => {
    if (phase === 'full_time' && !finishedNotifiedRef.current) {
      finishedNotifiedRef.current = true;
      onLiveUpdate?.({
        matchId,
        homeTeamId: matchData?.result?.home_team_id,
        awayTeamId: matchData?.result?.away_team_id,
        homeScore: liveScore.home,
        awayScore: liveScore.away,
        isFinal: true,
      });
      onFinished?.(matchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (!matchData?.timeline) return;

    matchData.timeline.forEach((event) => {
      const key = `${event.minute}-${event.type}-${event.team || ''}-${event.playerName || ''}`;
      if (event.minute > currentMinute || revealedMinutesRef.current.has(key)) return;
      revealedMinutesRef.current.add(key);

      const line = commentaryLine(event, homeName, awayName);
      if (line) {
        setCommentary((prev) => [...prev, { id: key, minute: event.minute, text: line, type: event.type }]);
      }
      if (event.type === 'GOAL') {
        const [h, a] = event.score.split('-').map(Number);
        setLiveScore({ home: h, away: a });

        onLiveUpdate?.({
          matchId,
          homeTeamId: matchData.result?.home_team_id,
          awayTeamId: matchData.result?.away_team_id,
          homeScore: h,
          awayScore: a,
          isFinal: false,
        });
      }
    });
  }, [currentMinute, matchData, homeName, awayName, matchId, onLiveUpdate]);

  

  if (matchId === null || matchId === undefined) return null;

  const displayMinute = phase === 'halftime' ? 45 : phase === 'full_time' ? 90 : currentMinute;
  const clockLabel =
    phase === 'halftime' ? 'JEDA BABAK 1' : phase === 'full_time' ? 'FULL TIME' : `${displayMinute}'`;

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div className="card-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="g-name" style={{ fontSize: '14px' }}>
          📺 {homeName} vs {awayName}
        </span>
        {phase !== 'idle' && phase !== 'loading' && phase !== 'error' && (
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#E5C26A',
              fontSize: '13px',
              letterSpacing: '1px',
            }}
          >
            {clockLabel}
          </span>
        )}
      </div>

      {phase === 'loading' && (
        <div style={{ padding: '0 15px 15px', color: '#9CB0A4', fontSize: '13px' }}>
          Menyiapkan pertandingan...
        </div>
      )}

      {phase === 'error' && (
        <div style={{ padding: '0 15px 15px', color: '#E86A5C', fontSize: '13px' }}>
          {errorMsg}{' '}
          <button
            type="button"
            onClick={() => fetchMatch(matchId)}
            style={{
              marginLeft: '8px',
              background: 'transparent',
              border: '1px solid #E86A5C',
              color: '#E86A5C',
              borderRadius: '6px',
              padding: '2px 8px',
              cursor: 'pointer',
            }}
          >
            Coba lagi
          </button>
        </div>
      )}

      {matchData && phase !== 'loading' && phase !== 'error' && (
        <div style={{ padding: '0 15px 15px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
              margin: '4px 0 12px',
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#ECEFE8', fontSize: '13px' }}>{homeName}</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '22px',
                color: '#E5C26A',
                background: '#07110C',
                padding: '3px 14px',
                borderRadius: '8px',
              }}
            >
              {liveScore.home} - {liveScore.away}
            </span>
            <span style={{ color: '#ECEFE8', fontSize: '13px' }}>{awayName}</span>
          </div>

          {phase === 'halftime' && (
            <div style={{ textAlign: 'center', color: '#9CB0A4', fontSize: '12px', marginBottom: '8px' }}>
              Jeda babak pertama...
            </div>
          )}
          {phase === 'full_time' && (
            <div style={{ textAlign: 'center', color: '#34D399', fontSize: '12px', marginBottom: '8px' }}>
              {matchData.message}
            </div>
          )}

          <div
            style={{
              background: '#07110C',
              border: '1px solid var(--line-delicate)',
              borderRadius: '10px',
              padding: '10px 12px',
              maxHeight: '160px',
              overflowY: 'auto',
              fontSize: '12px',
              lineHeight: 1.6,
            }}
          >
            {commentary.length === 0 && <div style={{ color: '#9CB0A4' }}>Menunggu kick-off...</div>}
            {commentary.map((c) => (
              <div key={c.id} style={{ color: c.type === 'GOAL' ? '#E5C26A' : '#ECEFE8', marginBottom: '4px' }}>
                <span style={{ color: '#9CB0A4', fontFamily: 'monospace' }}>{c.minute}&apos; </span>
                {c.text}
              </div>
            ))}
            <div ref={commentaryEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchEngine;