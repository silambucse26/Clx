'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { FileText, Eye, Download, File, Image as ImageIcon, Table as TableIcon, HelpCircle } from 'lucide-react'

type ManuscriptFile = {
  id: string
  fileName: string
  fileType: string
  fileUrl: string
  fileSize: number | null
  uploadedAt: Date
}

interface SubmittedFilesCardProps {
  files: ManuscriptFile[]
}

export function SubmittedFilesCard({ files }: SubmittedFilesCardProps) {
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'manuscript':
        return <FileText className="w-5 h-5 text-blue-500" />
      case 'figures':
        return <ImageIcon className="w-5 h-5 text-purple-500" />
      case 'tables':
        return <TableIcon className="w-5 h-5 text-emerald-500" />
      case 'supplementary':
        return <File className="w-5 h-5 text-amber-500" />
      default:
        return <HelpCircle className="w-5 h-5 text-slate-500" />
    }
  }

  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getSlotLabel = (type: string) => {
    switch (type) {
      case 'manuscript':
        return 'Primary Manuscript'
      case 'figures':
        return 'Figures & Artwork'
      case 'tables':
        return 'Tables & Charts'
      case 'supplementary':
        return 'Supplementary Materials'
      default:
        return type.replace(/_/g, ' ')
    }
  }

  return (
    <Card className="border border-slate-200">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-navy-600" />
          Submitted Files ({files.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {files.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No files submitted for this manuscript.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {files.map((file) => (
              <div key={file.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center gap-3 truncate min-w-0">
                  <div className="shrink-0 p-2 bg-slate-100/80 rounded-lg">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="truncate min-w-0">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      {getSlotLabel(file.fileType)}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate leading-snug">
                      {file.fileName}
                    </h4>
                    <span className="text-[11px] text-slate-450">
                      Size: {formatBytes(file.fileSize)} · Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-350 text-slate-700 transition-all hover:scale-102 cursor-pointer shadow-sm"
                    title="Open File in New Tab"
                  >
                    <Eye className="w-4 h-4 mr-1 md:mr-1.5" />
                    <span className="text-xs font-bold hidden md:inline">Open</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
