import csv

input_file = 'dataset.csv'       # Nama file CSV asli dari Kaggle
output_file = 'elite_database.csv' # Nama file CSV baru yang udah bersih

# BUKU PINTAR: Asal ada "kata kunci" ini di CSV, langsung diubah ke Nama Standar
# BUKU PINTAR V2 (Sudah ditambal Real Sociedad & Fix Aksen Perancis)
CLUB_MAP = {
    # INGGRIS
    'arsenal': ['Arsenal', 'Premier League'], 'aston villa': ['Aston Villa', 'Premier League'],
    'bournemouth': ['AFC Bournemouth', 'Premier League'], 'brentford': ['Brentford', 'Premier League'],
    'brighton': ['Brighton', 'Premier League'], 'chelsea': ['Chelsea', 'Premier League'],
    'crystal palace': ['Crystal Palace', 'Premier League'], 'everton': ['Everton', 'Premier League'],
    'fulham': ['Fulham', 'Premier League'], 'liverpool': ['Liverpool', 'Premier League'],
    'manchester city': ['Manchester City', 'Premier League'], 'manchester utd': ['Manchester United', 'Premier League'],
    'manchester united': ['Manchester United', 'Premier League'], 'newcastle': ['Newcastle United', 'Premier League'],
    'nottingham': ['Nottingham Forest', 'Premier League'], 'tottenham': ['Tottenham Hotspur', 'Premier League'],
    'spurs': ['Tottenham Hotspur', 'Premier League'], 'west ham': ['West Ham United', 'Premier League'],
    'wolverhampton': ['Wolverhampton', 'Premier League'], 'leicester': ['Leicester City', 'Premier League'],
    'southampton': ['Southampton', 'Premier League'], 'ipswich': ['Ipswich Town', 'Premier League'],

    # SPANYOL
    'real madrid': ['Real Madrid', 'La Liga'], 'barcelona': ['Barcelona', 'La Liga'],
    'atlético': ['Atletico Madrid', 'La Liga'], 'atletico': ['Atletico Madrid', 'La Liga'],
    'athletic club': ['Athletic Bilbao', 'La Liga'], 'bilbao': ['Athletic Bilbao', 'La Liga'],
    'sociedad': ['Real Sociedad', 'La Liga'], # <-- INI DIA YANG KETINGGALAN KEMARIN!
    'betis': ['Real Betis', 'La Liga'], 'villarreal': ['Villarreal', 'La Liga'],
    'valencia': ['Valencia', 'La Liga'], 'sevilla': ['Sevilla', 'La Liga'],
    'osasuna': ['Osasuna', 'La Liga'], 'celta': ['Celta Vigo', 'La Liga'],
    'rayo': ['Rayo Vallecano', 'La Liga'], 'getafe': ['Getafe', 'La Liga'],
    'mallorca': ['Mallorca', 'La Liga'], 'las palmas': ['Las Palmas', 'La Liga'],
    'alavés': ['Alaves', 'La Liga'], 'alaves': ['Alaves', 'La Liga'],
    'girona': ['Girona', 'La Liga'], 'leganés': ['Leganes', 'La Liga'], 
    'leganes': ['Leganes', 'La Liga'], 'valladolid': ['Valladolid', 'La Liga'],
    'espanyol': ['Espanyol', 'La Liga'],

    # ITALIA
    'juventus': ['Juventus', 'Serie A'], 'inter': ['Inter Milan', 'Serie A'],
    'milan': ['AC Milan', 'Serie A'], 'napoli': ['Napoli', 'Serie A'],
    'roma': ['AS Roma', 'Serie A'], 'lazio': ['Lazio', 'Serie A'],
    'atalanta': ['Atalanta', 'Serie A'], 'fiorentina': ['Fiorentina', 'Serie A'],
    'bologna': ['Bologna', 'Serie A'], 'torino': ['Torino', 'Serie A'],
    'udinese': ['Udinese', 'Serie A'], 'empoli': ['Empoli', 'Serie A'],
    'lecce': ['Lecce', 'Serie A'], 'monza': ['Monza', 'Serie A'],
    'verona': ['Verona', 'Serie A'], 'genoa': ['Genoa', 'Serie A'],
    'cagliari': ['Cagliari', 'Serie A'], 'parma': ['Parma', 'Serie A'],
    'como': ['Como', 'Serie A'], 'venezia': ['Venezia', 'Serie A'],

    # JERMAN
    'bayern': ['Bayern Munich', 'Bundesliga'], 'dortmund': ['Borussia Dortmund', 'Bundesliga'],
    'leipzig': ['RB Leipzig', 'Bundesliga'], 'leverkusen': ['Bayer Leverkusen', 'Bundesliga'],
    'frankfurt': ['Eintracht Frankfurt', 'Bundesliga'], 'wolfsburg': ['VfL Wolfsburg', 'Bundesliga'],
    'mönchengladbach': ['Borussia Monchengladbach', 'Bundesliga'], 'monchengladbach': ['Borussia Monchengladbach', 'Bundesliga'],
    'freiburg': ['SC Freiburg', 'Bundesliga'], 'union berlin': ['Union Berlin', 'Bundesliga'],
    'werder': ['Werder Bremen', 'Bundesliga'], 'mainz': ['Mainz 05', 'Bundesliga'],
    'augsburg': ['FC Augsburg', 'Bundesliga'], 'stuttgart': ['VfB Stuttgart', 'Bundesliga'],
    'hoffenheim': ['TSG Hoffenheim', 'Bundesliga'], 'bochum': ['VfL Bochum', 'Bundesliga'],
    'heidenheim': ['FC Heidenheim', 'Bundesliga'], 'st. pauli': ['FC St. Pauli', 'Bundesliga'], 
    'kiel': ['Holstein Kiel', 'Bundesliga'],

    # PRANCIS
'paris': ['Paris Saint-Germain', 'Ligue 1'], 'monaco': ['AS Monaco', 'Ligue 1'],
'marseille': ['Marseille', 'Ligue 1'], 'lille': ['Lille', 'Ligue 1'],
'lyon': ['Lyon', 'Ligue 1'], 'nice': ['Nice', 'Ligue 1'],
'lens': ['Lens', 'Ligue 1'], 'rennes': ['Rennes', 'Ligue 1'],
'reims': ['Reims', 'Ligue 1'], 'toulouse': ['Toulouse', 'Ligue 1'],
'strasbourg': ['Strasbourg', 'Ligue 1'], 'nantes': ['Nantes', 'Ligue 1'],
'montpellier': ['Montpellier', 'Ligue 1'], 'brest': ['Brest', 'Ligue 1'],
'havre': ['Le Havre', 'Ligue 1'], 'auxerre': ['Auxerre', 'Ligue 1'],
'angers': ['Angers', 'Ligue 1'],
'metz': ['Metz', 'Ligue 1'],
'étienne': ['Saint-Etienne', 'Ligue 1'], 'etienne': ['Saint-Etienne', 'Ligue 1']# <-- FIX EJAAN PERANCIS
}

print("⏳ Memulai proses pencucian data dengan Python...")

with open(input_file, mode='r', encoding='utf-8') as infile, \
     open(output_file, mode='w', encoding='utf-8', newline='') as outfile:
    
    reader = csv.DictReader(infile)
    
    # Header untuk CSV yang baru (bersih dan sesuai Node.js kita)
    fieldnames = ['name', 'nationality', 'club', 'league', 'position', 'overall', 'pace', 'shooting', 'passing', 'defending']
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()

    count = 0
    for row in reader:
        raw_club = row.get('club_name', '').strip().lower()
        if not raw_club:
            continue

        standard_club = None
        standard_league = None

        # Cek apakah ada kata kunci di dalam nama klub CSV
        for key, data in CLUB_MAP.items():
            if key in raw_club:
                standard_club = data[0]
                standard_league = data[1]
                break
        
        # Kalau klubnya ketemu (Lolos saringan Liga Elit)
        if standard_club:
            # Ambil Posisi Pertama
            pos_raw = row.get('player_positions', 'SUB')
            position = pos_raw.split(',')[0].strip() if pos_raw else 'SUB'
            
            writer.writerow({
                'name': row.get('short_name') or row.get('long_name') or 'Unknown',
                'nationality': row.get('nationality_name', 'Unknown'),
                'club': standard_club,
                'league': standard_league,
                'position': position,
                'overall': row.get('overall', '50'),
                'pace': row.get('pace', '50') if row.get('pace') else '50',
                'shooting': row.get('shooting', '50') if row.get('shooting') else '50',
                'passing': row.get('passing', '50') if row.get('passing') else '50',
                'defending': row.get('defending', '50') if row.get('defending') else '50'
            })
            count += 1

print(f"✅ CUCI DATA SELESAI! {count} Pemain Elit berhasil diselamatkan.")
print(f"📂 File Super Bersih tersimpan sebagai: {output_file}")