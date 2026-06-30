import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/index'
import { ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const session = await auth()
  if (!session?.user || !['SUPER_ADMIN', 'SERVICE_TEAM'].includes(session.user.role)) {
    redirect('/login')
  }

  const services = await prisma.serviceOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } }
    }
  })

  const getServiceLabel = (type: string) => {
    return type.replace(/_/g, ' ')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Service Orders</h1>
        <p className="text-slate-500 text-sm">Oversee scientific editing, translation, and artwork assistance orders</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">All Service Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <ShoppingBag className="w-10 h-10 text-slate-355 stroke-[1.5]" />
              <span className="text-sm font-medium">No service orders found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-3.5 px-6">Service Type</th>
                    <th className="py-3.5 px-6">Client</th>
                    <th className="py-3.5 px-6">Urgency</th>
                    <th className="py-3.5 px-6">Quote Amount</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Order Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {services.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">{getServiceLabel(order.serviceType)}</td>
                      <td className="py-4 px-6 text-slate-655">{order.user.name}</td>
                      <td className="py-4 px-6">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          order.urgency === 'urgent' ? 'bg-red-50 text-red-750' : 'bg-slate-100 text-slate-655'
                        }`}>
                          {order.urgency.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">
                        {order.quoteAmount ? `$${order.quoteAmount.toFixed(2)}` : 'Pending Quote'}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={order.status === 'COMPLETED' ? 'success' : 'default'}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
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
