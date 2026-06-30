import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/index'
import { SubmittedFilesCard } from '@/components/manuscripts/SubmittedFilesCard'
import { AssignManuscriptForm } from '@/components/admin/AssignManuscriptForm'
import { AdminManuscriptDecisionButtons } from '@/components/admin/AdminManuscriptDecisionButtons'
import { getStatusColor, getStatusLabel, getArticleTypeLabel, getLicenseLabel, formatDate } from '@/lib/utils'
import {
  ArrowLeft, BookOpen, FileText, Users, Globe, ShieldAlert,
  CheckCircle, FileCheck, CheckCircle2, Circle, AlertCircle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminManuscriptDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  // 1. Fetch manuscript with co-authors, files, reviewerInvitations log, and reviewers' details/submitted reviews
  const manuscript = await prisma.manuscript.findUnique({
    where: { id },
    include: {
      journal: true,
      submitter: true,
      authors: true,
      files: true,
      reviewerInvitations: {
        include: {
          reviewer: { select: { id: true, name: true, email: true, role: true } },
          review: true,
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!manuscript) {
    notFound()
  }

  // 2. Fetch all potential assignees (Reviewers and Editor-in-Chiefs)
  const assignees = await prisma.user.findMany({
    where: {
      role: { in: ['REVIEWER', 'EDITOR_IN_CHIEF'] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' }
  })

  // Format co-authors text if present
  const coAuthors = manuscript.authors.filter(a => a.email !== manuscript.submitter.email)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/manuscripts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 line-clamp-1">{manuscript.title}</h1>
          <p className="text-xs text-slate-500 font-mono">Submission Details · {manuscript.manuscriptId}</p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(manuscript.status)}`}>
          {getStatusLabel(manuscript.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step-by-Step submission details */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Wizard Step Data</h2>

          {/* Steps 1 & 2: Journal & Article Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 1: Target Journal</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-bold text-slate-900">{manuscript.journal?.title}</div>
                {manuscript.journal?.abbreviation && (
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">Abbreviation: {manuscript.journal.abbreviation}</div>
                )}
                {manuscript.journal?.subjectArea && (
                  <div className="text-xs text-slate-400 mt-1">Area: {manuscript.journal.subjectArea}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 2: Article Type</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-bold text-slate-900">{getArticleTypeLabel(manuscript.articleType)}</div>
                <div className="text-xs text-slate-455 mt-1">Classification for editorial screening</div>
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Title */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 3: Manuscript Title</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-900 font-medium leading-snug">
              {manuscript.title}
            </CardContent>
          </Card>

          {/* Step 4: Abstract */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 4: Abstract</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-100 whitespace-pre-wrap font-serif">
              {manuscript.abstract || <span className="text-slate-400 italic">No abstract provided.</span>}
            </CardContent>
          </Card>

          {/* Step 5: Keywords */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 5: Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              {manuscript.keywords && manuscript.keywords.trim().length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {manuscript.keywords.split(',').map(k => k.trim()).filter(Boolean).map(kw => (
                    <span key={kw} className="text-xs bg-navy-100 text-navy-800 px-3 py-1 rounded-full font-semibold">
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">No keywords specified.</span>
              )}
            </CardContent>
          </Card>

          {/* Step 6: Authors */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 6: Author Registry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary author */}
              <div className="border border-slate-150 rounded-lg p-3 bg-slate-50/50">
                <div className="text-[10px] uppercase font-bold text-teal-650 tracking-wide mb-1">Corresponding Submitter</div>
                <div className="font-semibold text-slate-900 text-sm">{manuscript.submitter.name}</div>
                <div className="text-xs text-slate-500">{manuscript.submitter.email}</div>
                {manuscript.submitter.affiliation && (
                  <div className="text-xs text-slate-400 mt-1">Affiliation: {manuscript.submitter.affiliation}</div>
                )}
              </div>

              {/* Co authors */}
              {coAuthors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-450 tracking-wide">Co-Authors</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {coAuthors.map((author) => (
                      <div key={author.id} className="border border-slate-150 rounded-lg p-3 bg-white text-xs">
                        <div className="font-semibold text-slate-900">{author.name}</div>
                        <div className="text-slate-500">{author.email}</div>
                        {author.affiliation && (
                          <div className="text-slate-400 mt-0.5">{author.affiliation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 7: Files */}
          <SubmittedFilesCard files={manuscript.files} />

          {/* Assignment & Activities Log */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-850 flex items-center gap-2">
                <Users className="w-4 h-4 text-navy-600" />
                Assignment & Activities Log ({manuscript.reviewerInvitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {manuscript.reviewerInvitations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No reviewers or editors assigned to this paper.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {manuscript.reviewerInvitations.map((inv) => (
                    <div key={inv.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{inv.reviewer.name}</span>
                          <span className="text-slate-400 ml-1">({inv.reviewer.email})</span>
                          <span className="ml-2 font-mono text-[9px] bg-slate-100 text-slate-650 px-1.5 py-0.5 rounded">
                            {inv.reviewer.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          inv.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                          inv.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-700' :
                          inv.status === 'DECLINED' ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {inv.status}
                        </span>
                      </div>

                      {/* Display reviewer activity / recommendations */}
                      {inv.review && inv.review.isSubmitted ? (
                        <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span className="font-bold text-slate-700">Review Recommendation:</span>
                            <span className="font-extrabold text-navy-800">{inv.review.recommendation}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-500 font-semibold">
                            <div>Originality: <span className="text-slate-900">{inv.review.originalityScore}/5</span></div>
                            <div>Methodology: <span className="text-slate-900">{inv.review.methodologyScore}/5</span></div>
                            <div>Clarity: <span className="text-slate-900">{inv.review.clarityScore}/5</span></div>
                            <div>Data Quality: <span className="text-slate-900">{inv.review.dataQualityScore}/5</span></div>
                          </div>
                          {inv.review.commentsToAuthor && (
                            <div className="pt-1.5 border-t border-slate-200">
                              <span className="block font-bold text-slate-600 mb-0.5">Comments to Author:</span>
                              <p className="text-slate-700 leading-relaxed italic">"{inv.review.commentsToAuthor}"</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-450 italic pl-1">
                          No evaluation details submitted yet.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 8: Cover Letter */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 8: Cover Letter</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-100 whitespace-pre-wrap font-sans">
              {manuscript.coverLetter || <span className="text-slate-400 italic">No cover letter submitted.</span>}
            </CardContent>
          </Card>

          {/* Step 9: Reviewers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-green-750 uppercase font-bold tracking-wider">Step 9: Suggested Reviewers</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {manuscript.suggestedReviewers || <span className="text-slate-400 italic">None suggested.</span>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-red-750 uppercase font-bold tracking-wider">Step 9: Opposed Reviewers</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {manuscript.opposedReviewers || <span className="text-slate-400 italic">None opposed.</span>}
              </CardContent>
            </Card>
          </div>

          {/* Step 10: Declarations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 10: Policy Declarations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed">
              <div>
                <strong className="block text-slate-550 mb-0.5">Conflict of Interest:</strong>
                <p className="text-slate-700">{manuscript.conflictOfInterest || 'None declared.'}</p>
              </div>
              <div>
                <strong className="block text-slate-550 mb-0.5">Funding Statement:</strong>
                <p className="text-slate-700">{manuscript.fundingStatement || 'None declared.'}</p>
              </div>
              <div>
                <strong className="block text-slate-550 mb-0.5">Ethics Approval Statement:</strong>
                <p className="text-slate-700">{manuscript.ethicsStatement || 'None declared.'}</p>
              </div>
              <div>
                <strong className="block text-slate-550 mb-0.5">Data Availability:</strong>
                <p className="text-slate-700">{manuscript.dataAvailability || 'None declared.'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Step 11: License & APC */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-450 uppercase font-bold tracking-wider">Step 11: License & APC Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="block text-slate-500 mb-0.5">Open Access License</strong>
                  <span className="font-semibold text-slate-900 text-sm">{getLicenseLabel(manuscript.license)}</span>
                </div>
                <div>
                  <strong className="block text-slate-500 mb-0.5">APC Commitment Status</strong>
                  <span className={`font-semibold ${manuscript.apcConfirmed ? 'text-green-600' : 'text-slate-450'}`}>
                    {manuscript.apcConfirmed ? '✓ Agreed to APC Policies' : '✗ Pending Confirmation'}
                  </span>
                </div>
              </div>

              {manuscript.waiverRequested && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <strong className="block text-amber-900 mb-1 font-semibold">APC Waiver Requested</strong>
                  <p className="text-amber-800 leading-relaxed">{manuscript.waiverReason || 'No waiver reason provided.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Metadata Summary</h2>

          {/* Super Admin Decision Overrides */}
          <AdminManuscriptDecisionButtons manuscriptId={manuscript.id} status={manuscript.status} />

          {/* Share / Assign Paper Form */}
          <Card className="border border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Assign Reviewer or Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <AssignManuscriptForm manuscriptId={manuscript.id} assignees={assignees} />
            </CardContent>
          </Card>

          {/* Status and Progress tracker */}
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Submission Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span>Current State:</span>
                <span className="font-semibold uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-750">
                  {manuscript.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Wizard Progress:</span>
                <span className="font-bold text-navy-850">
                  Step {manuscript.currentStep} of 12 completed
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created Date:</span>
                <span>{new Date(manuscript.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <span>{new Date(manuscript.updatedAt).toLocaleDateString()}</span>
              </div>

              {/* Warnings/Checks */}
              {manuscript.status === 'DRAFT' && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-150 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    This manuscript is currently saved as a **Draft**. The author has not completed the submission yet.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Access Shortcuts */}
          <Card>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Reviewer/Editorial Links</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-slate-500 text-[11px] leading-relaxed">
                As Super Admin, you have access to open the task details on other dashboards:
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Link href={`/dashboard/office/manuscripts/${manuscript.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold h-9">
                    Open Technical Check
                  </Button>
                </Link>
                <Link href={`/dashboard/editor/manuscripts/${manuscript.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold h-9">
                    Open Editor Review
                  </Button>
                </Link>
                <Link href={`/dashboard/production/manuscripts/${manuscript.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold h-9">
                    Open Production panel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
