import requests
from bs4 import BeautifulSoup

URL = "https://en.wikipedia.org/wiki/2025%E2%80%9326_Premier_League"

def scrape_premier_league_clubs():
    headers = {'User-Agent': 'Mozilla/5.0 (data-fix-script)'}
    resp = requests.get(URL, headers=headers)
    resp.raise_for_status()
    
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    clubs = []
    tables = soup.find_all('table', {'class': 'wikitable'})
    
    for table in tables:
        header_row = table.find('tr')
        if not header_row:
            continue
        header_text = header_row.get_text().lower()
        
        # Cuma proses tabel yang emang tabel daftar klub
        # (biasanya punya kolom "Location"/"Stadium"/"Capacity")
        if not ('stadium' in header_text or 'capacity' in header_text or 'location' in header_text):
            continue
        
        rows = table.find_all('tr')
        for row in rows[1:]:
            cols = row.find_all(['td', 'th'])
            if len(cols) < 2:
                continue
            link = cols[0].find('a')
            if link and link.get('title'):
                name = link.get('title').strip()
                clubs.append(name)
        
        break  # ambil tabel klub pertama yang cocok aja, stop
    
    seen = set()
    unique_clubs = []
    for c in clubs:
        if c not in seen:
            seen.add(c)
            unique_clubs.append(c)
    
    return unique_clubs

def generate_sql_fix(clubs, league_id):
    print(f"-- Ditemukan {len(clubs)} klub (HARUS 20)")
    print()
    print("CREATE TEMP TABLE club_league_fix (")
    print("    club_name VARCHAR(100),")
    print("    correct_league_id INT")
    print(");")
    print()
    print("INSERT INTO club_league_fix (club_name, correct_league_id) VALUES")
    values = [f"    ('{c.replace(chr(39), chr(39)+chr(39))}', {league_id})" for c in clubs]
    print(",\n".join(values) + ";")
    print()
    print("UPDATE clubs c")
    print("SET league_id = f.correct_league_id")
    print("FROM club_league_fix f")
    print("WHERE c.name = f.club_name;")
    print()
    print("SELECT f.club_name FROM club_league_fix f")
    print("LEFT JOIN clubs c ON c.name = f.club_name")
    print("WHERE c.id IS NULL;")

if __name__ == "__main__":
    clubs = scrape_premier_league_clubs()
    print(f"# Klub ditemukan: {len(clubs)}")
    for c in clubs:
        print(f"#   - {c}")
    print()
    generate_sql_fix(clubs, league_id=5)