# 🔧 Troubleshooting Guide

## Probleem: Goals/Assists/Aanwezigheden worden niet weergegeven

### Oorzaak
De statistieken worden alleen getoond als er **data** is. Je moet eerst:
1. ✅ Matchen toevoegen
2. ✅ Goals registreren (met doelpuntenmaker + optioneel assist)
3. ✅ Aanwezigheden markeren

### Oplossing: Test Flow

#### Stap 1: Voeg een team toe
1. Ga naar `/admin/teams`
2. Klik "Nieuw team"
3. Vul in:
   - Naam: "KV Mechelen"
   - Korte naam: "KVM"
   - Upload logo (optioneel)
4. Klik "Toevoegen"

#### Stap 2: Plan een match
1. Ga naar `/admin/matches`
2. Vul in:
   - Seizoen: laat leeg (optioneel)
   - Tegenstander: Kies "KV Mechelen"
   - Datum: kies een datum
   - Aftrap: 20:00
   - Locatie: "Sporthal De Kuip"
   - Thuis/Uit: Thuiswedstrijd
3. Klik "Match plannen"

#### Stap 3: Registreer goals
1. Klik op de match in de lijst
2. Scroll naar "Goal / assist toevoegen"
3. Vul in:
   - Doelpuntenmaker: Kies een speler
   - Assist: Kies een andere speler (optioneel)
   - Minuut: 25
4. Klik "Goal toevoegen"
5. Herhaal voor meerdere goals

#### Stap 4: Registreer aanwezigheden
1. Scroll naar "Aanwezigheden"
2. Klik op spelers om ze groen te maken (= aanwezig)
3. Klik nogmaals om ze grijs te maken (= afwezig)

#### Stap 5: Controleer statistieken
1. Ga naar homepage (`/`)
2. Scroll naar "Leaderboards"
3. Je zou nu moeten zien:
   - **Topschutter**: Speler met meeste goals
   - **Assist King**: Speler met meeste assists
   - **Meeste aanwezigheden**: Speler met hoogste aanwezigheidspercentage

4. Ga naar `/leaderboard`
5. Je ziet nu 3 kolommen:
   - Topschutters (gesorteerd op goals)
   - Assist-koningen (gesorteerd op assists)
   - Aanwezigheden (gesorteerd op aantal + percentage)

## Probleem: "Bucket not found"

### Oplossing
1. Ga naar Supabase Dashboard → Storage
2. Controleer of deze buckets bestaan:
   - `players` (PUBLIC)
   - `teams` (PUBLIC)
   - `trophies` (PUBLIC)
3. Als ze ontbreken, maak ze handmatig aan via "New bucket"

## Probleem: "Could not find opponent_team_id column"

### Oplossing
Voer dit uit in Supabase SQL Editor:
```sql
-- Controleer of kolom bestaat
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'matches';

-- Als opponent_team_id ontbreekt, voer uit:
ALTER TABLE public.matches ALTER COLUMN season_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'matches'
      AND column_name = 'opponent_team_id'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN opponent_team_id UUID REFERENCES public.teams(id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
```

Wacht 30 seconden en herlaad de app.

## Probleem: "season_id violates not-null constraint"

### Oplossing
```sql
ALTER TABLE public.matches ALTER COLUMN season_id DROP NOT NULL;
```

Nu kun je matchen toevoegen zonder seizoen.

## Probleem: Statistieken blijven leeg

### Checklist
- [ ] Heb je minstens 1 team toegevoegd?
- [ ] Heb je minstens 1 match gepland?
- [ ] Heb je minstens 1 goal geregistreerd?
- [ ] Heb je aanwezigheden gemarkeerd?
- [ ] Heb je de pagina herladen na het toevoegen van data?

### Debug SQL
Voer uit in Supabase SQL Editor:

```sql
-- Check goals
SELECT * FROM match_events;

-- Check attendance
SELECT * FROM match_attendance;

-- Check player stats
SELECT * FROM get_player_stats();

-- Check attendance stats
SELECT * FROM get_player_attendance_stats();
```

Als deze queries geen resultaten geven, moet je eerst data toevoegen via de admin pagina's.

## Veelvoorkomende Fouten

### "relation does not exist"
→ Tabel bestaat niet. Voer het complete setup script uit (zie SETUP_DATABASE.sql).

### "function does not exist"
→ Functie is niet aangemaakt. Voer het setup script uit.

### "permission denied"
→ Je bent niet ingelogd als admin. Ga naar `/login` en log in.

### Leaderboard toont "Nog geen statistieken"
→ Normaal! Voeg eerst matchen + goals toe via admin pagina's.

## Hulp nodig?

1. Check of alle migraties zijn uitgevoerd
2. Controleer of storage buckets bestaan
3. Verifieer dat je ingelogd bent als admin
4. Test de complete flow: team → match → goals → aanwezigheden
5. Herlaad de pagina na het toevoegen van data

Alles werkt als je deze flow volgt! 🎉
