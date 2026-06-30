import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/index'
import { DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } }
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Payments</h1>
        <p className="text-slate-500 text-sm">Monitor system transactions and client payments</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <DollarSign className="w-10 h-10 text-slate-355 stroke-[1.5]" />
              <span className="text-sm font-medium">No payment transactions found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-3.5 px-6">Transaction ID</th>
                    <th className="py-3.5 px-6">User</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Method</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-450">{pay.transactionId || '—'}</td>
                      <td className="py-4 px-6 text-slate-655">{pay.user.name}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {pay.amount.toLocaleString(undefined, { style: 'currency', currency: pay.currency })}
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs uppercase">{pay.paymentMethod || '—'}</td>
                      <td className="py-4 px-6">
                        <Badge variant={pay.status === 'PAID' ? 'success' : 'destructive'}>
                          {pay.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : new Date(pay.createdAt).toLocaleDateString()}
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
