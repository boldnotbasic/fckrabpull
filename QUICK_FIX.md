# 🔧 QUICK FIX - Storage Buckets & Schema Errors

## Probleem
- ❌ "Bucket not found" bij trofee uploaden
- ❌ "Could not find opponent_team_id column" bij match toevoegen

## Oplossing (5 minuten)

### Stap 1: Open Supabase Dashboard
1. Ga naar [supabase.com](https://supabase.com)
2. Open je project
3. Klik op **SQL Editor** in het linkermenu

### Stap 2: Voer Setup Script Uit
1. Open het bestand `SETUP_DATABASE.sql` in deze folder
2. **Kopieer de VOLLEDIGE inhoud** (Cmd+A, Cmd+C)
3. **Plak** in de SQL Editor (Cmd+V)
4. Klik op **RUN** (of druk F5)
5. Wacht tot je ziet: "Success. No rows returned"

### Stap 3: Verifieer Storage Buckets
1. Klik op **Storage** in het linkermenu
2. Je zou nu 3 buckets moeten zien:
   - ✅ `players`
   - ✅ `teams`
   - ✅ `trophies`

### Stap 4: Test de App
1. Herlaad je app (Cmd+R)
2. Test:
   - ✅ Trofee toevoegen met afbeelding
   - ✅ Match toevoegen met tegenstander
   - ✅ Team toevoegen met logo

## Wat doet het script?

Het script maakt aan:
- **3 Storage buckets** (players, teams, trophies)
- **Storage policies** (public read, authenticated write)
- **Teams tabel** (voor tegenstanders)
- **Trophies tabel** (voor trofeënkast)
- **Match_attendance tabel** (voor aanwezigheden)
- **opponent_team_id kolom** in matches tabel
- **Functies** voor statistieken

## Nog steeds errors?

### Error: "relation already exists"
Dit is OK! Het betekent dat de tabel al bestaat. Het script slaat deze over.

### Error: "policy already exists"
Ook OK! Het script verwijdert eerst oude policies en maakt nieuwe aan.

### Buckets niet zichtbaar in Storage?
1. Refresh de pagina (Cmd+R)
2. Klik op Storage → Refresh
3. Als nog steeds niet zichtbaar: voer script opnieuw uit

### Match toevoegen werkt nog niet?
1. Voeg eerst een **team** toe via `/admin/teams`
2. Dan kun je een match plannen met dat team als tegenstander

## Klaar! 🎉

Je app zou nu volledig moeten werken:
- ✅ Trofeeën uploaden
- ✅ Teams toevoegen
- ✅ Matchen plannen
- ✅ Goals/assists/aanwezigheden registreren
