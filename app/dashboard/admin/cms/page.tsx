import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/index'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCMSPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  const pages = await prisma.cMSPage.findMany({
    orderBy: { title: 'asc' }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage CMS Pages</h1>
        <p className="text-slate-500 text-sm">Create and edit static content pages like guidelines, policies, and about pages</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Static Pages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pages.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Package className="w-10 h-10 text-slate-355 stroke-[1.5]" />
              <span className="text-sm font-medium">No CMS pages found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-3.5 px-6">Page Title</th>
                    <th className="py-3.5 px-6">URL Slug</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pages.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">{p.title}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">/{p.slug}</td>
                      <td className="py-4 px-6">
                        {p.isPublished ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(p.updatedAt).toLocaleDateString()}
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
