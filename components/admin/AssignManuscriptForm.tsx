'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label, Select, Textarea, Alert } from '@/components/ui/index'
import { assignManuscriptToUser } from '@/app/actions/assignments'
import { UserCheck } from 'lucide-react'

type AssigneeUser = {
  id: string
  name: string
  email: string
  role: string
}

interface AssignManuscriptFormProps {
  manuscriptId: string
  assignees: AssigneeUser[]
}

export function AssignManuscriptForm({ manuscriptId, assignees }: AssignManuscriptFormProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      setError('Please select an assignee.')
      return
    }

    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const res = await assignManuscriptToUser(manuscriptId, selectedUserId, message)
      if (res.error) {
        setError(res.error)
      } else if (res.success) {
        setSuccess(true)
        setSelectedUserId('')
        setMessage('')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">✓ Assigned successfully and notification sent!</Alert>}

      <div className="space-y-1">
        <Label htmlFor="assignee">Select Reviewer or Editor-in-Chief</Label>
        <Select
          id="assignee"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="text-xs"
        >
          <option value="">Choose user...</option>
          {assignees.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role.replace(/_/g, ' ')}) · {user.email}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="message">Message/Instructions (optional)</Label>
        <Textarea
          id="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add assignment instructions or specific review timeline notes..."
          className="text-xs"
        />
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full text-xs font-bold bg-navy-600 hover:bg-navy-700 text-white flex items-center justify-center gap-1.5 h-9"
      >
        <UserCheck className="w-3.5 h-3.5" />
        Assign Paper
      </Button>
    </form>
  )
}
