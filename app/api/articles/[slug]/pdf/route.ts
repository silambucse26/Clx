import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      authors: true,
      journal: true,
      manuscript: true,
    },
  })

  if (!article) {
    return new NextResponse('Article not found', { status: 404 })
  }

  const paperNumber = article.manuscript?.manuscriptId || `ART-${article.id.slice(-6).toUpperCase()}`
  const titleText = article.title.replace(/[()]/g, '') // escape parenthesis
  const journalTitle = article.journal.title.replace(/[()]/g, '')
  const authorsText = article.authors.map(a => a.name).join(', ').replace(/[()]/g, '')
  const keywordsText = article.keywords.replace(/[()]/g, '')

  // Escape parentheses in abstract and split into clean lines of ~80 chars to avoid cutting lines in PDF
  const escapedAbstract = article.abstract.replace(/[()]/g, '')
  const abstractLines: string[] = []
  const words = escapedAbstract.split(' ')
  let currentLine = ''
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length > 80) {
      abstractLines.push(currentLine.trim())
      currentLine = word
    } else {
      currentLine += ' ' + word
    }
  }
  if (currentLine) {
    abstractLines.push(currentLine.trim())
  }

  // Draw lines in PDF format
  const contentStreamLines = [
    'BT',
    '/F1 18 Tf',
    '72 760 Td',
    '(CelX Publishing Group - Open Access Paper) Tj',
    '0 -30 Td',
    '/F1 12 Tf',
    `([Paper Number] ${paperNumber}) Tj`,
    '0 -25 Td',
    `([Journal] ${journalTitle}) Tj`,
    '0 -35 Td',
    '/F1 14 Tf',
    `(Title: ${titleText.slice(0, 65)}) Tj`,
  ]

  if (titleText.length > 65) {
    contentStreamLines.push(`0 -20 Td (       ${titleText.slice(65, 130)}) Tj`)
  }

  contentStreamLines.push(
    '0 -30 Td',
    '/F1 11 Tf',
    `(Authors: ${authorsText.slice(0, 80)}) Tj`
  )
  if (authorsText.length > 80) {
    contentStreamLines.push(`0 -15 Td (         ${authorsText.slice(80, 160)}) Tj`)
  }

  contentStreamLines.push(
    '0 -25 Td',
    `(Keywords: ${keywordsText.slice(0, 80)}) Tj`,
    '0 -35 Td',
    '/F1 12 Tf',
    '(Abstract:) Tj',
    '0 -20 Td',
    '/F1 10 Tf'
  )

  // Add the abstract lines (up to 15 lines to avoid overflowing page height)
  for (const line of abstractLines.slice(0, 15)) {
    contentStreamLines.push(`0 -15 Td (${line}) Tj`)
  }

  contentStreamLines.push(
    '0 -40 Td',
    '/F1 10 Tf',
    '(License: CC BY 4.0 Open Access - Published by CelX Publishing Group) Tj',
    'ET'
  )

  const contentStream = contentStreamLines.join('\n')
  const streamLength = Buffer.byteLength(contentStream)

  // Construct valid PDF format
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R
   /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
>>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000062 00000 n 
0000000111 00000 n 
0000000302 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${302 + streamLength + 20}
%%EOF`

  const pdfBuffer = Buffer.from(pdfString, 'binary')

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${paperNumber}_${article.slug}.pdf"`,
    },
  })
}
