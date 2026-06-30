import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/index'
import { Globe, Eye, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminArticlesPage() {
  const session = await auth()
  if (!session?.user || !['SUPER_ADMIN', 'JOURNAL_ADMIN'].includes(session.user.role)) {
    redirect('/login')
  }

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      journal: { select: { abbreviation: true } }
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Articles</h1>
        <p className="text-slate-500 text-sm">Monitor published papers and viewing statistics</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Published Articles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {articles.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Globe className="w-10 h-10 text-slate-355 stroke-[1.5]" />
              <span className="text-sm font-medium">No published articles found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-3.5 px-6">Title</th>
                    <th className="py-3.5 px-6">Journal</th>
                    <th className="py-3.5 px-6">DOI</th>
                    <th className="py-3.5 px-6">Views / Downloads</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Published Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900 max-w-sm truncate">{art.title}</td>
                      <td className="py-4 px-6 font-semibold text-slate-500">{art.journal.abbreviation}</td>
                      <td className="py-4 px-6 text-slate-450 font-mono text-xs">{art.doi || '—'}</td>
                      <td className="py-4 px-6 text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-slate-400" /> {art.viewCount}</span>
                          <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5 text-slate-400" /> {art.downloadCount}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {art.isPublished ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="default">Draft</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {art.publishedDate ? new Date(art.publishedDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
