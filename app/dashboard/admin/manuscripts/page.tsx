import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/index'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminManuscriptsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      submitter: { select: { name: true } },
      journal: { select: { abbreviation: true } }
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Manuscripts</h1>
        <p className="text-slate-500 text-sm">Review submitted papers and track peer review status</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Submitted Manuscripts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {manuscripts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <FileText className="w-10 h-10 text-slate-355 stroke-[1.5]" />
              <span className="text-sm font-medium">No manuscripts found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Title</th>
                    <th className="py-3.5 px-6">Submitter</th>
                    <th className="py-3.5 px-6">Journal</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Submitted Date</th>
                    <th className="py-3.5 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {manuscripts.map((ms) => (
                    <tr key={ms.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-450">{ms.manuscriptId}</td>
                      <td className="py-4 px-6 font-medium text-slate-900 max-w-sm truncate">
                        <Link href={`/dashboard/admin/manuscripts/${ms.id}`} className="hover:text-navy-600 hover:underline">
                          {ms.title}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-slate-655">{ms.submitter.name}</td>
                      <td className="py-4 px-6 font-semibold text-slate-500">{ms.journal.abbreviation}</td>
                      <td className="py-4 px-6">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(ms.status)}`}>
                          {getStatusLabel(ms.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {ms.submittedAt ? new Date(ms.submittedAt).toLocaleDateString() : new Date(ms.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <Link href={`/dashboard/admin/manuscripts/${ms.id}`} className="text-navy-600 font-bold hover:underline text-xs">
                          View Details
                        </Link>
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

