import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { SubmittedFilesCard } from '@/components/manuscripts/SubmittedFilesCard'
import { InviteReviewerForm, EditorialDecisionForm } from '@/components/editorial/EditorForms'
import { ArrowLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function EditorManuscriptPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['EDITOR_IN_CHIEF', 'ASSOCIATE_EDITOR', 'SUPER_ADMIN'].includes(session.user.role)) redirect('/dashboard')

  const [manuscript, reviewers] = await Promise.all([
    prisma.manuscript.findUnique({
      where: { id },
      include: {
        journal: { select: { title: true, abbreviation: true } },
        submitter: { select: { name: true, email: true } },
        files: true,
        reviewerInvitations: {
          include: { reviewer: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: { reviewer: { select: { name: true } } },
          orderBy: { submittedAt: 'desc' },
        },
        editorialDecisions: {
          include: { editor: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'REVIEWER', isActive: true },
      select: { id: true, name: true, email: true, affiliation: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!manuscript) notFound()

  const canMakeDecision = ['REVIEWS_COMPLETED', 'UNDER_EDITORIAL_SCREENING', 'DECISION_PENDING'].includes(manuscript.status)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/editor">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{manuscript.title}</h1>
          <p className="text-xs text-slate-500 font-mono">{manuscript.manuscriptId}</p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(manuscript.status)}`}>
          {getStatusLabel(manuscript.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Manuscript info */}
          <Card>
            <CardHeader><CardTitle>Manuscript Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs font-medium text-slate-500">Abstract</div>
                <div className="text-sm text-slate-700 leading-relaxed">{manuscript.abstract}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-500">Submitted by</div>
                  <div className="text-sm">{manuscript.submitter.name}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Journal</div>
                  <div className="text-sm">{manuscript.journal?.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submitted Files */}
          <SubmittedFilesCard files={manuscript.files} />


          {/* Reviews */}
          {manuscript.reviews.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Reviews ({manuscript.reviews.length})</CardTitle></CardHeader>
              <CardContent>
                {manuscript.reviews.map((review, idx) => (
                  <div key={review.id} className="border border-slate-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Reviewer {idx + 1}: {review.isSubmitted ? review.reviewer.name : 'Anonymous'}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          review.recommendation === 'ACCEPT' ? 'bg-green-100 text-green-800' :
                          review.recommendation === 'REJECT' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {review.recommendation?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    {review.isSubmitted && (
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { label: 'Originality', score: review.originalityScore },
                          { label: 'Methodology', score: review.methodologyScore },
                          { label: 'Data Quality', score: review.dataQualityScore },
                          { label: 'Clarity', score: review.clarityScore },
                        ].map(s => (
                          <div key={s.label} className="text-center bg-slate-50 rounded p-2">
                            <div className="text-lg font-bold text-navy-700">{s.score}/5</div>
                            <div className="text-xs text-slate-500">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {review.commentsToAuthor && (
                      <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{review.commentsToAuthor}</div>
                    )}
                    {review.confidentialComments && (
                      <div className="mt-2 text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <span className="font-medium text-amber-700">Confidential: </span>{review.confidentialComments}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Previous decisions */}
          {manuscript.editorialDecisions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Previous Decisions</CardTitle></CardHeader>
              <CardContent>
                {manuscript.editorialDecisions.map(d => (
                  <div key={d.id} className="border border-slate-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.decisionType === 'ACCEPT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{d.decisionType}</span>
                      <span className="text-xs text-slate-400">by {d.editor.name} · {formatDate(d.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar actions */}
        <div className="space-y-5">
          {/* Invite reviewer */}
          <InviteReviewerForm manuscriptId={id} reviewers={reviewers} />

          {/* Reviewer invitations status */}
          {manuscript.reviewerInvitations.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Reviewers</CardTitle></CardHeader>
              <CardContent>
                {manuscript.reviewerInvitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{inv.reviewer.name}</div>
                      <div className="text-xs text-slate-500">{inv.reviewer.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      inv.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                      inv.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{inv.status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Editorial decision */}
          {canMakeDecision && <EditorialDecisionForm manuscriptId={id} />}
        </div>
      </div>
    </div>
  )
}
