import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate, getArticleTypeLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { SubmittedFilesCard } from '@/components/manuscripts/SubmittedFilesCard'
import { TechnicalCheckForm } from '@/components/editorial/TechnicalCheckForm'
import { ArrowLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function TechnicalCheckPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['EDITORIAL_OFFICE', 'SUPER_ADMIN'].includes(session.user.role)) redirect('/dashboard')

  const manuscript = await prisma.manuscript.findUnique({
    where: { id },
    include: {
      journal: { select: { title: true, abbreviation: true } },
      submitter: { select: { name: true, email: true, affiliation: true } },
      authors: true,
      files: true,
    },
  })

  if (!manuscript) notFound()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/office">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Technical Check</h1>
          <p className="text-xs text-slate-500 font-mono">{manuscript.manuscriptId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader><CardTitle>Manuscript Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs font-medium text-slate-500">Title</div>
                <div className="text-sm font-medium text-slate-900">{manuscript.title}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Journal</div>
                <div className="text-sm text-slate-900">{manuscript.journal?.title}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Article Type</div>
                <div className="text-sm text-slate-900">{getArticleTypeLabel(manuscript.articleType)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Submitted by</div>
                <div className="text-sm text-slate-900">{manuscript.submitter.name}</div>
                <div className="text-xs text-slate-500">{manuscript.submitter.email}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Abstract</div>
                <div className="text-sm text-slate-700 line-clamp-4">{manuscript.abstract}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Keywords</div>
                <div className="flex flex-wrap gap-1.5">
                  {manuscript.keywords && manuscript.keywords.trim().length > 0 ? (
                    manuscript.keywords.split(',').map(k => k.trim()).filter(Boolean).map(kw => (
                      <span key={kw} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{kw}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Declarations</div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div>COI: {manuscript.conflictOfInterest ? '✓' : '✗'}</div>
                  <div>Funding: {manuscript.fundingStatement ? '✓' : '✗'}</div>
                  <div>Ethics: {manuscript.ethicsStatement ? '✓' : '✗'}</div>
                  <div>Data: {manuscript.dataAvailability ? '✓' : '✗'}</div>
                  <div>Cover letter: {manuscript.coverLetter ? '✓' : '✗'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-5">
            <SubmittedFilesCard files={manuscript.files} />
          </div>

        </div>

        <div>
          <TechnicalCheckForm manuscriptId={id} />
        </div>
      </div>
    </div>
  )
}
