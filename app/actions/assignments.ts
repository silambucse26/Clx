'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function assignManuscriptToUser(
  manuscriptId: string,
  userId: string,
  message: string
) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  if (session.user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized')

  const [manuscript, user] = await Promise.all([
    prisma.manuscript.findUnique({ where: { id: manuscriptId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ])

  if (!manuscript) throw new Error('Manuscript not found')
  if (!user) throw new Error('User not found')

  // Check if invitation already exists to avoid duplicates
  const existing = await prisma.reviewerInvitation.findFirst({
    where: { manuscriptId, reviewerId: userId },
  })

  if (existing) {
    return { error: 'This user is already assigned/invited to this manuscript.' }
  }

  // Create standard invitation/assignment record
  const invitation = await prisma.reviewerInvitation.create({
    data: {
      manuscriptId,
      reviewerId: userId,
      invitedById: session.user.id,
      status: 'PENDING',
      message: message || `You have been assigned to examine manuscript: "${manuscript.title}".`,
    },
  })

  // Notify assignee
  await prisma.notification.create({
    data: {
      userId,
      title: 'Manuscript Assignment',
      message: `Super Admin assigned you to manuscript "${manuscript.title}". Please accept or check details.`,
      category: 'REVIEWER_INVITATION',
      link: user.role === 'REVIEWER' 
        ? `/dashboard/reviewer/invitations/${invitation.id}`
        : `/dashboard/editor`, // editors can review details from their editor page
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'MANUSCRIPT_ASSIGNED_BY_ADMIN',
      entity: 'Manuscript',
      entityId: manuscriptId,
      details: `Super Admin assigned ${user.role} ${user.name} (${user.email}) to manuscript ${manuscript.manuscriptId}`,
    },
  })

  revalidatePath(`/dashboard/admin/manuscripts/${manuscriptId}`)
  return { success: true }
}

export async function adminSendToProduction(manuscriptId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  if (session.user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized')

  const manuscript = await prisma.manuscript.findUnique({ where: { id: manuscriptId } })
  if (!manuscript) throw new Error('Manuscript not found')

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: { status: 'IN_PRODUCTION' },
  })

  // Notify author
  await prisma.notification.create({
    data: {
      userId: manuscript.submitterId,
      title: 'Manuscript Sent to Production',
      message: `Your manuscript ${manuscript.manuscriptId} has passed reviews and is sent to production for publishing.`,
      category: 'ACCEPTANCE',
      link: `/dashboard/author/manuscripts/${manuscriptId}`,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ADMIN_SENT_TO_PRODUCTION',
      entity: 'Manuscript',
      entityId: manuscriptId,
      details: `Admin marked manuscript ${manuscript.manuscriptId} as IN_PRODUCTION`,
    },
  })

  revalidatePath(`/dashboard/admin/manuscripts/${manuscriptId}`)
  return { success: true }
}

export async function adminReturnToAuthor(manuscriptId: string, comment: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  if (session.user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized')

  const manuscript = await prisma.manuscript.findUnique({ where: { id: manuscriptId } })
  if (!manuscript) throw new Error('Manuscript not found')

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      status: 'REVISION_REQUESTED',
      technicalCheckNotes: comment,
    },
  })

  // Notify author
  await prisma.notification.create({
    data: {
      userId: manuscript.submitterId,
      title: 'Revision Required (Admin Decision)',
      message: `Your manuscript ${manuscript.manuscriptId} has been returned for revisions. Admin Comment: "${comment}"`,
      category: 'EDITORIAL_DECISION',
      link: `/dashboard/author/manuscripts/${manuscriptId}`,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ADMIN_RETURNED_TO_AUTHOR',
      entity: 'Manuscript',
      entityId: manuscriptId,
      details: `Admin returned manuscript ${manuscript.manuscriptId} to author. Comment: ${comment}`,
    },
  })

  revalidatePath(`/dashboard/admin/manuscripts/${manuscriptId}`)
  return { success: true }
}
