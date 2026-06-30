import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const decodedName = decodeURIComponent(filename)

  // A tiny, valid PDF file that displays "CelX Publishing - Document Viewer"
  const pdfBase64 = 
    'JVBERi0xLjQKMSAwIG9iagogIDw8L1R5cGUvQ2F0YWxvZwogICAgL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKICA8PC9UeXBlL1BhZ2VzCiAgICAvS2lkc1szIDAgUl0KICAgIC9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKICA8PC9UeXBlL1BhZ2UKICAgIC9QYXJlbnQgMiAwIFIKICAgIC9NZWRpYUJveFswIDAgNTk1IDg0Ml0KICAgIC9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCiAgPDwvTGVuZ3RoIDU4Pj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgogNzIgNzEwIFRkCiAoQ2VsWCBQdWJsaXNoaW5nIC0gRG9jdW1lbnQgVmlld2VyKSBUagogMCAyMCBUZAogKERvY3VtZW50OiApIFRqCkVOCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNjIgMDAwMDAgbiAKMDAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDAyMjUgMDAwMDAgbiAKdHJhaWxlcgogIDw8L1NpemUgNQogICAgL1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMzMyCiUlRU9GCg=='
  
  const pdfBuffer = Buffer.from(pdfBase64, 'base64')

  // Extract clean file name by stripping manuscriptId prefix
  const parts = decodedName.split('_')
  const cleanName = parts.length > 2 ? parts.slice(2).join('_') : decodedName

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${cleanName}"`,
    },
  })
}
