'use client'

import { useState } from 'react'
import { approveRoleApplication, rejectRoleApplication } from '@/app/actions/applications'
import { Card, CardContent, CardHeader, CardTitle, Input, Select, Badge, Alert, Separator } from '@/components/ui/index'
import { Button } from '@/components/ui/button'
import {
  Users, Mail, UserCheck, ShieldCheck, Search, PlusCircle,
  FileCheck, FileX, Calendar, Building, Globe, Copy, Check, ExternalLink, X
} from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
  role: string
  affiliation: string | null
  country: string | null
  bio: string | null
  createdAt: Date
}

type RoleApplication = {
  id: string
  name: string
  email: string
  role: string
  affiliation: string | null
  country: string | null
  bio: string | null
  status: string
  tempPassword: string | null
  createdAt: Date
}


interface UsersManagementProps {
  initialUsers: User[]
  initialApplications: RoleApplication[]
}

export default function UsersManagement({ initialUsers, initialApplications }: UsersManagementProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'applications'>('users')
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [applications, setApplications] = useState<RoleApplication[]>(initialApplications)
  const [userSearch, setUserSearch] = useState('')
  const [appSearch, setAppSearch] = useState('')
  const [appStatusFilter, setAppStatusFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')

  // Action states
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [inviteModal, setInviteModal] = useState<{
    isOpen: boolean
    name: string
    email: string
    password?: string
    role: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Filters
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(appSearch.toLowerCase())
    const matchesStatus = appStatusFilter === 'ALL' || app.status === appStatusFilter
    return matchesSearch && matchesStatus
  })

  // Handlers
  const handleApprove = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await approveRoleApplication(id)
      if (res.error) {
        alert(res.error)
      } else if (res.success && res.password) {
        // Update local application status to APPROVED
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: 'APPROVED', tempPassword: res.password || null } : app))
        )

        // Add user to local users list
        const newUser: User = {
          id: Math.random().toString(), // temporary client-side ID
          name: res.name,
          email: res.email,
          role: res.role,
          affiliation: applications.find((a) => a.id === id)?.affiliation || null,
          country: applications.find((a) => a.id === id)?.country || null,
          bio: applications.find((a) => a.id === id)?.bio || null,
          createdAt: new Date(),
        }
        setUsers((prev) => [newUser, ...prev])

        // Open the invitation credentials modal
        setInviteModal({
          isOpen: true,
          name: res.name,
          email: res.email,
          password: res.password,
          role: res.role,
        })
      }
    } catch (err) {
      alert('An error occurred during approval.')
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this application?')) return
    setLoadingId(id)
    try {
      const res = await rejectRoleApplication(id)
      if (res.error) {
        alert(res.error)
      } else {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: 'REJECTED' } : app))
        )
      }
    } catch (err) {
      alert('An error occurred during rejection.')
    } finally {
      setLoadingId(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getRoleLabel = (role: string) => {
    return role.replace(/_/g, ' ')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="default">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const emailTemplate = inviteModal
    ? `Subject: Welcome to CelX Publishing - Invitation to join as ${getRoleLabel(inviteModal.role)}

Hello ${inviteModal.name},

We are pleased to invite you to join the CelX Publishing platform as a ${getRoleLabel(inviteModal.role)}.

Your account has been successfully created. You can log in using the temporary credentials below:

Login Link: ${window.location.origin}/login
Email: ${inviteModal.email}
Temporary Password: ${inviteModal.password}

For security, please log in at your earliest convenience and update your profile and password.

Best regards,
CelX Editorial Board`
    : ''

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Monitor database users and review team applications</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start border border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Users list ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'applications' ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Applications ({applications.filter((a) => a.status === 'PENDING').length} pending)
          </button>
        </div>
      </div>

      {/* Main Card container */}
      <Card className="border border-slate-200">
        {activeTab === 'users' ? (
          <>
            {/* Users Tab Filter Area */}
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-bold text-slate-800">System Users</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-9 text-xs py-1"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="AUTHOR">Author</option>
                    <option value="REVIEWER">Reviewer</option>
                    <option value="EDITOR_IN_CHIEF">Editor-in-Chief</option>
                    <option value="EDITORIAL_OFFICE">Editorial Office</option>
                    <option value="PRODUCTION_EDITOR">Production Editor</option>
                    <option value="FINANCE_ADMIN">Finance Admin</option>
                  </Select>
                </div>
              </div>
            </CardHeader>

            {/* Users Tab Table */}
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Users className="w-10 h-10 text-slate-355 stroke-[1.5]" />
                  <span className="text-sm font-medium">No users found matching your search.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Desktop view */}
                  <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        <th className="py-3.5 px-6">Name</th>
                        <th className="py-3.5 px-6">Email</th>
                        <th className="py-3.5 px-6">Role</th>
                        <th className="py-3.5 px-6">Affiliation</th>
                        <th className="py-3.5 px-6">Country</th>
                        <th className="py-3.5 px-6">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-900">{user.name}</td>
                          <td className="py-4 px-6 text-slate-600">{user.email}</td>
                          <td className="py-4 px-6">
                            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500 truncate max-w-[200px]">{user.affiliation || '—'}</td>
                          <td className="py-4 px-6 text-slate-500">{user.country || '—'}</td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Responsive Mobile cards */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          {user.email}
                        </div>
                        {user.affiliation && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            {user.affiliation}
                          </div>
                        )}
                        {user.country && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            {user.country}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-350" />
                          Registered {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <>
            {/* Applications Tab Filter Area */}
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-bold text-slate-800">Recruitment Applications</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search candidate name or email..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                  <Select
                    value={appStatusFilter}
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    className="h-9 text-xs py-1"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </Select>
                </div>
              </div>
            </CardHeader>

            {/* Applications Tab List */}
            <CardContent className="p-0">
              {filteredApplications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <ShieldCheck className="w-10 h-10 text-slate-350 stroke-[1.5]" />
                  <span className="text-sm font-medium">No recruitment applications found.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="p-6 hover:bg-slate-50/40 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        {/* Name and badge */}
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-slate-900 text-base">{app.name}</h3>
                          {getStatusBadge(app.status)}
                          <span className="text-xs font-semibold bg-navy-50 text-navy-850 border border-navy-100 px-2.5 py-0.5 rounded">
                            Applying for: {getRoleLabel(app.role)}
                          </span>
                        </div>

                        {/* Candidate email, affiliation */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-slate-450" />
                            {app.email}
                          </div>
                          {app.affiliation && (
                            <div className="flex items-center gap-1.5">
                              <Building className="w-4 h-4 text-slate-450" />
                              {app.affiliation}
                            </div>
                          )}
                          {app.country && (
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-4 h-4 text-slate-450" />
                              {app.country}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-450" />
                            Submitted {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Bio/Expertise */}
                        {app.bio && (
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 leading-relaxed max-w-3xl">
                            <strong className="block text-slate-800 mb-1 text-[10px] uppercase font-bold tracking-wider">Expertise & Motivation:</strong>
                            {app.bio}
                          </div>
                        )}
                      </div>

                      {/* Admin Decision Actions */}
                      {app.status === 'PENDING' ? (
                        <div className="flex items-center gap-3 shrink-0 self-end lg:self-start">
                          <Button
                            variant="outline"
                            onClick={() => handleReject(app.id)}
                            disabled={loadingId !== null}
                            className="border-red-200 text-red-650 hover:bg-red-50 text-xs font-bold h-9 px-4 rounded cursor-pointer"
                          >
                            <FileX className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleApprove(app.id)}
                            disabled={loadingId !== null}
                            className="bg-[#10b981] hover:bg-[#059669] text-white text-xs font-extrabold h-9 px-4 rounded cursor-pointer inline-flex items-center"
                          >
                            {loadingId === app.id ? (
                              'Processing...'
                            ) : (
                              <>
                                <FileCheck className="w-3.5 h-3.5 mr-1" />
                                Approve & Invite
                              </>
                            )}
                          </Button>
                        </div>
                      ) : app.status === 'APPROVED' && app.tempPassword ? (
                        <div className="flex items-center gap-3 shrink-0 self-end lg:self-start">
                          <Button
                            onClick={() => setInviteModal({
                              isOpen: true,
                              name: app.name,
                              email: app.email,
                              password: app.tempPassword || undefined,
                              role: app.role,
                            })}
                            className="bg-navy-950 hover:bg-navy-800 text-white text-xs font-extrabold h-9 px-4 rounded cursor-pointer inline-flex items-center"
                          >
                            <Mail className="w-3.5 h-3.5 mr-1.5" />
                            View Invite Info
                          </Button>
                        </div>
                      ) : null}

                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* Invitation Credentials Overlay Modal */}
      {inviteModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Candidate Approved Successfully!</h3>
                  <p className="text-slate-500 text-xs">Login credentials and invite template generated</p>
                </div>
              </div>
              <button
                onClick={() => setInviteModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <Alert variant="success" className="bg-emerald-50 border-emerald-100 text-emerald-800">
                The account has been created in the database. Please copy the invitation template below and email it to the user.
              </Alert>

              {/* Login Credentials Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Candidate Email</div>
                  <div className="text-sm font-semibold text-slate-900 select-all">{inviteModal.email}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Temporary Password</div>
                  <div className="text-sm font-semibold text-teal-600 select-all">{inviteModal.password}</div>
                </div>
              </div>

              {/* Pre-composed Template Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Invitation Copy</span>
                  <button
                    onClick={() => copyToClipboard(emailTemplate)}
                    className="text-xs font-bold text-navy-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Template
                      </>
                    )}
                  </button>
                </div>

                <pre className="w-full bg-slate-900 text-slate-350 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-950 shadow-inner">
                  {emailTemplate}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <Button
                variant="outline"
                onClick={() => setInviteModal(null)}
                className="h-10 text-xs font-bold px-5 cursor-pointer"
              >
                Close Window
              </Button>
              <Button
                onClick={() => {
                  copyToClipboard(emailTemplate)
                  window.open(`mailto:${inviteModal.email}?subject=Invitation to join CelX as ${encodeURIComponent(getRoleLabel(inviteModal.role))}&body=${encodeURIComponent(emailTemplate)}`)
                  setInviteModal(null)
                }}
                className="bg-navy-900 hover:bg-navy-800 text-white text-xs font-extrabold h-10 px-5 rounded cursor-pointer inline-flex items-center gap-2"
              >
                Copy & Open Mail App
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
