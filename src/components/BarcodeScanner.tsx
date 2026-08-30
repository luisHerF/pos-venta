import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'

type Props = {
  onScan: (code: string) => void
  autoFocus?: boolean
}

/**
 * Captura códigos de barras de DOS formas, optimizado para velocidad:
 * 1. Lector físico USB/Bluetooth: estos dispositivos "escriben" el código como si
 *    fuera un teclado, muy rápido y terminan con Enter. Basta un input siempre
 *    enfocado que detecta ráfagas de teclas + Enter.
 * 2. Cámara del celular/laptop: para cuando no hay lector físico, usando ZXing.
 */
export default function BarcodeScanner({ onScan, autoFocus = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [buffer, setBuffer] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const code = buffer.trim()
      if (code.length > 0) {
        onScan(code)
        setBuffer('')
      }
      e.preventDefault()
    }
  }

  async function openCamera() {
    setCameraOpen(true)
    setTimeout(async () => {
      try {
        const reader = new BrowserMultiFormatReader()
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (result) {
              onScan(result.getText())
              closeCamera()
            }
          }
        )
        controlsRef.current = controls
      } catch (err) {
        console.error('No se pudo abrir la cámara', err)
        setCameraOpen(false)
      }
    }, 50)
  }

  function closeCamera() {
    controlsRef.current?.stop()
    controlsRef.current = null
    setCameraOpen(false)
    inputRef.current?.focus()
  }

  useEffect(() => () => controlsRef.current?.stop(), [])

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={buffer}
          onChange={(e) => setBuffer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escanea o escribe el código de barras..."
          className="input flex-1"
          autoComplete="off"
        />
        <button type="button" onClick={openCamera} className="btn-secondary" title="Escanear con cámara">
          📷
        </button>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <video ref={videoRef} className="w-full max-w-md rounded-xl" muted />
          <p className="text-white text-sm mt-3">Apunta la cámara al código de barras</p>
          <button onClick={closeCamera} className="btn-secondary mt-4">Cerrar cámara</button>
        </div>
      )}
    </div>
  )
}
