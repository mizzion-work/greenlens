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
import { getGarden, saveGarden, type SavedResult } from '../client/gardens-db'
import { composePreview, makeThumb, type PreparedImage } from '../client/image'
import type { SpaceAnalysis } from '../lib/prompts'
import { recommend } from '../lib/recommend'
import { DEFAULT_LAT, estimateSun } from '../lib/sun'
import type { GardenPlan, SpaceInput } from '../lib/types'
import { analyzeSpace, generateGarden, type FailureCode } from '../server/functions'

/** `fallbackReason` says why we fell back to the on-device preview, if we did. */
export type GardenResult = SavedResult

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
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
  /** Id of this garden in "สวนของฉัน"; one per photo. */
  currentId: string | null
}

type Action =
  | { type: 'restore'; state: State }
  | { type: 'photo'; photo: PreparedImage }
  | { type: 'input'; patch: Partial<SpaceInput> }
  | { type: 'analysis'; analysis: AnalysisState }
  | { type: 'result'; plan: GardenPlan; result: GardenResult }
  | { type: 'open'; state: Pick<State, 'photo' | 'input' | 'plan' | 'result' | 'currentId'> }
  | { type: 'reset' }

export const DEFAULT_INPUT: SpaceInput = {
  spaceType: 'balcony',
  light: 'part',
  size: 'S',
  hasPets: false,
  beginner: true,
  facing: null,
}

const INITIAL: State = {
  photo: null,
  input: DEFAULT_INPUT,
  analysis: { status: 'idle' },
  plan: null,
  result: null,
  currentId: null,
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'restore':
      return a.state
    case 'photo':
      return {
        ...state,
        photo: a.photo,
        analysis: { status: 'idle' },
        plan: null,
        result: null,
        currentId: newId(),
      }
    case 'input':
      return { ...state, input: { ...state.input, ...a.patch } }
    case 'analysis': {
      const next = { ...state, analysis: a.analysis }
      if (a.analysis.status === 'done' && a.analysis.analysis.isOutdoorSpace) {
        const { spaceType, light, size } = a.analysis.analysis
        // A known facing gives a better sunlight estimate than the photo does.
        next.input = state.input.facing
          ? { ...state.input, spaceType, size }
          : { ...state.input, spaceType, light, size }
      }
      return next
    }
    case 'result':
      return { ...state, plan: a.plan, result: a.result }
    case 'open':
      return { ...state, ...a.state, analysis: { status: 'idle' } }
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
  /** Latitude used for sun-hour estimates. */
  lat: number
  generating: boolean
  setPhoto: (photo: PreparedImage) => void
  setInput: (patch: Partial<SpaceInput>) => void
  generate: (variant?: number) => Promise<boolean>
  /** Load a garden from "สวนของฉัน" as the current one. */
  openSaved: (id: string) => Promise<boolean>
  reset: () => void
}

const GardenContext = createContext<GardenContextValue | null>(null)

export function GardenProvider({
  aiEnabled,
  lat: latProp,
  children,
}: {
  aiEnabled: boolean
  lat: number | null
  children: ReactNode
}) {
  const lat = latProp ?? DEFAULT_LAT
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
          // The photo may change the space type; re-derive sunlight from the known facing.
          const facing = stateRef.current.input.facing
          if (r.ok && r.analysis.isOutdoorSpace && facing) {
            dispatch({ type: 'input', patch: { light: estimateSun(r.analysis.spaceType, facing, lat).light } })
          }
        })
        .catch(() => {
          if (stateRef.current.photo?.dataUrl !== photo.dataUrl) return
          dispatch({ type: 'analysis', analysis: { status: 'error', code: 'failed' } })
        })
    },
    [aiEnabled, lat],
  )

  const setInput = useCallback(
    (patch: Partial<SpaceInput>) => {
      const next = { ...stateRef.current.input, ...patch }
      // Choosing a facing (or a space type with a facing set) sets sunlight from the sun path.
      if (('facing' in patch || 'spaceType' in patch) && next.facing && !('light' in patch)) {
        patch = { ...patch, light: estimateSun(next.spaceType, next.facing, lat).light }
      }
      dispatch({ type: 'input', patch })
    },
    [lat],
  )

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
        void saveToMyGardens(stateRef.current.currentId, input, plan, photo, result)
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

  const openSaved = useCallback(async (id: string) => {
    try {
      const g = await getGarden(id)
      if (!g) return false
      dispatch({
        type: 'open',
        state: { photo: g.photo, input: { ...DEFAULT_INPUT, ...g.input }, plan: g.plan, result: g.result, currentId: g.id },
      })
      return true
    } catch {
      return false
    }
  }, [])

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const value = useMemo(
    () => ({ ...state, hydrated, aiEnabled, lat, generating, setPhoto, setInput, generate, openSaved, reset }),
    [state, hydrated, aiEnabled, lat, generating, setPhoto, setInput, generate, openSaved, reset],
  )

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>
}

/** Save (or update) this photo's garden in "สวนของฉัน". Never throws. */
async function saveToMyGardens(
  id: string | null,
  input: SpaceInput,
  plan: GardenPlan,
  photo: PreparedImage,
  result: GardenResult,
) {
  try {
    const now = Date.now()
    const existing = id ? await getGarden(id) : null
    await saveGarden({
      id: id ?? newId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      input,
      plan,
      photo,
      result,
      thumb: await makeThumb(result.image),
    })
  } catch (err) {
    // Private browsing or storage full: the garden still works, it just isn't kept.
    console.warn('Could not save garden', err)
  }
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
  quota: 'เครดิตบริการ AI หมดแล้ว จึงแสดงภาพจำลองแบบง่ายแทน',
  blocked: 'AI ไม่สามารถแก้ไขภาพนี้ได้ ลองใช้ภาพพื้นที่อื่นที่ไม่มีบุคคลในภาพ',
  'no-image': 'AI ไม่ได้ส่งภาพกลับมา ลองกด “ลองแบบอื่น” อีกครั้ง',
  'bad-input': 'รูปภาพไม่ถูกต้อง ลองเลือกรูปใหม่',
  failed: 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI จึงแสดงภาพจำลองแบบง่ายแทน',
}
