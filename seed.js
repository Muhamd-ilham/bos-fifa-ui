const pool = require('./db');

async function runSeed() {
    try {
        console.log('⏳ Memulai proses injeksi data massal ke PostgreSQL...');
        
        // 1. Bersihkan semua data lama agar tidak dobel (Reset ID ke 1)
        await pool.query('TRUNCATE matches, players, clubs, leagues RESTART IDENTITY CASCADE');
        console.log('🧹 Data lama berhasil dibersihkan.');

        // 2. Masukkan Liga
        const leagueRes = await pool.query(
            "INSERT INTO leagues (name, country) VALUES ('Liga Super Dunia', 'Global') RETURNING id"
        );
        const leagueId = leagueRes.rows[0].id;

        // 3. Data Klub Raksasa
        const clubsData = [
            { name: 'Manchester City', stadium: 'Etihad Stadium' },
            { name: 'Real Madrid', stadium: 'Santiago Bernabeu' },
            { name: 'FC Barcelona', stadium: 'Camp Nou' },
            { name: 'Bayern Munchen', stadium: 'Allianz Arena' },
            { name: 'Arsenal', stadium: 'Emirates Stadium' },
            { name: 'Paris Saint-Germain', stadium: 'Parc des Princes' }
        ];

        let clubIds = [];
        for (let c of clubsData) {
            const res = await pool.query(
                "INSERT INTO clubs (name, league_id, stadium_name) VALUES ($1, $2, $3) RETURNING id",
                [c.name, leagueId, c.stadium]
            );
            clubIds.push(res.rows[0].id);
        }

        // 4. Data Pemain Bintang
        const playersData = [
            // Man City (ID: 1)
            { name: 'Erling Haaland', nat: 'Norway', clubId: clubIds[0], pos: 'ST', ovr: 91, pace: 89, pass: 65, shoot: 94, def: 45 },
            { name: 'Kevin De Bruyne', nat: 'Belgium', clubId: clubIds[0], pos: 'CM', ovr: 91, pace: 72, pass: 98, shoot: 85, def: 60 },
            // Real Madrid (ID: 2)
            { name: 'Kylian Mbappe', nat: 'France', clubId: clubIds[1], pos: 'ST', ovr: 91, pace: 97, pass: 80, shoot: 90, def: 36 },
            { name: 'Vinicius Jr', nat: 'Brazil', clubId: clubIds[1], pos: 'LW', ovr: 90, pace: 95, pass: 81, shoot: 84, def: 29 },
            // Barcelona (ID: 3)
            { name: 'Robert Lewandowski', nat: 'Poland', clubId: clubIds[2], pos: 'ST', ovr: 90, pace: 75, pass: 79, shoot: 91, def: 44 },
            { name: 'Lamine Yamal', nat: 'Spain', clubId: clubIds[2], pos: 'RW', ovr: 85, pace: 88, pass: 82, shoot: 79, def: 35 },
            // Bayern Munchen (ID: 4)
            { name: 'Harry Kane', nat: 'England', clubId: clubIds[3], pos: 'ST', ovr: 90, pace: 69, pass: 84, shoot: 93, def: 49 },
            { name: 'Jamal Musiala', nat: 'Germany', clubId: clubIds[3], pos: 'CAM', ovr: 88, pace: 87, pass: 85, shoot: 82, def: 55 },
            // Arsenal (ID: 5)
            { name: 'Bukayo Saka', nat: 'England', clubId: clubIds[4], pos: 'RW', ovr: 88, pace: 86, pass: 84, shoot: 83, def: 65 },
            { name: 'Martin Odegaard', nat: 'Norway', clubId: clubIds[4], pos: 'CM', ovr: 89, pace: 75, pass: 89, shoot: 85, def: 70 },
            // PSG (ID: 6)
            { name: 'Ousmane Dembele', nat: 'France', clubId: clubIds[5], pos: 'RW', ovr: 86, pace: 93, pass: 79, shoot: 77, def: 36 },
            { name: 'Achraf Hakimi', nat: 'Morocco', clubId: clubIds[5], pos: 'RB', ovr: 84, pace: 92, pass: 79, shoot: 75, def: 80 }
        ];

        for (let p of playersData) {
            await pool.query(
                "INSERT INTO players (name, nationality, club_id, position, overall_rating, pace, passing, shooting, defending) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                [p.name, p.nat, p.clubId, p.pos, p.ovr, p.pace, p.pass, p.shoot, p.def]
            );
        }

        console.log('✅ SUPER! 6 Klub Raksasa dan Pemainnya berhasil di-inject ke Database!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Waduh, error saat injeksi:', err);
        process.exit(1);
    }
}

runSeed();