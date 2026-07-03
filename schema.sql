-- Tabel Liga
CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    tier INT DEFAULT 1
);

-- Tabel Klub
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    league_id INT REFERENCES leagues(id),
    stadium_name VARCHAR(100),
    budget BIGINT DEFAULT 0
);

-- Tabel Pemain
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    club_id INT REFERENCES clubs(id),
    position VARCHAR(10) NOT NULL,
    overall_rating INT NOT NULL,
    pace INT,
    passing INT,
    shooting INT,
    defending INT
);