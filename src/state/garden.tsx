import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { composePreview, type PreparedImage } from '../client/image'
import type { SpaceAnalysis } from '../lib/prompts'
import { recommend } from '../lib/recommend'
import type { GardenPlan, SpaceInput } from '../lib/types'
import { analyzeSpace, generateGarden, type FailureCode } from '../server/functions'

export interface GardenResult {
  image: string
  source: 'ai' | 'preview'
  /** Why we fell back to the on-device preview, if we did. */
  fallbackReason?: FailureCode
}

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; analysis: SpaceAnalysis }
  | { status: 'error'; code: FailureCode }

interface State {
  photo: PreparedImage | null
  input: SpaceInput
  analysis: AnalysisState
  plan: GardenPlan | null
  result: GardenResult | null
}

type Action =
  | { type: 'restore'; state: State }
  | { type: 'photo'; photo: PreparedImage }
  | { type: 'input'; patch: Partial<SpaceInput> }
  | { type: 'analysis'; analysis: AnalysisState }
  | { type: 'result'; plan: GardenPlan; result: GardenResult }
  | { type: 'reset' }

export const DEFAULT_INPUT: SpaceInput = {
  spaceType: 'balcony',
  light: 'part',
  size: 'S',
  hasPets: false,
  beginner: true,
}

const INITIAL: State = {
  photo: null,
  input: DEFAULT_INPUT,
  analysis: { status: 'idle' },
  plan: null,
  result: null,
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'restore':
      return a.state
    case 'photo':
      return { ...state, photo: a.photo, analysis: { status: 'idle' }, plan: null, result: null }
    case 'input':
      return { ...state, input: { ...state.input, ...a.patch } }
    case 'analysis': {
      const next = { ...state, analysis: a.analysis }
      if (a.analysis.status === 'done' && a.analysis.analysis.isOutdoorSpace) {
        const { spaceType, light, size } = a.analysis.analysis
        next.input = { ...state.input, spaceType, light, size }
      }
      return next
    }
    case 'result':
      return { ...state, plan: a.plan, result: a.result }
    case 'reset':
      return INITIAL
  }
}

const STORAGE_KEY = 'greenlens:v1'

function load(): State | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as State
    return { ...INITIAL, ...s, input: { ...DEFAULT_INPUT, ...s.input } }
  } catch {
    return null
  }
}

function save(state: State) {
  const persistable: State = {
    ...state,
    analysis: state.analysis.status === 'running' ? { status: 'idle' } : state.analysis,
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
  } catch {
    // Quota exceeded (large AI image): keep everything except the result image.
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...persistable, result: null, plan: null }))
    } catch {
      /* storage unavailable */
    }
  }
}

interface GardenContextValue extends State {
  hydrated: boolean
  aiEnabled: boolean
  generating: boolean
  setPhoto: (photo: PreparedImage) => void
  setInput: (patch: Partial<SpaceInput>) => void
  generate: (variant?: number) => Promise<boolean>
  reset: () => void
}

const GardenContext = createContext<GardenContextValue | null>(null)

export function GardenProvider({ aiEnabled, children }: { aiEnabled: boolean; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const [hydrated, setHydrated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const saved = load()
    if (saved) dispatch({ type: 'restore', state: saved })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) save(state)
  }, [state, hydrated])

  const setPhoto = useCallback(
    (photo: PreparedImage) => {
      dispatch({ type: 'photo', photo })
      if (!aiEnabled) return
      dispatch({ type: 'analysis', analysis: { status: 'running' } })
      analyzeSpace({ data: { image: photo.dataUrl } })
        .then((r) => {
          // Ignore if the user picked another photo meanwhile.
          if (stateRef.current.photo?.dataUrl !== photo.dataUrl) return
          dispatch({
            type: 'analysis',
            analysis: r.ok ? { status: 'done', analysis: r.analysis } : { status: 'error', code: r.code },
          })
        })
        .catch(() => {
          if (stateRef.current.photo?.dataUrl !== photo.dataUrl) return
          dispatch({ type: 'analysis', analysis: { status: 'error', code: 'failed' } })
        })
    },
    [aiEnabled],
  )

  const setInput = useCallback((patch: Partial<SpaceInput>) => dispatch({ type: 'input', patch }), [])

  const generate = useCallback(
    async (variant = 0): Promise<boolean> => {
      const { photo, input } = stateRef.current
      if (!photo) return false
      setGenerating(true)
      try {
        const plan = recommend(input, variant)
        let result: GardenResult | null = null
        let fallbackReason: FailureCode = 'not-configured'

        if (aiEnabled) {
          try {
            const r = await generateGarden({
              data: {
                image: photo.dataUrl,
                width: photo.width,
                height: photo.height,
                spaceType: input.spaceType,
                light: input.light,
                plan,
              },
            })
            if (r.ok) result = { image: r.image, source: 'ai' }
            else fallbackReason = r.code
          } catch {
            fallbackReason = 'failed'
          }
        }

        if (!result) {
          result = { image: await composePreview(photo, plan), source: 'preview', fallbackReason }
        }
        dispatch({ type: 'result', plan, result })
        return true
      } catch (err) {
        console.error(err)
        return false
      } finally {
        setGenerating(false)
      }
    },
    [aiEnabled],
  )

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const value = useMemo(
    () => ({ ...state, hydrated, aiEnabled, generating, setPhoto, setInput, generate, reset }),
    [state, hydrated, aiEnabled, generating, setPhoto, setInput, generate, reset],
  )

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>
}

export function useGarden(): GardenContextValue {
  const ctx = useContext(GardenContext)
  if (!ctx) throw new Error('useGarden must be used inside <GardenProvider>')
  return ctx
}

export const FAILURE_MESSAGE: Record<FailureCode, string> = {
  'not-configured': 'ยังไม่ได้เชื่อมต่อ AI จึงแสดงภาพจำลองแบบง่ายแทน',
  'rate-limited': 'มีการใช้งานถี่เกินไป รอสักครู่แล้วลองใหม่ ระหว่างนี้แสดงภาพจำลองแบบง่ายแทน',
  busy: 'AI มีผู้ใช้งานจำนวนมาก ลองใหม่อีกครั้งในอีกสักครู่',
  blocked: 'AI ไม่สามารถแก้ไขภาพนี้ได้ ลองใช้ภาพพื้นที่อื่นที่ไม่มีบุคคลในภาพ',
  'no-image': 'AI ไม่ได้ส่งภาพกลับมา ลองกด “ลองแบบอื่น” อีกครั้ง',
  'bad-input': 'รูปภาพไม่ถูกต้อง ลองเลือกรูปใหม่',
  failed: 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI จึงแสดงภาพจำลองแบบง่ายแทน',
}
