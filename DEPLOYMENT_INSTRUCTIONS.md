# FC Krabpull App - Deployment Instructies

## Database Migraties Uitvoeren

Je hebt nieuwe features toegevoegd die database wijzigingen vereisen. Volg deze stappen:

### Optie 1: Via Supabase Dashboard (Aanbevolen voor productie)

1. Open je **Supabase Dashboard** → **SQL Editor**
2. Voer de volgende migraties uit in deze volgorde:

#### Migratie 1: Teams & Storage (003_teams_and_storage.sql)
```sql
-- Kopieer de volledige inhoud van:
-- supabase/migrations/003_teams_and_storage.sql
```

#### Migratie 2: Trofeeën & Aanwezigheden (004_trophies_and_attendance.sql)
```sql
-- Kopieer de volledige inhoud van:
-- supabase/migrations/004_trophies_and_attendance.sql
```

### Optie 2: Via Supabase CLI (Voor lokale ontwikkeling)

```bash
cd "/Users/gijsmeteor/Library/Mobile Documents/com~apple~CloudDocs/FC Krabpull app/fc-krabpull"

# Reset database (WAARSCHUWING: verwijdert alle data!)
supabase db reset

# Of voer alleen nieuwe migraties uit
supabase db push
```

## Nieuwe Features

### 1. ✅ Trofeënkast
- **Admin pagina**: `/admin/trophies`
- Voeg trofeeën toe met titel, beschrijving, seizoen, datum en afbeelding
- Trofeeën worden automatisch getoond op de homepage (max 4)

### 2. ✅ Teams Beheren
- **Admin pagina**: `/admin/teams`
- Voeg tegenstanders toe met naam, logo en korte naam
- Teams kunnen nu gekoppeld worden aan matchen

### 3. ✅ Matchen Toevoegen
- **Admin pagina**: `/admin/matches`
- Plan matchen met tegenstander, datum, tijd en locatie
- Kies tussen thuis/uit wedstrijden

### 4. ✅ Match Details & Tracking
- **Admin pagina**: `/admin/matches/[id]`
- **Uitslag invoeren**: Sla de eindstand op
- **Goals registreren**: Voeg doelpuntenmaker, assist en minuut toe
- **Aanwezigheden**: Klik op spelers om aan/afwezigheid te registreren

### 5. ✅ Homepage Widgets
- **Trofeënkast**: Toont laatste 4 trofeeën
- **Leaderboards**: Topschutter, Assist King, Meeste aanwezigheden
- Alle roze kleuren vervangen door goud (#d4a517)

### 6. ✅ Iconen bij Titels
- Alle pagina's hebben nu passende iconen bij de titel
- Spelersfoto's zijn 80% van tegel breedte (niet afgesneden)

## Troubleshooting

### Error: "Could not find the 'opponent_team_id' column"
Dit betekent dat migratie 003 nog niet is uitgevoerd. Voer het SQL script uit in Supabase Dashboard.

### Error: "relation 'trophies' does not exist"
Migratie 004 is nog niet uitgevoerd. Voer het SQL script uit.

### Textarea component niet gevonden
De `textarea.tsx` component is al aangemaakt in `components/ui/`. Herstart je dev server:
```bash
npm run dev
```

## Verificatie

Na het uitvoeren van de migraties, controleer of deze tabellen bestaan:
- `public.teams`
- `public.trophies`
- `public.match_attendance`

En deze storage buckets:
- `players`
- `teams`
- `trophies`

## Data Flow

### Goals & Assists
1. Admin voegt match toe via `/admin/matches`
2. Na de match: ga naar `/admin/matches/[id]`
3. Voer uitslag in
4. Voeg goals toe met doelpuntenmaker + assist
5. Stats worden automatisch bijgewerkt in `match_events` tabel
6. Leaderboards worden automatisch geüpdatet via `get_player_stats()` functie

### Aanwezigheden
1. Ga naar match detail pagina `/admin/matches/[id]`
2. Klik op spelers om aanwezigheid te togglen (groen = aanwezig)
3. Data wordt opgeslagen in `match_attendance` tabel
4. Gebruik `get_player_attendance_stats()` voor statistieken

## Volgende Stappen

1. ✅ Voer database migraties uit
2. ✅ Test teams toevoegen
3. ✅ Test matchen plannen
4. ✅ Test goal/assist/aanwezigheid registratie
5. ✅ Voeg trofeeën toe aan de trofeënkast
6. ✅ Controleer homepage widgets

Veel succes! 🏆⚽
