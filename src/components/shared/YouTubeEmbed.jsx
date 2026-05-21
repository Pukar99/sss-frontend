function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : null
}

export default function YouTubeEmbed({ url, onRemove }) {
  const id = getYouTubeId(url)
  if (!id) return null

  return (
    <div className="w-full mt-2">
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-700" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${id}`}
          title="Progress video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-400 mt-1"
        >
          Remove
        </button>
      )}
    </div>
  )
}
