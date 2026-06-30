import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate, getStatusColor, getStatusLabel, getArticleTypeLabel, getLicenseLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { SubmittedFilesCard } from '@/components/manuscripts/SubmittedFilesCard'
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react'

const statusFlow = [
  'SUBMITTED',
  'UNDER_TECHNICAL_CHECK',
  'UNDER_EDITORIAL_SCREENING',
  'REVIEWER_INVITED',
  'UNDER_REVIEW',
  'REVIEWS_COMPLETED',
  'DECISION_PENDING',
  'REVISION_REQUESTED',
  'REVISED_MANUSCRIPT_SUBMITTED',
  'ACCEPTED',
  'IN_PRODUCTION',
  'PUBLISHED',
]

interface Props {
  params: Promise<{ id: string }>
}

export default async function ManuscriptDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const manuscript = await prisma.manuscript.findFirst({
    where: { id, submitterId: session.user.id },
    include: {
      journal: { select: { title: true, abbreviation: true, slug: true } },
      authors: true,
      files: true,
      editorialDecisions: {
        include: { editor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      reviews: {
        where: { isSubmitted: true },
        select: {
          id: true,
          originalityScore: true,
          methodologyScore: true,
          recommendation: true,
          commentsToAuthor: true,
          submittedAt: true,
        },
      },
      revisions: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!manuscript) notFound()

  const currentStatusIdx = statusFlow.indexOf(manuscript.status)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/author/manuscripts">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 line-clamp-1">{manuscript.title}</h1>
          <p className="text-xs text-slate-500 font-mono">{manuscript.manuscriptId}</p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(manuscript.status)}`}>
          {getStatusLabel(manuscript.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Manuscript details */}
          <Card>
            <CardHeader><CardTitle>Manuscript Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Title</div>
                <div className="text-sm text-slate-900">{manuscript.title}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Abstract</div>
                <div className="text-sm text-slate-700 leading-relaxed">{manuscript.abstract || '—'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Journal</div>
                  <div className="text-sm text-slate-900">{manuscript.journal?.title}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Article Type</div>
                  <div className="text-sm text-slate-900">{getArticleTypeLabel(manuscript.articleType)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">License</div>
                  <div className="text-sm text-slate-900">{getLicenseLabel(manuscript.license)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Submitted</div>
                  <div className="text-sm text-slate-900">{manuscript.submittedAt ? formatDate(manuscript.submittedAt) : 'Not yet'}</div>
                </div>
              </div>
              {manuscript.keywords && manuscript.keywords.trim().length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    {manuscript.keywords.split(',').map(k => k.trim()).filter(Boolean).map(kw => (
                      <span key={kw} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submitted Files */}
          <SubmittedFilesCard files={manuscript.files} />


          {/* Editorial Decision */}
          {manuscript.editorialDecisions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Editorial Decision</CardTitle></CardHeader>
              <CardContent>
                {manuscript.editorialDecisions.map(decision => (
                  <div key={decision.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                        decision.decisionType === 'ACCEPT' ? 'bg-green-100 text-green-800' :
                        decision.decisionType === 'REJECT' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {decision.decisionType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400">by {decision.editor.name} · {formatDate(decision.createdAt)}</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-line">
                      {decision.decisionLetter}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reviewer Comments */}
          {manuscript.reviews.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Reviewer Comments ({manuscript.reviews.length})</CardTitle></CardHeader>
              <CardContent>
                {manuscript.reviews.map((review, idx) => (
                  <div key={review.id} className="border border-slate-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">Reviewer {idx + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        review.recommendation === 'ACCEPT' ? 'bg-green-100 text-green-800' :
                        review.recommendation === 'REJECT' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {review.recommendation?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {review.commentsToAuthor && (
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Comments to Author</div>
                        <div className="text-sm text-slate-700 leading-relaxed">{review.commentsToAuthor}</div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status tracker */}
          <Card>
            <CardHeader><CardTitle>Status Tracker</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusFlow.map((s, idx) => {
                  const isPast = idx < currentStatusIdx
                  const isCurrent = idx === currentStatusIdx
                  const isFuture = idx > currentStatusIdx
                  return (
                    <div key={s} className={`flex items-center gap-2 text-xs ${isFuture ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isPast ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" />
                      ) : isCurrent ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-navy-600 shrink-0 animate-pulse" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                      )}
                      <span className={isCurrent ? 'font-semibold text-navy-800' : ''}>
                        {s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {manuscript.status === 'REVISION_REQUESTED' && (
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-medium text-slate-900 mb-2">Revision Required</h3>
                <p className="text-xs text-slate-500 mb-3">Please address reviewer comments and resubmit.</p>
                <Button className="w-full" size="sm">
                  Submit Revision (Coming soon)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
