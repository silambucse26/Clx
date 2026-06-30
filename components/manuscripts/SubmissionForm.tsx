'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Label, Select, Alert, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { createDraftManuscript, updateManuscriptStep, submitManuscript, addManuscriptFile, deleteManuscriptFile, getManuscriptFiles } from '@/app/actions/manuscripts'
import { CheckCircle2, ArrowLeft, ArrowRight, Send, Upload, File, Trash2, ShieldAlert } from 'lucide-react'


interface Journal { id: string; title: string; abbreviation: string | null; subjectArea: string; slug: string }
interface Props { journals: Journal[] }

const steps = [
  { id: 1, label: 'Journal' },
  { id: 2, label: 'Article Type' },
  { id: 3, label: 'Title' },
  { id: 4, label: 'Abstract' },
  { id: 5, label: 'Keywords' },
  { id: 6, label: 'Authors' },
  { id: 7, label: 'Files' },
  { id: 8, label: 'Cover Letter' },
  { id: 9, label: 'Reviewers' },
  { id: 10, label: 'Declarations' },
  { id: 11, label: 'License & APC' },
  { id: 12, label: 'Preview' },
]

export function SubmissionForm({ journals }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const continueId = searchParams.get('continue')
  const preselectedJournal = searchParams.get('journal')

  const [currentStep, setCurrentStep] = useState(1)
  const [manuscriptDbId, setManuscriptDbId] = useState<string | null>(continueId)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    journalId: preselectedJournal ? journals.find(j => j.slug === preselectedJournal)?.id || '' : '',
    articleType: 'ORIGINAL_RESEARCH',
    title: '',
    abstract: '',
    keywords: '',
    coverLetter: '',
    suggestedReviewers: '',
    opposedReviewers: '',
    conflictOfInterest: 'None declared.',
    fundingStatement: '',
    ethicsStatement: '',
    dataAvailability: '',
    license: 'CC_BY',
    apcConfirmed: false,
    waiverRequested: false,
    waiverReason: '',
  })

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; fileName: string; fileType: string; fileSize: number | null }>>([])

  useEffect(() => {
    if (currentStep === 7 && manuscriptDbId) {
      getManuscriptFiles(manuscriptDbId).then((res) => {
        if (res.success && res.files) {
          setUploadedFiles(res.files)
        }
      })
    }
  }, [currentStep, manuscriptDbId])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0]
    if (!file || !manuscriptDbId) return
    setError('')
    setIsLoading(true)

    try {
      const res = await addManuscriptFile({
        manuscriptId: manuscriptDbId,
        fileName: file.name,
        fileType,
        fileSize: file.size,
      })

      if (res.success && res.file) {
        setUploadedFiles((prev) => [...prev, {
          id: res.file.id,
          fileName: res.file.fileName,
          fileType: res.file.fileType,
          fileSize: res.file.fileSize
        }])
      }
    } catch (err) {
      setError('Failed to upload file.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!manuscriptDbId) return
    setError('')
    setIsLoading(true)

    try {
      const res = await deleteManuscriptFile(fileId, manuscriptDbId)
      if (res.success) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
      }
    } catch (err) {
      setError('Failed to delete file.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  const selectedJournal = journals.find(j => j.id === formData.journalId)

  const handleNext = async () => {
    setError('')
    setIsLoading(true)
    try {
      // Validation per step
      if (currentStep === 1 && !formData.journalId) {
        setError('Please select a journal')
        return
      }
      if (currentStep === 3 && formData.title.length < 10) {
        setError('Title must be at least 10 characters')
        return
      }
      if (currentStep === 4 && formData.abstract.length < 100) {
        setError('Abstract must be at least 100 characters')
        return
      }
      if (currentStep === 5 && !formData.keywords.trim()) {
        setError('Please add at least one keyword')
        return
      }
      if (currentStep === 7) {
        const hasManuscript = uploadedFiles.some((f) => f.fileType === 'manuscript')
        if (!hasManuscript) {
          setError('Please upload at least the primary Manuscript File (DOCX/PDF) before proceeding.')
          setIsLoading(false)
          return
        }
      }


      // Create draft on first step completion
      if (currentStep === 1 && !manuscriptDbId) {
        const result = await createDraftManuscript({ journalId: formData.journalId, title: formData.title || 'Draft' })
        if ('error' in result) { setError(String(result.error)); return }
        setManuscriptDbId(result.manuscriptId || null)
      }

      // Save step data
      if (manuscriptDbId) {
        await updateManuscriptStep(manuscriptDbId, currentStep + 1, formData)
      }

      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    } catch (e) {
      setError(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!manuscriptDbId) return
    setIsLoading(true)
    setError('')
    try {
      const result = await submitManuscript(manuscriptDbId)
      if ('error' in result) { setError(String(result.error)); return }
      router.push(`/dashboard/author/manuscripts?submitted=${result.manuscriptId}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="font-medium text-slate-700">Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.label}</span>
          <span className="text-slate-500">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full">
          <div className="h-full bg-navy-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        {/* Step dots */}
        <div className="flex items-center justify-between mt-2">
          {steps.map(step => (
            <div key={step.id} className={`w-2 h-2 rounded-full transition-colors ${
              step.id < currentStep ? 'bg-green-500' : step.id === currentStep ? 'bg-navy-600' : 'bg-slate-200'
            }`} />
          ))}
        </div>
      </div>

      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1]?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Journal */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label htmlFor="journal">Select Journal *</Label>
              <Select
                id="journal"
                value={formData.journalId}
                onChange={e => setFormData(prev => ({ ...prev, journalId: e.target.value }))}
                className="text-base"
              >
                <option value="">Choose a journal...</option>
                {journals.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </Select>
              {selectedJournal && (
                <div className="bg-navy-50 border border-navy-200 rounded-lg p-4 text-sm text-navy-800">
                  <strong>Subject area:</strong> {selectedJournal.subjectArea}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Article Type */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label htmlFor="articleType">Article Type *</Label>
              <Select
                id="articleType"
                value={formData.articleType}
                onChange={e => setFormData(prev => ({ ...prev, articleType: e.target.value }))}
              >
                {[
                  ['ORIGINAL_RESEARCH', 'Original Research Article'],
                  ['REVIEW_ARTICLE', 'Review Article'],
                  ['CASE_REPORT', 'Case Report'],
                  ['SHORT_COMMUNICATION', 'Short Communication'],
                  ['LETTER_TO_EDITOR', 'Letter to the Editor'],
                  ['COMMENTARY', 'Commentary'],
                  ['OPINION', 'Opinion'],
                  ['TECHNICAL_NOTE', 'Technical Note'],
                ].map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                Please select the article type that best describes your manuscript. Original research articles report new findings from primary data. Review articles synthesize existing literature.
              </div>
            </div>
          )}

          {/* Step 3: Title */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Label htmlFor="title">Manuscript Title *</Label>
              <Textarea
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter the full title of your manuscript..."
                className="min-h-[100px] text-base"
              />
              <div className="text-xs text-slate-500">{formData.title.length} characters · Minimum 10</div>
            </div>
          )}

          {/* Step 4: Abstract */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Label htmlFor="abstract">Abstract *</Label>
              <Textarea
                id="abstract"
                value={formData.abstract}
                onChange={e => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                placeholder="Write a structured abstract. Include: Background/Introduction, Methods, Results, and Conclusions..."
                className="min-h-[250px]"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{formData.abstract.length} characters</span>
                <span className={formData.abstract.length < 100 ? 'text-red-500' : 'text-green-500'}>
                  {formData.abstract.length < 100 ? `${100 - formData.abstract.length} more needed` : '✓ Minimum reached'}
                </span>
              </div>
            </div>
          )}

          {/* Step 5: Keywords */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <Label htmlFor="keywords">Keywords *</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={e => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="Enter keywords separated by commas: gene editing, CRISPR, stem cells..."
              />
              {formData.keywords && (
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.split(',').map((kw, i) => kw.trim() && (
                    <span key={i} className="text-xs bg-navy-100 text-navy-800 px-2.5 py-0.5 rounded-full">{kw.trim()}</span>
                  ))}
                </div>
              )}
              <div className="text-sm text-slate-500">Add 4-8 keywords. Separate with commas.</div>
            </div>
          )}

          {/* Step 6: Authors */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                Your account is automatically added as the corresponding author. You can add co-authors below.
              </div>
              <div className="space-y-3">
                <Label>Co-authors (optional)</Label>
                <Textarea
                  placeholder="List co-authors in format: Full Name, Email, Affiliation (one per line)..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}

          {/* Step 7: Files */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <strong>Manuscript Files:</strong> Please upload your primary manuscript document (DOCX or PDF is required). You may optionally upload figures, tables, and supplementary files.
                </div>
              </div>

              {[
                { label: 'Manuscript File (DOCX/PDF) *', id: 'manuscript', required: true },
                { label: 'Figures (PDF/PNG/TIFF)', id: 'figures', required: false },
                { label: 'Tables (DOCX/XLSX)', id: 'tables', required: false },
                { label: 'Supplementary Materials', id: 'supplementary', required: false },
              ].map(slot => {
                const slotFiles = uploadedFiles.filter(f => f.fileType === slot.id)
                return (
                  <div key={slot.id} className="space-y-2 border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                    <Label className="text-sm font-bold text-slate-800">{slot.label}</Label>
                    
                    {/* Upload button area */}
                    <div className="relative">
                      <input
                        type="file"
                        id={`file-input-${slot.id}`}
                        onChange={(e) => handleFileUpload(e, slot.id)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`file-input-${slot.id}`)?.click()}
                        className="w-full border-2 border-dashed border-slate-350 rounded-lg py-5 text-center text-xs text-slate-500 cursor-pointer hover:border-teal-400 hover:bg-teal-50/20 transition-all flex flex-col items-center justify-center gap-1.5"
                      >
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span>Select file to upload</span>
                      </button>
                    </div>

                    {/* Files list */}
                    {slotFiles.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        {slotFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
                            <div className="flex items-center gap-2 truncate">
                              <File className="w-4 h-4 text-slate-450 shrink-0" />
                              <span className="font-semibold truncate text-slate-900">{file.fileName}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">({formatBytes(file.fileSize)})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleFileDelete(file.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}


          {/* Step 8: Cover Letter */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                value={formData.coverLetter}
                onChange={e => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                placeholder="Dear Editor-in-Chief,

We are pleased to submit our manuscript entitled... for consideration for publication in...

This work is original, has not been published elsewhere, and is not under review at another journal. All authors have approved the manuscript and agree to its submission.

We believe this work makes an important contribution because...

Best regards,
[Corresponding Author Name]"
                className="min-h-[250px]"
              />
            </div>
          )}

          {/* Step 9: Reviewers */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="suggestedReviewers">Suggested Reviewers (optional)</Label>
                <Textarea
                  id="suggestedReviewers"
                  value={formData.suggestedReviewers}
                  onChange={e => setFormData(prev => ({ ...prev, suggestedReviewers: e.target.value }))}
                  placeholder="Name, Institution, Email — one per line..."
                  className="min-h-[100px]"
                />
                <div className="text-xs text-slate-500 mt-1">Suggest 2-4 potential reviewers with relevant expertise. The editor may or may not invite them.</div>
              </div>
              <div>
                <Label htmlFor="opposedReviewers">Opposed Reviewers (optional)</Label>
                <Textarea
                  id="opposedReviewers"
                  value={formData.opposedReviewers}
                  onChange={e => setFormData(prev => ({ ...prev, opposedReviewers: e.target.value }))}
                  placeholder="Name, Institution — one per line. Briefly state reason..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* Step 10: Declarations */}
          {currentStep === 10 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="conflictOfInterest">Conflict of Interest Declaration *</Label>
                <Textarea
                  id="conflictOfInterest"
                  value={formData.conflictOfInterest}
                  onChange={e => setFormData(prev => ({ ...prev, conflictOfInterest: e.target.value }))}
                  placeholder="State any conflicts of interest, or 'None declared.'"
                />
              </div>
              <div>
                <Label htmlFor="fundingStatement">Funding Statement *</Label>
                <Textarea
                  id="fundingStatement"
                  value={formData.fundingStatement}
                  onChange={e => setFormData(prev => ({ ...prev, fundingStatement: e.target.value }))}
                  placeholder="e.g., This research was funded by NIH Grant R01GM123456. Or: This research received no external funding."
                />
              </div>
              <div>
                <Label htmlFor="ethicsStatement">Ethics Approval Statement *</Label>
                <Textarea
                  id="ethicsStatement"
                  value={formData.ethicsStatement}
                  onChange={e => setFormData(prev => ({ ...prev, ethicsStatement: e.target.value }))}
                  placeholder="e.g., Approved by IRB Protocol #2024-001. Or: Not applicable — computational study."
                />
              </div>
              <div>
                <Label htmlFor="dataAvailability">Data Availability Statement *</Label>
                <Textarea
                  id="dataAvailability"
                  value={formData.dataAvailability}
                  onChange={e => setFormData(prev => ({ ...prev, dataAvailability: e.target.value }))}
                  placeholder="e.g., All data are available as supplementary materials. Or: Data available upon reasonable request."
                />
              </div>
            </div>
          )}

          {/* Step 11: License & APC */}
          {currentStep === 11 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="license">Open Access License *</Label>
                <Select
                  id="license"
                  value={formData.license}
                  onChange={e => setFormData(prev => ({ ...prev, license: e.target.value }))}
                >
                  <option value="CC_BY">CC BY 4.0 (Recommended — most permissive)</option>
                  <option value="CC_BY_NC">CC BY-NC 4.0 (Non-commercial)</option>
                  <option value="CC_BY_ND">CC BY-ND 4.0 (No derivatives)</option>
                  <option value="CC_BY_SA">CC BY-SA 4.0 (Share alike)</option>
                </Select>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="font-medium text-slate-900 mb-2">APC Information</div>
                {selectedJournal && (
                  <div className="text-sm text-slate-700">
                    The Article Processing Charge for the selected journal is approximately{' '}
                    <strong>$850 USD</strong>.
                    <br /><br />
                    <strong>Important:</strong> APC is charged ONLY upon acceptance of your manuscript. Submission is free. Payment does not influence editorial decisions.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.apcConfirmed}
                    onChange={e => setFormData(prev => ({ ...prev, apcConfirmed: e.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-slate-700">
                    I confirm that I have read and understand the APC policy. I understand that APC is charged only upon acceptance.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.waiverRequested}
                    onChange={e => setFormData(prev => ({ ...prev, waiverRequested: e.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-slate-700">
                    I am requesting an APC waiver (for authors from low-income countries or exceptional circumstances)
                  </span>
                </label>
                {formData.waiverRequested && (
                  <Textarea
                    value={formData.waiverReason}
                    onChange={e => setFormData(prev => ({ ...prev, waiverReason: e.target.value }))}
                    placeholder="Briefly explain the reason for your waiver request..."
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 12: Preview & Submit */}
          {currentStep === 12 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                <strong>✓ Ready to submit!</strong> Please review the information below before submitting your manuscript.
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Journal', value: selectedJournal?.title },
                  { label: 'Article Type', value: formData.articleType.replace(/_/g, ' ') },
                  { label: 'Title', value: formData.title },
                  { label: 'Abstract Length', value: `${formData.abstract.length} characters` },
                  { label: 'Keywords', value: formData.keywords },
                  { label: 'License', value: formData.license.replace(/_/g, ' ') },
                  { label: 'APC Confirmed', value: formData.apcConfirmed ? 'Yes' : 'No' },
                  { label: 'Waiver Requested', value: formData.waiverRequested ? 'Yes' : 'No' },
                ].map(item => (
                  <div key={item.label} className="py-2 flex gap-4">
                    <span className="w-36 shrink-0 text-sm font-medium text-slate-500">{item.label}</span>
                    <span className="text-sm text-slate-900">{item.value || '—'}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                By submitting, you confirm that this manuscript is original, not published elsewhere, and all authors have approved the submission. You agree to our publication ethics policies.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
          disabled={currentStep === 1 || isLoading}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={handleNext} isLoading={isLoading}>
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} isLoading={isLoading} variant="secondary">
            <Send className="w-4 h-4" /> Submit Manuscript
          </Button>
        )}
      </div>
    </div>
  )
}
