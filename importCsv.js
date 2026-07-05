const fs = require('fs');
const csv = require('csv-parser');
const pool = require('./db');

// KITA SEKARANG BACA FILE YANG UDAH DIBERSIHKAN PYTHON!
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
                console.log(`🧹 Reset Database...`);
                await pool.query('TRUNCATE matches, players, clubs, leagues RESTART IDENTITY CASCADE');

                let countPlayers = 0;
                let countClubs = 0;
                let countLeagues = 0;

                for (const [leagueName, clubsData] of Object.entries(memoryDB)) {
                    // 1. Masukin Liga
                    const country = COUNTRY_MAP[leagueName] || 'Global';
                    const leagueRes = await pool.query(
                        "INSERT INTO leagues (name, country) VALUES ($1, $2) RETURNING id",
                        [leagueName, country]
                    );
                    const leagueId = leagueRes.rows[0].id;
                    countLeagues++;

                    for (const [clubName, players] of Object.entries(clubsData)) {
                        // 2. Masukin Klub
                        const clubRes = await pool.query(
                            "INSERT INTO clubs (name, league_id) VALUES ($1, $2) RETURNING id",
                            [clubName, leagueId]
                        );
                        const clubId = clubRes.rows[0].id;
                        countClubs++;

                        // 3. Masukin Pemain
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

                console.log(`\n=== 📊 REKAPITULASI FINAL ===`);
                console.log(`🏆 Total Liga  : ${countLeagues} Liga`);
                console.log(`🛡️ Total Klub  : ${countClubs} Klub (Sempurna 96 Klub!)`);
                console.log(`⚽ Total Pemain: ${countPlayers} Pemain Elit`);
                process.exit(0);
            } catch (err) {
                console.error("❌ ERROR:", err);
                process.exit(1);
            }
        });
}

importData();