import { ChevronDown, Sparkles, type LucideIcon } from 'lucide-react'
import { useId } from 'react'

export function SelectField<T extends string>({
  label,
  Icon,
  value,
  options,
  onChange,
  aiSuggested,
}: {
  label: string
  Icon: LucideIcon
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  /** Show an "AI แนะนำ" tag when the current value came from the photo analysis. */
  aiSuggested?: boolean
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>
        <Icon size={17} strokeWidth={2} />
        {label}
        {aiSuggested && (
          <span className="ai-tag">
            <Sparkles size={11} /> AI แนะนำ
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
