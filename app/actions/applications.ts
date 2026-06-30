'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRoleEnum } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { encrypt } from '@/lib/crypto'


// Submit a new role application from the homepage
export async function submitRoleApplication(data: {
  name: string
  email: string
  role: string
  affiliation?: string
  country?: string
  bio?: string
}) {
  try {
    if (!data.name || !data.email || !data.role) {
      return { error: 'Name, email, and role are required.' }
    }

    const email = data.email.toLowerCase().trim()

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      return { error: 'An account with this email already exists.' }
    }

    // 2. Check if a pending application already exists
    const existingApp = await prisma.roleApplication.findFirst({
      where: {
        email,
        status: 'PENDING'
      }
    })
    if (existingApp) {
      return { error: 'An application for this email is already pending review.' }
    }

    // Validate the role
    const validRoles: UserRoleEnum[] = ['REVIEWER', 'EDITOR_IN_CHIEF', 'EDITORIAL_OFFICE']
    if (!validRoles.includes(data.role as UserRoleEnum)) {
      return { error: 'Invalid role requested.' }
    }

    // 3. Create role application
    await prisma.roleApplication.create({
      data: {
        name: data.name.trim(),
        email,
        role: data.role as UserRoleEnum,
        affiliation: data.affiliation?.trim() || null,
        country: data.country?.trim() || null,
        bio: data.bio?.trim() || null,
        status: 'PENDING',
      }
    })

    return { success: true }
  } catch (error: unknown) {
    console.error('Error submitting role application:', error)
    return { error: 'Failed to submit application. Please try again.' }
  }
}

// Fetch all role applications for admin review
export async function getRoleApplications() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }

  try {
    const applications = await prisma.roleApplication.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, applications }
  } catch (error) {
    console.error('Error fetching applications:', error)
    return { success: false, error: 'Failed to load applications.' }
  }
}

// Approve a role application, create user account, and return credentials
export async function approveRoleApplication(id: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }

  try {
    // 1. Find the application
    const application = await prisma.roleApplication.findUnique({
      where: { id }
    })

    if (!application) {
      return { error: 'Application not found.' }
    }

    if (application.status !== 'PENDING') {
      return { error: `This application has already been ${application.status.toLowerCase()}.` }
    }

    // 2. Check again if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: application.email }
    })
    if (existingUser) {
      // Mark application as approved or duplicate
      await prisma.roleApplication.update({
        where: { id },
        data: { status: 'APPROVED' }
      })
      return { error: 'A user with this email already exists in the system.' }
    }

    // 3. Generate a temporary password (e.g. CelX@1234)
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const tempPassword = `CelX@${randomDigits}`

    // 4. Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // 5. Create user in the database
    await prisma.user.create({
      data: {
        name: application.name,
        email: application.email,
        password: hashedPassword,
        role: application.role,
        affiliation: application.affiliation,
        country: application.country,
        bio: application.bio,
        isActive: true,
      }
    })

    // 6. Update role application status
    await prisma.roleApplication.update({
      where: { id },
      data: { 
        status: 'APPROVED',
        tempPassword: encrypt(tempPassword),
      }
    })



    revalidatePath('/dashboard/admin/users')

    return {
      success: true,
      email: application.email,
      password: tempPassword,
      name: application.name,
      role: application.role,
    }
  } catch (error) {
    console.error('Error approving application:', error)
    return { error: 'Failed to approve application.' }
  }
}

// Reject a role application
export async function rejectRoleApplication(id: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }

  try {
    const application = await prisma.roleApplication.findUnique({
      where: { id }
    })

    if (!application) {
      return { error: 'Application not found.' }
    }

    await prisma.roleApplication.update({
      where: { id },
      data: { status: 'REJECTED' }
    })

    revalidatePath('/dashboard/admin/users')

    return { success: true }
  } catch (error) {
    console.error('Error rejecting application:', error)
    return { error: 'Failed to reject application.' }
  }
}
