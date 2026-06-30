import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/index'
import { BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminJournalsPage() {
  const session = await auth()
  if (!session?.user || !['SUPER_ADMIN', 'JOURNAL_ADMIN'].includes(session.user.role)) {
    redirect('/login')
  }

  const journals = await prisma.journal.findMany({
    orderBy: { title: 'asc' }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Journals</h1>
        <p className="text-slate-500 text-sm">Overview of academic journals registered in the system</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Journal Catalogue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {journals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <BookOpen className="w-10 h-10 text-slate-355 stroke-[1.5]" />
              <span className="text-sm font-medium">No journals found in the database.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-3.5 px-6">Journal Title</th>
                    <th className="py-3.5 px-6">Slug</th>
                    <th className="py-3.5 px-6">ISSN / EISSN</th>
                    <th className="py-3.5 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {journals.map((journal) => (
                    <tr key={journal.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {journal.title} {journal.abbreviation && `(${journal.abbreviation})`}
                      </td>
                      <td className="py-4 px-6 text-slate-600">{journal.slug}</td>
                      <td className="py-4 px-6 text-slate-500">{journal.issn || journal.eissn || '—'}</td>
                      <td className="py-4 px-6">
                        {journal.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
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
