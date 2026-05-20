import { useRef, useState } from 'react'
import { uploadPhoto } from '../../api/index'

// onUploaded(url) called after successful upload
export default function MediaUpload({ onUploaded, label = '📷 Attach Photo', multiple = false }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        const result = await uploadPhoto(file)
        if (result.url) {
          onUploaded(result.url)
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      // reset so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="text-gray-400 hover:text-white disabled:opacity-50 border border-gray-700 px-3 py-1.5 rounded-lg text-xs"
      >
        {uploading ? 'Uploading...' : label}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
