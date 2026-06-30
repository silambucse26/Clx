import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getStatusColor, getStatusLabel, getArticleTypeLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { SubmittedFilesCard } from '@/components/manuscripts/SubmittedFilesCard'
import { PublishForm } from '@/components/production/PublishForm'
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function ProductionManuscriptPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['PRODUCTION_EDITOR', 'SUPER_ADMIN'].includes(session.user.role)) redirect('/dashboard')

  const [manuscript, volumes, issues] = await Promise.all([
    prisma.manuscript.findUnique({
      where: { id },
      include: {
        journal: { select: { title: true, abbreviation: true, id: true } },
        submitter: { select: { name: true, email: true } },
        authors: true,
        files: true,
      },
    }),
    prisma.volume.findMany({
      orderBy: { number: 'desc' },
    }),
    prisma.issue.findMany({
      orderBy: { number: 'desc' },
    }),
  ])

  if (!manuscript) notFound()

  // Filter volumes and issues for the manuscript's journal
  const journalVolumes = volumes.filter(v => v.journalId === manuscript.journalId)
  const journalIssues = issues.filter(i => journalVolumes.some(v => v.id === i.volumeId))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/production">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manuscript Production & Publishing</h1>
          <p className="text-xs text-slate-500 font-mono">{manuscript.manuscriptId}</p>
        </div>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(manuscript.status)}`}>
          {getStatusLabel(manuscript.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side: manuscript info */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Accepted Manuscript Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Title</div>
                <div className="text-sm font-semibold text-slate-900">{manuscript.title}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Abstract</div>
                <div className="text-slate-700 leading-relaxed max-h-48 overflow-y-auto border border-slate-100 rounded p-2 bg-slate-50">
                  {manuscript.abstract}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="text-xs font-medium text-slate-500">Journal</div>
                  <div>{manuscript.journal?.title} ({manuscript.journal?.abbreviation})</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Article Type</div>
                  <div>{getArticleTypeLabel(manuscript.articleType)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Corresponding Author</div>
                  <div>{manuscript.submitter.name}</div>
                  <div className="text-xs text-slate-400">{manuscript.submitter.email}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1.5">Authors List</div>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                  {manuscript.authors.map((author, idx) => (
                    <div key={author.id} className="text-xs flex items-center justify-between">
                      <span className="font-medium text-slate-800">{idx + 1}. {author.name} {author.isCorresponding && '(Corresponding)'}</span>
                      <span className="text-slate-500">{author.affiliation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <SubmittedFilesCard files={manuscript.files} />

        </div>

        {/* Right side: publish form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Publishing Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              {manuscript.status === 'PUBLISHED' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                  <h3 className="font-semibold text-green-900">Article is Live</h3>
                  <p className="text-xs text-green-700">This manuscript has been successfully published on the public articles section.</p>
                  <Link href={`/articles`}><Button variant="outline" size="sm">Go to Articles</Button></Link>
                </div>
              ) : (
                <PublishForm
                  manuscriptId={id}
                  volumes={journalVolumes}
                  issues={journalIssues}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
