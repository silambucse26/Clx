import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { formatDateShort } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import JoinTeamForm from '@/components/home/JoinTeamForm'
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Dna,
  Bug,
  Microscope,
  FlaskConical,
  Activity,
  Shield,
  Search,
  BookOpen,
  FileText,
} from 'lucide-react'
import NewToCelxLibrary from '@/components/home/NewToCelxLibrary'
import FeaturedAuthorsSection from '@/components/home/FeaturedAuthorsSection'
import HeroSection from '@/components/home/HeroSection'

export const dynamic = 'force-dynamic'

async function getHomeData() {
  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  const publishedArticles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { publishedDate: 'desc' },
    take: 4,
    include: {
      authors: true,
      journal: { select: { title: true, abbreviation: true } },
      manuscript: { select: { manuscriptId: true } },
    },
  })

  return { announcements, publishedArticles }
}


const subjects = [
  { label: 'Medical & Clinical Microbiology', icon: Bug, color: 'text-red-500 bg-red-50 border-red-100', desc: 'Pathogenic agents, diagnostics & host-microbe interactions.' },
  { label: 'Environmental & Agricultural', icon: Microscope, color: 'text-emerald-500 bg-emerald-50 border-emerald-100', desc: 'Soil microflora, biogeochemical cycles & plant pathogens.' },
  { label: 'Industrial & Food Microbiology', icon: FlaskConical, color: 'text-amber-600 bg-amber-50 border-amber-100', desc: 'Fermentation, bioprocess engineering & food safety.' },
  { label: 'Microbial Genetics & Genomics', icon: Dna, color: 'text-purple-500 bg-purple-50 border-purple-100', desc: 'Metagenomic sequencing, plasmids & resistance mapping.' },
  { label: 'Virology & Parasitology', icon: Activity, color: 'text-blue-500 bg-blue-50 border-blue-100', desc: 'Viral replication, host defense evasion & parasitic agents.' },
  { label: 'Immunology & Pathogenesis', icon: Shield, color: 'text-teal-500 bg-teal-50 border-teal-100', desc: 'Host immune responses, vaccine vectors & mechanisms.' },
  { label: 'Applied & Systems Microbiology', icon: Microscope, color: 'text-indigo-500 bg-indigo-50 border-indigo-100', desc: 'Metabolic networks, biotechnology & synthetic biology.' },
  { label: 'Public Health Microbiology', icon: Bug, color: 'text-pink-500 bg-pink-50 border-pink-100', desc: 'Epidemiological studies, outbreaks & sanitation control.' },
]

const visualCards = [
  {
    title: 'Latest Research',
    desc: 'Explore new discoveries in microbiology',
    image: '/card-latest-research.png',
    href: '/articles',
  },
  {
    title: 'Trending Articles',
    desc: 'Top read and cited articles',
    image: '/card-trending-articles.png',
    href: '/articles',
  },
  {
    title: 'Special Collections',
    desc: 'Curated topics by expert editors',
    image: '/card-special-collections.png',
    href: '/journals',
  },
  {
    title: 'Submit Your Research',
    desc: 'Share your work with global audience',
    image: '/card-submit-research.png',
    href: '/dashboard/author/submit',
  },
  {
    title: 'Global Impact',
    desc: 'Research that makes a difference',
    image: '/card-global-impact.png',
    href: '/about',
  },
]

export default async function HomePage() {
  const session = await auth()
  const { announcements, publishedArticles } = await getHomeData()


  // Fallback news data aligned with the mockup - Rebranded to CELX
  const newsList = [
    {
      title: 'CELX Microbiology Awards 2025 – Call for Nominations',
      date: 'May 12, 2025',
      category: 'Announcement',
      image: '/card-latest-research.png',
    },
    {
      title: 'New Special Issue: Antimicrobial Resistance',
      date: 'May 06, 2025',
      category: 'News',
      image: '/card-trending-articles.png',
    },
    {
      title: 'Webinar: Advances in Microbial Genomics',
      date: 'May 01, 2025',
      category: 'Event',
      image: '/card-special-collections.png',
    },
  ]

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans">
      
      {/* ==================== HERO SECTION (CLIENT RENDERED FOR INTERACTION) ==================== */}
      <HeroSection />

      {/* ==================== DISCIPLINE CARDS GRID (UPSCALED TEXTS) ==================== */}
      <section className="bg-white py-12 border-b border-slate-200 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {subjects.map(subject => {
              const Icon = subject.icon
              return (
                <Link
                  key={subject.label}
                  href={`/search?q=${encodeURIComponent(subject.label)}`}
                  className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-150 hover:border-teal-300 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 bg-white group cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 border shrink-0 ${subject.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs md:text-sm font-extrabold text-slate-800 group-hover:text-teal-650 leading-snug">
                    {subject.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ==================== VISUAL ACTION CARDS (5 COLUMNS - ANIMATED HOVER & TEXT) ==================== */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {visualCards.map(card => (
            <Link
              key={card.title}
              href={card.href}
              className="relative h-64 md:h-72 rounded-2xl overflow-hidden shadow-lg group border border-slate-850 hover:border-teal-400 hover:shadow-[0_20px_50px_rgba(20,_184,_166,_0.35)] hover:-translate-y-2.5 transition-all duration-500 cursor-pointer block"
            >
              {/* Background Image */}
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover group-hover:scale-112 transition-transform duration-700 ease-out"
              />
              
              {/* Hover Glowing Border Highlight */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-teal-400/40 rounded-2xl transition-colors duration-500 pointer-events-none z-10" />

              {/* Dark Overlay (Cyan/Green tint on hover) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent group-hover:from-black/95 group-hover:via-teal-950/40 group-hover:to-teal-900/10 flex flex-col justify-end p-5 text-white transition-all duration-500">
                <h3 className="text-base font-black tracking-tight mb-1 group-hover:text-teal-350 transition-colors">
                  {card.title}
                </h3>
                <p className="text-[11px] md:text-xs text-slate-300 group-hover:text-slate-100 leading-relaxed line-clamp-3 transition-colors duration-300">
                  {card.desc}
                </p>
                {/* Circled Arrow Icon with Spin/Slide Animation */}
                <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center mt-4 group-hover:bg-teal-500 group-hover:border-teal-500 group-hover:text-[#050c18] group-hover:rotate-45 transition-all duration-500 shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== OPEN ACCESS KEY WORKS (RECENT ARTICLES) ==================== */}
      <section className="py-16 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-teal-650 bg-teal-50 border border-teal-150 px-2.5 py-1 rounded uppercase tracking-wider">Open Access</span>
              <h2 className="text-2xl md:text-3xl font-black text-navy-950 uppercase tracking-widest mt-2">Key Works & Research</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Recently published open access research articles on CelX</p>
            </div>
            <Link href="/articles">
              <Button className="bg-[#050c18] hover:bg-[#0b1626] text-white text-xs font-bold h-9 px-4 rounded cursor-pointer shrink-0">
                Browse All Articles →
              </Button>
            </Link>
          </div>

          {publishedArticles.length === 0 ? (
            <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center text-slate-400 text-xs">
              No published articles available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publishedArticles.map((article) => (
                <div key={article.id} className="bg-white border border-slate-150 rounded-2xl p-6 hover:shadow-xl hover:border-teal-250 transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded border border-slate-150">
                        {article.journal.abbreviation} · {article.articleType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-450 font-mono">
                        {article.manuscript?.manuscriptId || `ART-${article.id.slice(-6).toUpperCase()}`}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-snug font-serif group-hover:text-teal-650 transition-colors">
                      <Link href={`/articles/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-500 font-medium">
                      By {article.authors.map(a => a.name).join(', ')}
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {article.abstract}
                    </p>

                    {article.keywords && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {article.keywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 4).map(kw => (
                          <span key={kw} className="text-[9px] bg-teal-50/50 text-teal-800 border border-teal-100/50 px-2 py-0.5 rounded-full font-semibold">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-450">
                      Published {article.publishedDate ? new Date(article.publishedDate).toLocaleDateString() : new Date(article.createdAt).toLocaleDateString()}
                    </span>
                    <a
                      href={`/api/articles/${article.slug}/pdf`}
                      download
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-650 hover:text-teal-700 hover:underline cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== BOTTOM COLUMNS (AUTHORS, METRICS, NEWS - LARGE PRESENTATION FORMAT) ==================== */}

      <section className="py-16 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-slate-200/80">
        
        {/* Featured Authors (7 Columns - CLIENT INTERACTION EMBEDDED) */}
        <div className="lg:col-span-7">
          <FeaturedAuthorsSection />
        </div>

        {/* Platform Metrics & News (5 Columns) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-8">
          
          {/* Platform Metrics Card (UPSCALED TEXTS) */}
          <div className="bg-[#050c18] border border-slate-900 text-white rounded-2xl p-8 grid grid-cols-2 gap-6 shadow-lg">
            {[
              { value: '2,458+', label: 'Published Articles' },
              { value: '18,732+', label: 'Authors' },
              { value: '96', label: 'Countries' },
              { value: '27', label: 'Journals' },
            ].map(metric => (
              <div key={metric.label} className="border-r border-slate-800/60 last:border-0 odd:border-r even:border-0 pl-3">
                <div className="text-2xl md:text-3xl font-black tracking-tight text-white">{metric.value}</div>
                <div className="text-xs text-slate-400 font-bold tracking-wider uppercase mt-1">{metric.label}</div>
              </div>
            ))}
          </div>

          {/* News & Announcements */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-black text-navy-950 uppercase tracking-widest">News & Announcements</h2>
              <span className="text-xs md:text-sm font-extrabold text-teal-650 cursor-pointer uppercase tracking-wider">View all →</span>
            </div>

            <div className="space-y-4">
              {newsList.map((news, idx) => (
                <div key={idx} className="flex gap-4 bg-white rounded-xl border border-slate-150 p-4 hover:shadow-lg hover:border-teal-250 transition-all duration-300 group">
                  <div className="relative w-28 h-20 rounded overflow-hidden shrink-0 border border-slate-100">
                    <Image
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-150 px-2.5 py-0.5 rounded uppercase">
                      {news.category}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug mt-2 hover:text-teal-600 cursor-pointer transition-colors font-serif">
                      {news.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium block mt-1">{news.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>



      {/* New to CLEX Library section */}
      <NewToCelxLibrary />
      
      {!session?.user && <JoinTeamForm />}
    </div>
  )
}
