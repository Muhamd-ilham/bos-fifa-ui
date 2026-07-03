const fs = require('fs');
const csv = require('csv-parser');
const pool = require('./db');

const fileName = 'elite_database.csv';

const COUNTRY_MAP = {
    'Premier League': 'England', 'La Liga': 'Spain', 
    'Serie A': 'Italy', 'Bundesliga': 'Germany', 'Ligue 1': 'France'
};

async function importData() {
    console.log(`⏳ Node.js menyedot data dari CSV bersih...`);
    const memoryDB = {}; 

    fs.createReadStream(fileName)
        .pipe(csv())
        .on('data', (row) => {
            const league = row.league;
            const club = row.club;

            if (!memoryDB[league]) memoryDB[league] = {};
            if (!memoryDB[league][club]) memoryDB[league][club] = [];

            memoryDB[league][club].push(row);
        })
        .on('end', async () => {
            try {
                console.log(`🔨 Membangun pondasi tabel di rumah baru (Neon.tech)...`);
                
                // 1. OTOMATIS BIKIN TABEL KALAU BELUM ADA
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS leagues (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        country VARCHAR(255)
                    );
                    CREATE TABLE IF NOT EXISTS clubs (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        league_id INT REFERENCES leagues(id) ON DELETE CASCADE
                    );
                    CREATE TABLE IF NOT EXISTS players (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        nationality VARCHAR(255),
                        club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
                        position VARCHAR(50),
                        overall_rating INT,
                        pace INT,
                        shooting INT,
                        passing INT,
                        defending INT
                    );
                    CREATE TABLE IF NOT EXISTS matches (
                        id SERIAL PRIMARY KEY,
                        home_team_id INT REFERENCES clubs(id) ON DELETE CASCADE,
                        away_team_id INT REFERENCES clubs(id) ON DELETE CASCADE,
                        home_score INT DEFAULT 0,
                        away_score INT DEFAULT 0,
                        status VARCHAR(50) DEFAULT 'SCHEDULED',
                        matchday INT
                    );
                `);

                console.log(`🧹 Tabel siap! Mereset data lama...`);
                await pool.query('TRUNCATE matches, players, clubs, leagues RESTART IDENTITY CASCADE');

                let countPlayers = 0;
                let countClubs = 0;
                let countLeagues = 0;

                console.log(`🚀 Mengirim data ke server awan... (Tunggu sebentar ya)`);

                for (const [leagueName, clubsData] of Object.entries(memoryDB)) {
                    const country = COUNTRY_MAP[leagueName] || 'Global';
                    const leagueRes = await pool.query(
                        "INSERT INTO leagues (name, country) VALUES ($1, $2) RETURNING id",
                        [leagueName, country]
                    );
                    const leagueId = leagueRes.rows[0].id;
                    countLeagues++;

                    for (const [clubName, players] of Object.entries(clubsData)) {
                        const clubRes = await pool.query(
                            "INSERT INTO clubs (name, league_id) VALUES ($1, $2) RETURNING id",
                            [clubName, leagueId]
                        );
                        const clubId = clubRes.rows[0].id;
                        countClubs++;

                        for (const p of players) {
                            await pool.query(
                                `INSERT INTO players 
                                (name, nationality, club_id, position, overall_rating, pace, passing, shooting, defending) 
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                                [p.name, p.nationality, clubId, p.position, p.overall, p.pace, p.passing, p.shooting, p.defending]
                            );
                            countPlayers++;
                        }
                    }
                }

                console.log(`\n=== 📊 REKAPITULASI FINAL KE SERVER CLOUD ===`);
                console.log(`🏆 Total Liga  : ${countLeagues} Liga`);
                console.log(`🛡️ Total Klub  : ${countClubs} Klub`);
                console.log(`⚽ Total Pemain: ${countPlayers} Pemain Elit`);
                process.exit(0);
            } catch (err) {
                console.error("❌ ERROR:", err);
                process.exit(1);
            }
        });
}

importData();