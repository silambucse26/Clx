import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UsersManagement from '@/components/admin/UsersManagement'
import { decrypt } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  // Double check authorization on the server side
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  // Fetch real database users and recruitment applications
  const [users, applications] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        affiliation: true,
        country: true,
        bio: true,
        createdAt: true,
      }
    }),
    prisma.roleApplication.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        affiliation: true,
        country: true,
        bio: true,
        status: true,
        tempPassword: true,
        createdAt: true,
      }
    })
  ])

  // Decrypt temporary passwords on the server side
  const decryptedApplications = applications.map((app) => ({
    ...app,
    tempPassword: app.tempPassword ? decrypt(app.tempPassword) : null,
  }))

  return (
    <div className="max-w-7xl mx-auto py-2">
      <UsersManagement 
        initialUsers={users} 
        initialApplications={decryptedApplications} 
      />
    </div>
  )
}

