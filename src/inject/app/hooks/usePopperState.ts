import {
  MutableRefObject,
  Dispatch,
  SetStateAction,
  MouseEvent,
  useRef,
  useState,
  useEffect,
} from 'react'
import { AppContextType } from '../AppContext'


export type PopperState = {
  anchorRef: MutableRefObject<any>
  popperRef: MutableRefObject<any>
  anchorEl: HTMLElement
  setAnchorEl: Dispatch<SetStateAction<HTMLElement>>
  isOpen: boolean
  close: () => void
  open: () => void
  handleToggleButtonClick: (e: MouseEvent<HTMLElement>) => void
  handleRefreshButtonClick: () => Promise<void>
  isRefreshing: boolean
  fieldType: string
}

function isInRect(
  x: number,
  y: number,
  rects: DOMRect[],
  margin: number = 0
): boolean {
  return rects.some((rect) => {
    return (
      rect &&
      x >= rect.left - margin &&
      x <= rect.right + margin &&
      y >= rect.top - margin &&
      y <= rect.bottom + margin
    )
  })
}

export const usePopperState = ({init, backend}: Pick<AppContextType, "init" | "backend">): PopperState => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const anchorRef = useRef(null)
  const popperRef = useRef(null)
  const isOpen = Boolean(anchorEl)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  
  const handleRefreshButtonClick = async () => {
    setIsRefreshing(true)
    await init()
    setIsRefreshing(false)
  }

  const close = () => {
    setAnchorEl(null)
  }

  const open = () => {
    setAnchorEl(anchorRef.current)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleClickAway = (e: Event) => {
      const mouseEvent = e as globalThis.MouseEvent
      const { clientX: x, clientY: y } = mouseEvent
      const rects = [
        popperRef.current?.getBoundingClientRect(),
        anchorRef.current?.getBoundingClientRect(),
      ]
      const isInModal = () => mouseEvent.composedPath().some((el) => {
        return (el as HTMLElement)?.classList?.contains("MuiModal-root")
      })
      const isInside = isInRect(x, y, rects) || backend.clickIsInFormfield(mouseEvent as any) || isInModal()
      if (!isInside) {
        close()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }

    // Use setTimeout to prevent the opening click from triggering close immediately
    const timeoutId = setTimeout(() => {
      document.addEventListener('keyup', handleEscape)
      document.addEventListener('click', handleClickAway)
    }, 10)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('keyup', handleEscape)
      document.removeEventListener('click', handleClickAway)
    }
  }, [isOpen, backend])

  const handleToggleButtonClick = (e: MouseEvent<HTMLElement>) => {
    if (!isOpen) {
      open()
    } else if (e.currentTarget.contains(e.target as Node)) {
      close()
    }
  }

  return {
    anchorEl,
    popperRef,
    setAnchorEl,
    anchorRef,
    isOpen,
    open,
    close,
    handleToggleButtonClick,
    handleRefreshButtonClick,
    isRefreshing,
    fieldType: backend.fieldType
  }
}
