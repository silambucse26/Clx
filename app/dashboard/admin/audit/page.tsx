import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { name: true, email: true } }
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Audit Log</h1>
        <p className="text-slate-500 text-sm">Review platform activities, logins, and critical admin actions</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Recent Platform Activities (Last 100 logs)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Shield className="w-10 h-10 text-slate-355 stroke-[1.5]" />
              <span className="text-sm font-medium">No activity logs found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-6">User</th>
                    <th className="py-3 px-6">Action</th>
                    <th className="py-3 px-6">Target Entity</th>
                    <th className="py-3 px-6">Details</th>
                    <th className="py-3 px-6">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 text-slate-450 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-700">
                        {log.user ? `${log.user.name} (${log.user.email})` : 'System / Guest'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded uppercase text-[10px]">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 font-mono">
                        {log.entity} {log.entityId && `[${log.entityId}]`}
                      </td>
                      <td className="py-3.5 px-6 text-slate-550 truncate max-w-xs">{log.details || '—'}</td>
                      <td className="py-3.5 px-6 text-slate-450 font-mono">{log.ipAddress || '—'}</td>
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
