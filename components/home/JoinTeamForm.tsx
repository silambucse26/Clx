'use client'

import { useState } from 'react'
import { submitRoleApplication } from '@/app/actions/applications'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Label, Select, Alert } from '@/components/ui/index'
import { Send, Users, ClipboardCheck, Sparkles } from 'lucide-react'

export default function JoinTeamForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'REVIEWER',
    affiliation: '',
    country: '',
    bio: '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await submitRoleApplication(formData)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          role: 'REVIEWER',
          affiliation: '',
          country: '',
          bio: '',
        })
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-slate-900 text-white py-16 lg:py-24 border-t border-slate-800 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Recruitment Open
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Join Our Editorial & Reviewer Team
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Collaborate with leading microbiologists globally. Apply for editorial or reviewing roles and contribute to peer-reviewed scientific advancements.
          </p>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl">
          {success && (
            <Alert variant="success" className="mb-6 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
              <div className="flex gap-2">
                <ClipboardCheck className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-white">Application Received!</h4>
                  <p className="text-xs text-emerald-300 mt-1">
                    Thank you for applying. The Super Admin will review your details. If approved, you will receive an invitation email containing your login credentials and temporary password.
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label htmlFor="join-name" className="text-slate-300 text-xs font-semibold">Full Name</Label>
                <Input
                  id="join-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Doe"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500 focus:border-transparent text-sm h-11"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="join-email" className="text-slate-300 text-xs font-semibold">Email Address</Label>
                <Input
                  id="join-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@university.edu"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500 focus:border-transparent text-sm h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1 md:col-span-1">
                <Label htmlFor="join-role" className="text-slate-300 text-xs font-semibold">Target Role</Label>
                <Select
                  id="join-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white focus:ring-teal-500 focus:border-transparent text-sm h-11"
                >
                  <option value="REVIEWER" className="bg-slate-900 text-white">Reviewer</option>
                  <option value="EDITOR_IN_CHIEF" className="bg-slate-900 text-white">Editor-in-Chief</option>
                  <option value="EDITORIAL_OFFICE" className="bg-slate-900 text-white">Editorial Office</option>
                </Select>
              </div>

              <div className="space-y-1 md:col-span-1">
                <Label htmlFor="join-affiliation" className="text-slate-300 text-xs font-semibold">Affiliation / Institution</Label>
                <Input
                  id="join-affiliation"
                  type="text"
                  value={formData.affiliation}
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                  placeholder="e.g. Stanford University"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500 focus:border-transparent text-sm h-11"
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <Label htmlFor="join-country" className="text-slate-300 text-xs font-semibold">Country</Label>
                <Input
                  id="join-country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g. United States"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500 focus:border-transparent text-sm h-11"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="join-bio" className="text-slate-300 text-xs font-semibold">Brief Bio / Key Fields of Expertise</Label>
              <Textarea
                id="join-bio"
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Mention your research fields, publications count, and motivation to join the team."
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:ring-teal-500 focus:border-transparent text-sm min-h-[100px]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold h-11 px-8 rounded-lg inline-flex items-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-lg hover:shadow-teal-500/20"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
