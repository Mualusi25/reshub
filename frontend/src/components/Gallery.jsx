import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react'

export default function Gallery({ images = [], alt = 'Property' }) {
  const [index, setIndex] = useState(0)

  // start from the cover again if the photo list changes
  useEffect(() => {
    setIndex(0)
  }, [images.length])

  if (!images.length) {
    return (
      <div className="detail-img">
        <Building2 size={80} strokeWidth={1.2} />
      </div>
    )
  }

  const go = (step) => setIndex((i) => (i + step + images.length) % images.length)

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'ArrowRight') go(1)
  }

  return (
    <div className="gallery" role="group" aria-label="Photo gallery" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="detail-img">
        <img src={images[index]} alt={`${alt}, photo ${index + 1} of ${images.length}`} />
        {images.length > 1 && (
          <>
            <button className="gallery-nav prev" aria-label="Previous photo" onClick={() => go(-1)}>
              <ChevronLeft size={22} />
            </button>
            <button className="gallery-nav next" aria-label="Next photo" onClick={() => go(1)}>
              <ChevronRight size={22} />
            </button>
            <span className="gallery-count">{index + 1} / {images.length}</span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              className={`gallery-thumb ${i === index ? 'active' : ''}`}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
