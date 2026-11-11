import { ChevronDown, Sparkles, type LucideIcon } from 'lucide-react'
import { useId } from 'react'

export function SelectField<T extends string>({
  label,
  Icon,
  value,
  options,
  onChange,
  tag,
}: {
  label: string
  Icon: LucideIcon
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  /** Small tag saying where the current value came from, e.g. "AI แนะนำ". */
  tag?: string | null
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>
        <Icon size={17} strokeWidth={2} />
        {label}
        {tag && (
          <span className="ai-tag">
            <Sparkles size={11} /> {tag}
          </span>
        )}
      </label>
      <div className="select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} />
      </div>
    </div>
  )
}
