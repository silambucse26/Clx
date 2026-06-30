'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { generateManuscriptId } from '@/lib/utils'
import { ManuscriptStatus, ArticleType, OpenAccessLicense } from '@prisma/client'

export async function createDraftManuscript(data: {
  journalId: string
  title?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const journal = await prisma.journal.findUnique({ where: { id: data.journalId } })
  if (!journal) throw new Error('Journal not found')

  // Count existing manuscripts for this journal this year
  const year = new Date().getFullYear()
  const count = await prisma.manuscript.count({
    where: {
      journalId: data.journalId,
      createdAt: { gte: new Date(`${year}-01-01`) },
    },
  })

  const manuscriptId = generateManuscriptId(journal.slug, year, count + 1)

  const manuscript = await prisma.manuscript.create({
    data: {
      manuscriptId,
      journalId: data.journalId,
      submitterId: session.user.id,
      title: data.title || 'Untitled Manuscript',
      abstract: '',
      keywords: '',
      status: 'DRAFT',
      currentStep: 1,
    },
  })

  // Add submitter as first author
  await prisma.manuscriptAuthor.create({
    data: {
      manuscriptId: manuscript.id,
      userId: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
      isCorresponding: true,
      order: 0,
    },
  })

  return { success: true, manuscriptId: manuscript.id }
}

export async function updateManuscriptStep(manuscriptId: string, step: number, data: Record<string, unknown>) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const manuscript = await prisma.manuscript.findFirst({
    where: { id: manuscriptId, submitterId: session.user.id },
  })
  if (!manuscript) throw new Error('Manuscript not found')

  // Map step data to db fields
  const updateData: Record<string, unknown> = { currentStep: step }

  if (data.title) updateData.title = data.title
  if (data.abstract) updateData.abstract = data.abstract
  if (data.keywords) {
    updateData.keywords = Array.isArray(data.keywords)
      ? data.keywords.join(', ')
      : String(data.keywords)
  }
  if (data.articleType) updateData.articleType = data.articleType as ArticleType
  if (data.coverLetter !== undefined) updateData.coverLetter = data.coverLetter
  if (data.suggestedReviewers !== undefined) updateData.suggestedReviewers = data.suggestedReviewers
  if (data.opposedReviewers !== undefined) updateData.opposedReviewers = data.opposedReviewers
  if (data.conflictOfInterest !== undefined) updateData.conflictOfInterest = data.conflictOfInterest
  if (data.fundingStatement !== undefined) updateData.fundingStatement = data.fundingStatement
  if (data.ethicsStatement !== undefined) updateData.ethicsStatement = data.ethicsStatement
  if (data.dataAvailability !== undefined) updateData.dataAvailability = data.dataAvailability
  if (data.license) updateData.license = data.license as OpenAccessLicense
  if (data.apcConfirmed !== undefined) updateData.apcConfirmed = data.apcConfirmed
  if (data.waiverRequested !== undefined) updateData.waiverRequested = data.waiverRequested
  if (data.waiverReason !== undefined) updateData.waiverReason = data.waiverReason

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: updateData,
  })

  revalidatePath('/dashboard/author/submit')
  return { success: true }
}

export async function submitManuscript(manuscriptId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const manuscript = await prisma.manuscript.findFirst({
    where: { id: manuscriptId, submitterId: session.user.id },
  })
  if (!manuscript) throw new Error('Manuscript not found')

  if (!manuscript.title || !manuscript.abstract || !manuscript.keywords || !manuscript.keywords.trim()) {
    throw new Error('Please complete all required fields before submitting')
  }

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  })

  // Create notification for author
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: 'Manuscript Submitted',
      message: `Your manuscript "${manuscript.title}" (${manuscript.manuscriptId}) has been successfully submitted and is now under processing.`,
      category: 'SUBMISSION',
      link: `/dashboard/author/manuscripts/${manuscriptId}`,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'MANUSCRIPT_SUBMITTED',
      entity: 'Manuscript',
      entityId: manuscriptId,
      details: `Manuscript ${manuscript.manuscriptId} submitted`,
    },
  })

  revalidatePath('/dashboard/author/manuscripts')
  return { success: true, manuscriptId: manuscript.manuscriptId }
}

export async function getAuthorManuscripts() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  return prisma.manuscript.findMany({
    where: { submitterId: session.user.id },
    include: {
      journal: { select: { title: true, abbreviation: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getManuscriptDetail(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  return prisma.manuscript.findFirst({
    where: {
      id,
      OR: [
        { submitterId: session.user.id },
        // Allow editors, office, admin to view
      ],
    },
    include: {
      journal: { select: { title: true, abbreviation: true, slug: true } },
      authors: true,
      files: true,
      reviewerInvitations: {
        include: { reviewer: { select: { name: true, email: true } } },
      },
      reviews: {
        include: { reviewer: { select: { name: true } } },
      },
      editorialDecisions: {
        include: { editor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function addManuscriptFile(data: {
  manuscriptId: string
  fileName: string
  fileType: string
  fileSize: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const fileUrl = `/api/files/${data.manuscriptId}_${Date.now()}_${encodeURIComponent(data.fileName)}`

  const fileRecord = await prisma.manuscriptFile.create({
    data: {
      manuscriptId: data.manuscriptId,
      fileName: data.fileName,
      fileType: data.fileType,
      fileUrl,
      fileSize: data.fileSize,
    }
  })

  revalidatePath(`/dashboard/author/submit?continue=${data.manuscriptId}`)
  revalidatePath(`/dashboard/author/manuscripts/${data.manuscriptId}`)
  revalidatePath(`/dashboard/editor/manuscripts/${data.manuscriptId}`)
  revalidatePath(`/dashboard/office/manuscripts/${data.manuscriptId}`)
  revalidatePath(`/dashboard/production/manuscripts/${data.manuscriptId}`)

  return { success: true, file: fileRecord }
}

export async function deleteManuscriptFile(fileId: string, manuscriptId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  await prisma.manuscriptFile.delete({
    where: { id: fileId }
  })

  revalidatePath(`/dashboard/author/submit?continue=${manuscriptId}`)
  revalidatePath(`/dashboard/author/manuscripts/${manuscriptId}`)
  revalidatePath(`/dashboard/editor/manuscripts/${manuscriptId}`)
  revalidatePath(`/dashboard/office/manuscripts/${manuscriptId}`)
  revalidatePath(`/dashboard/production/manuscripts/${manuscriptId}`)

  return { success: true }
}

export async function getManuscriptFiles(manuscriptId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const files = await prisma.manuscriptFile.findMany({
    where: { manuscriptId },
    orderBy: { uploadedAt: 'asc' }
  })

  return { success: true, files }
}

