'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

const SRC = 'https://i.pinimg.com/originals/93/9e/92/939e9273e3d6ef4f281cda31e9e62488.gif'
const STRIPS = 40 // vertical slices — more = smoother curve

const Page = () => {
  const heroRef = useRef<HTMLElement>(null)
  const meshRef = useRef<HTMLDivElement>(null)
  const stripRefs = useRef<HTMLDivElement[]>([])
  const textRef = useRef<HTMLHeadingElement>(null)

  useGSAP(() => {
    const mesh = meshRef.current!
    const strips = stripRefs.current

    const vw = window.innerWidth
    const vh = window.innerHeight
    const rightX = vw * 0.4
    const topY = -vh * 0.39
    const bottomY = vh * 0.39

    // --- SPLIT TEXT: stagger each character of the heading in ---
    const split = SplitText.create(textRef.current, { type: 'chars,lines', mask: 'lines' })
    const colors = ['#f87171', '#facc15', '#4ade80', '#60a5fa', '#c084fc']
    gsap.set(split.chars, { color: gsap.utils.wrap(colors) })
    gsap.from(split.chars, {
      yPercent: 100,
      opacity: 0,
      filter: 'blur(6px)',
      stagger: 0.05,
      duration: 0.6,
      ease: 'back.out(1.7)',
      delay: 0.2,
    })

    // --- BUILD THE MESH: paint each strip as a vertical slice of the image ---
    const w = mesh.offsetWidth
    const h = mesh.offsetHeight
    const sw = w / STRIPS
    strips.forEach((el, i) => {
      gsap.set(el, {
        backgroundImage: `url(${SRC})`,
        backgroundSize: `${w}px ${h}px`,
        backgroundPosition: `-${i * sw}px 0px`,
        backgroundRepeat: 'no-repeat',
      })
    })

    // normalized horizontal position of each strip: -1 (left edge) .. 0 (center) .. +1 (right edge)
    const profile = strips.map((_, i) => ((i + 0.5) / STRIPS) * 2 - 1)

    // parabolic bend across the strips: 0 at center, max at both edges.
    // divide by current scale so the visual bend stays sane after the scroll zoom.
    const applyBend = (bend: number) => {
      const s = (gsap.getProperty(mesh, 'scaleX') as number) || 1
      strips.forEach((el, i) => gsap.set(el, { y: (bend * profile[i] * profile[i]) / s }))
    }

    // --- ENTRANCE: move bottom-right -> top-right -> center, bending like air friction ---
    gsap.set(mesh, { x: rightX, y: bottomY, opacity: 0 })

    let prevY = bottomY
    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onUpdate: () => {
        const cy = gsap.getProperty(mesh, 'y') as number
        const vy = cy - prevY // vertical velocity this frame
        prevY = cy
        // moving up (vy<0) -> bend>0 -> edges droop DOWN, center stays. Moving down -> edges rise.
        applyBend(gsap.utils.clamp(-60, 60, -vy * 2))
      },
    })
    tl.to(mesh, { opacity: 1, duration: 0.3 })
      .to(mesh, { y: topY, duration: 0.7 }) // straight up -> edges trail downward
      .to(mesh, { x: 0, y: 0, duration: 0.9 }) // down to center -> edges trail upward

    // --- SCROLL: grow big + bend the edges from scroll velocity ---
    const coverScale = Math.max(vw / w, vh / h)
    const proxy = { bend: 0 }
    gsap.to(mesh, {
      scale: coverScale - 0.1,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: '+=1500',
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        markers: true,
        onUpdate: (self) => {
          // scroll velocity -> bend, then spring back to flat when scrolling stops
          const bend = gsap.utils.clamp(-70, 70, self.getVelocity() / -40)
          if (Math.abs(bend) > Math.abs(proxy.bend)) {
            proxy.bend = bend
            gsap.to(proxy, {
              bend: 0,
              duration: 0.8,
              ease: 'power3',
              overwrite: true,
              onUpdate: () => applyBend(proxy.bend),
            })
          }
        },
      },
    })

    return () => split.revert()
  }, [])

  return (
    <>
      <section ref={heroRef} className='relative h-screen overflow-hidden'>
        <div className='absolute inset-0 grid place-items-center'>
          <h1 ref={textRef} className='overflow-hidden text-4xl font-bold tracking-tight'>
            GSAP GRID
          </h1>
        </div>

        {/* the mesh: an aspect-video box sliced into vertical strips */}
        <div className='absolute inset-0 grid place-items-center'>
          <div ref={meshRef} className='relative aspect-video h-40'>
            {Array.from({ length: STRIPS }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) stripRefs.current[i] = el
                }}
                className='absolute top-0 h-full will-change-transform'
                style={{ left: `${(i / STRIPS) * 100}%`, width: `${100 / STRIPS}%` }}
              />
            ))}
          </div>
        </div>
      </section>

      <div className='h-screen w-full' />
    </>
  )
}

export default Page
