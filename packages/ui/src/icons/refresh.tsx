'use client'

import type { HTMLAttributes } from 'react'
import { motion, useAnimation } from 'motion/react'
import { useCallback, useImperativeHandle, useRef } from 'react'

export interface RefreshIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

function RefreshIcon({ ref, onMouseEnter, onMouseLeave, ...props }: HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<RefreshIconHandle | null> }) {
  const controls = useAnimation()
  const isControlledRef = useRef(false)

  useImperativeHandle(ref, () => {
    isControlledRef.current = true

    return {
      startAnimation: () => controls.start('animate'),
      stopAnimation: () => controls.start('normal'),
    }
  })

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlledRef.current) {
        controls.start('animate')
      }
      else {
        onMouseEnter?.(e)
      }
    },
    [controls, onMouseEnter],
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlledRef.current) {
        controls.start('normal')
      }
      else {
        onMouseLeave?.(e)
      }
    },
    [controls, onMouseLeave],
  )

  return (
    <div
      className="cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transition={{ type: 'spring', stiffness: 250, damping: 25 }}
        variants={{
          normal: {
            rotate: '0deg',
          },
          animate: {
            rotate: '-50deg',
          },
        }}
        animate={controls}
      >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
      </motion.svg>
    </div>
  )
}

RefreshIcon.displayName = 'RefreshIcon'

export { RefreshIcon }
