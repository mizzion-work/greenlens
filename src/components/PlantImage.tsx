import { PLANT_ART } from '../lib/plant-art'

/** Plants that have a real photo in public/plants/<id>.webp. Others use the illustration. */
const PHOTOS = new Set(['snake', 'rubber', 'pothos', 'areca', 'aloe', 'fern'])

export function PlantImage({ id, alt }: { id: string; alt: string }) {
  return (
    <div className="plant-photo">
      {PHOTOS.has(id) ? (
        <img src={`/plants/${id}.webp`} alt={alt} width={200} height={200} loading="lazy" decoding="async" />
      ) : (
        <svg
          viewBox="0 0 60 100"
          role="img"
          aria-label={alt}
          // Static, app-authored SVG markup.
          dangerouslySetInnerHTML={{ __html: PLANT_ART[id] ?? '' }}
        />
      )}
    </div>
  )
}
