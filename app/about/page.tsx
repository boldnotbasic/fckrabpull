import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Share2, Palette, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AboutPage() {
  const supabase = await createClient()
  
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .in('key', ['instagram_url', 'canva_url'])

  const instagramUrl = settings?.find(s => s.key === 'instagram_url')?.value || 'https://instagram.com/fckrabpull'
  const canvaUrl = settings?.find(s => s.key === 'canva_url')?.value || 'https://canva.com/design/your-design-id'

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Terug naar Home
            </Button>
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 gradient-text"><Info className="h-10 w-10" /> Over FC Krabpull</h1>
          <p className="text-sm" style={{ color: 'oklch(0.65 0.05 280)' }}>
            Ons zaalvoetbalteam en social media
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-xl transition-all backdrop-blur-xl bg-white/10 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Instagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4" style={{ color: 'oklch(0.65 0.05 280)' }}>
                Volg ons op Instagram voor de laatste updates, foto's en video's van onze matchen.
              </p>
              <a 
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full">
                  Bezoek Instagram
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all backdrop-blur-xl bg-white/10 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Social Media Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4" style={{ color: 'oklch(0.65 0.05 280)' }}>
                Bekijk onze Canva designs voor social media posts, posters en meer.
              </p>
              <a 
                href={canvaUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full">
                  Bekijk Designs
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 backdrop-blur-xl bg-white/10 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Over deze app</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'oklch(0.65 0.05 280)' }}>
              Deze app helpt FC Krabpull om spelers, matchen, statistieken en stemmen voor man van de match te beheren. 
              Gebouwd met Next.js en Supabase voor een moderne en snelle ervaring.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
