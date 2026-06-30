import crypto from 'crypto'

// The secret key must be exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'd3a9f0e1c2b3a4e5d6c7b8a9f0e1c2b3' 
const IV_LENGTH = 16 // For AES-256-CBC, IV is 16 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(':')
    const ivHex = textParts.shift()
    if (!ivHex) return text

    const iv = Buffer.from(ivHex, 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (error) {
    // If decryption fails (e.g. for existing plain text records), return original text
    return text
  }
}
