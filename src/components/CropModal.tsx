'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, Check, RotateCw } from 'lucide-react'
import { motion } from 'framer-motion'
import getCroppedImg from '@/utils/cropImage'

interface CropModalProps {
  image: string
  onClose: () => void
  onConfirm: (croppedImage: string, croppedBase64: string) => void
}

interface Area {
  x: number
  y: number
  width: number
  height: number
}

export default function CropModal({ image, onClose, onConfirm }: CropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    // Seleziona tutta l'immagine di default (percentuale)
    const initialCrop: Crop = {
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    }
    setCrop(initialCrop)
    
    // Imposta anche il pixel crop per abilitare subito il tasto conferma
    setCompletedCrop({
      unit: 'px',
      x: 0,
      y: 0,
      width,
      height
    })
  }

  // Effetto per ripristinare il ritaglio pieno quando cambia la rotazione
  // (perché le dimensioni visuali dell'immagine cambiano)
  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current
      // Seleziona tutta l'immagine (percentuale)
      const fullCrop: Crop = {
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
      setCrop(fullCrop)
      
      // Imposta il pixel crop corrispondente
      // Nota: ReactCrop gestisce le coordinate relative all'elemento img,
      // che noi ruotiamo via CSS.
      setCompletedCrop({
        unit: 'px',
        x: 0,
        y: 0,
        width,
        height
      })
    }
  }, [rotation])

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return
    
    const img = imgRef.current

    // ⚠️  ReactCrop restituisce coordinate in pixel DOM (immagine scalata).
    // getCroppedImg lavora sull'immagine nelle sue dimensioni NATIVE.
    // Dobbiamo scalare le coordinate per ottenere il crop corretto.
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    const scaledCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    }

    try {
      setLoading(true)
      const cropped = await getCroppedImg(image, scaledCrop, rotation)
      onConfirm(cropped.url, cropped.base64)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="relative p-4 flex justify-between items-center bg-black/20 border-b border-white/10 z-10">
        <div className="flex-1 flex justify-start">
          <button 
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none whitespace-nowrap">
          <span className="text-white font-bold text-[15px]">Inquadra l'esercizio</span>
          <span className="text-[9px] text-white/50 uppercase tracking-widest font-medium">Trascina gli angoli per regolare</span>
        </div>

        <div className="flex-1 flex justify-end">
          <button 
            onClick={handleConfirm}
            disabled={loading || !completedCrop}
            className="bg-primary text-background px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            {loading ? '...' : <><Check size={18} /> Conferma</>}
          </button>
        </div>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
        <div 
          className="relative transition-all duration-300 ease-out"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            // Se ruotato di 90 o 270 gradi, dobbiamo assicurarci che il contenitore 
            // non superi i limiti della vista scambiando le dimensioni massime
            width: (rotation % 180 !== 0) ? 'auto' : '100%',
            height: (rotation % 180 !== 0) ? 'auto' : '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-w-full max-h-[70vh]"
            style={{ 
                // Assicura che il cropper segua l'immagine
                display: 'block'
            }}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={image}
              onLoad={onImageLoad}
              style={{
                maxWidth: (rotation % 180 !== 0) ? '70vh' : '100%',
                maxHeight: (rotation % 180 !== 0) ? '100vw' : '70vh',
              }}
              className="object-contain block"
            />
          </ReactCrop>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="p-8 bg-black/40 border-t border-white/10 flex flex-col gap-6">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setRotation((prev) => prev + 90)}
            className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 border border-white/5 shadow-xl group"
          >
            <RotateCw size={22} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="font-extrabold text-[15px]">Ruota 90°</span>
          </button>
        </div>
        
        <p className="text-center text-white/40 text-[13px] font-medium italic">
          Suggerimento: Inquadra solo il testo dell'esercizio per una spiegazione più precisa.
        </p>
      </div>
    </motion.div>
  )
}
