# FC Krabpull - Zaalvoetbal Team Management App

Een moderne web-app voor het beheren van spelers, matchen, statistieken en stemmen voor FC Krabpull.

## Features

- ⚽ **Spelersbeheer**: Overzicht van alle teamleden met foto's, rugnummers en posities
- 📅 **Matchkalender**: Wedstrijdschema met resultaten en locaties
- 🏆 **Leaderboard**: Topschutters en assist-koningen per seizoen
- 🌟 **Man van de Match**: Stem op de beste speler na elke wedstrijd
- 💰 **Scheidsrechter betalingen**: Bijhouden wie de scheidsrechter heeft betaald
- 🔗 **Social Media Links**: Directe links naar Instagram en Canva designs

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: Vercel
- **Icons**: Lucide React

## Setup Instructies

### 1. Supabase Project Aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een account
2. Klik op "New Project"
3. Vul de project details in:
   - **Project Name**: fc-krabpull
   - **Database Password**: Kies een sterk wachtwoord (bewaar dit!)
   - **Region**: Kies de dichtstbijzijnde regio (bv. Europe West)
4. Wacht tot het project klaar is (~2 minuten)

### 2. Database Migraties Uitvoeren

1. In je Supabase dashboard, ga naar **SQL Editor**
2. Klik op "New Query"
3. Kopieer de inhoud van `supabase/migrations/001_initial_schema.sql`
4. Plak in de SQL editor en klik "Run"
5. Herhaal voor `supabase/migrations/002_player_stats_function.sql`

### 3. Environment Variables Instellen

1. In je Supabase dashboard, ga naar **Settings** → **API**
2. Kopieer de volgende waarden:
   - **Project URL** (onder "Project URL")
   - **anon/public key** (onder "Project API keys")

3. Maak een bestand `.env.local` in de root van dit project:

```bash
NEXT_PUBLIC_SUPABASE_URL=jouw-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
```

### 4. Lokaal Draaien

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### 5. Eerste Admin User Aanmaken

1. Ga naar je Supabase dashboard → **Authentication** → **Users**
2. Klik "Add User" → "Create new user"
3. Vul email en wachtwoord in
4. Na aanmaken, ga naar **Table Editor** → **users** tabel
5. Zoek je user en wijzig de `role` kolom naar `admin`

### 6. Deploy naar Vercel

1. Push je code naar GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/jouw-username/fc-krabpull.git
git push -u origin main
```

2. Ga naar [vercel.com](https://vercel.com) en log in met GitHub
3. Klik "New Project" en selecteer je repository
4. Voeg Environment Variables toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Klik "Deploy"

### 7. Social Media Links Aanpassen

1. In Supabase, ga naar **Table Editor** → **settings**
2. Update de waarden:
   - `instagram_url`: Jouw Instagram pagina URL
   - `canva_url`: Jouw Canva design URL

## Database Schema

- **users**: Gebruikers met rollen (admin, manager, player, member)
- **players**: Spelers met naam, rugnummer, positie
- **seasons**: Seizoenen met start/einddatum
- **matches**: Wedstrijden met datum, tegenstander, score
- **match_events**: Goals en assists per wedstrijd
- **motm_votes**: Stemmen voor man van de match
- **referee_payments**: Betalingen aan scheidsrechter
- **settings**: App instellingen (social media links)

## Gebruikersrollen

- **Admin**: Volledige toegang, kan alles beheren
- **Manager**: Kan spelers, matchen en events beheren
- **Player**: Kan stemmen en eigen profiel bekijken
- **Member**: Kan stemmen en statistieken bekijken

## Development

```bash
npm run dev      # Start development server
npm run build    # Build voor productie
npm run start    # Start productie server
npm run lint     # Run ESLint
```

## Support

Voor vragen of problemen, contacteer de ontwikkelaar.
