'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label, Textarea, Alert, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { adminSendToProduction, adminReturnToAuthor } from '@/app/actions/assignments'
import { FileCheck, FileX, MessageSquare } from 'lucide-react'

interface AdminManuscriptDecisionButtonsProps {
  manuscriptId: string
  status: string
}

export function AdminManuscriptDecisionButtons({ manuscriptId, status }: AdminManuscriptDecisionButtonsProps) {
  const [comment, setComment] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSendToProduction = async () => {
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const res = await adminSendToProduction(manuscriptId)
      if (res.success) {
        setSuccess('Paper successfully approved and sent to Production!')
      }
    } catch (err) {
      setError('Failed to update manuscript status.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnToAuthor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setError('Please add a comment explaining the requested corrections.')
      return
    }

    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const res = await adminReturnToAuthor(manuscriptId, comment)
      if (res.success) {
        setSuccess('Paper returned to Author for revision.')
        setComment('')
        setShowRevisionForm(false)
      }
    } catch (err) {
      setError('Failed to return paper.')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'PUBLISHED') {
    return (
      <Card className="border-green-150 bg-green-50/20">
        <CardContent className="p-4 text-center">
          <span className="text-xs font-bold text-green-700">✓ This paper has been fully published.</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-slate-200">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Super Admin Workflow Decisions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">{success}</Alert>}

        <div className="flex flex-col gap-2">
          {/* Send to Production Button */}
          <Button
            onClick={handleSendToProduction}
            disabled={isLoading || status === 'IN_PRODUCTION'}
            className="w-full text-xs font-bold bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5 h-9 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            {status === 'IN_PRODUCTION' ? 'In Production' : 'Approve & Send to Production'}
          </Button>

          {/* Show Return Form Toggle */}
          <Button
            onClick={() => setShowRevisionForm(p => !p)}
            disabled={isLoading}
            variant="outline"
            className="w-full text-xs font-bold border-red-200 text-red-700 hover:bg-red-50 flex items-center justify-center gap-1.5 h-9 cursor-pointer"
          >
            <FileX className="w-4 h-4" />
            Reject / Return to Author
          </Button>
        </div>

        {/* Revision Form Details */}
        {showRevisionForm && (
          <form onSubmit={handleReturnToAuthor} className="space-y-3 pt-3 border-t border-slate-100">
            <div className="space-y-1">
              <Label htmlFor="comment" className="text-xs font-bold text-slate-700">
                Comments for Author *
              </Label>
              <Textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Explain the required revisions or reasons for returning the paper..."
                className="text-xs"
              />
            </div>
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1 h-8 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Confirm Return to Author
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
