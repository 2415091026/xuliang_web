<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import image01 from '../../../assets/images/01.jpg'
import image02 from '../../../assets/images/02.jpg'
import image03 from '../../../assets/images/03.jpg'
import image04 from '../../../assets/images/04.jpg'
import image05 from '../../../assets/images/05.jpg'
import image06 from '../../../assets/images/06.jpg'
import image07 from '../../../assets/images/07.jpg'
import image08 from '../../../assets/images/08.jpg'

gsap.registerPlugin(Flip)

const panelRoot = ref(null)
const gallery = ref(null)

const photos = [
  { id: '01', src: image01 },
  { id: '02', src: image02 },
  { id: '03', src: image03 },
  { id: '04', src: image04 },
  { id: '05', src: image05 },
  { id: '06', src: image06 },
  { id: '07', src: image07 },
  { id: '08', src: image08 },
]

let context
let flipContext
let scrubTimeline
let progress = 0
let targetProgress = 0
let scrubFrame = 0
let resizeTimer
let isDragging = false
let startY = 0
let startProgress = 0

const setProgress = (value) => {
  progress = gsap.utils.clamp(0, 1, value)
  targetProgress = progress
  scrubTimeline?.progress(progress)
}

const renderScrub = () => {
  progress += (targetProgress - progress) * 0.28

  if (Math.abs(targetProgress - progress) < 0.001) {
    setProgress(targetProgress)
    scrubFrame = 0
    return
  }

  scrubTimeline?.progress(progress)
  scrubFrame = requestAnimationFrame(renderScrub)
}

const scrubTo = (value) => {
  targetProgress = gsap.utils.clamp(0, 1, value)

  if (!scrubFrame) {
    scrubFrame = requestAnimationFrame(renderScrub)
  }
}

const createFlipTween = () => {
  const galleryElement = gallery.value
  if (!galleryElement) return

  const items = gsap.utils.toArray('.gallery__item', galleryElement)

  flipContext?.revert()
  galleryElement.classList.remove('gallery--final')

  flipContext = gsap.context(() => {
    galleryElement.classList.add('gallery--final')
    const flipState = Flip.getState(items)
    galleryElement.classList.remove('gallery--final')

    scrubTimeline = gsap.timeline({ paused: true })
    scrubTimeline.add(Flip.to(flipState, {
      simple: true,
      ease: 'expoScale(1, 5)',
      duration: 1,
      stagger: 0,
    }))

    setProgress(progress)

    return () => gsap.set(items, { clearProps: 'all' })
  }, galleryElement)
}

const handleWheel = (event) => {
  const delta = Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY) / 1200, 0.11)
  const isAtStart = progress <= 0.001 && delta < 0
  const isAtEnd = progress >= 0.999 && delta > 0

  if (isAtStart || isAtEnd) return

  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation?.()
  scrubTo(progress + delta)
}

const handlePointerDown = (event) => {
  isDragging = true
  startY = event.clientY
  startProgress = progress
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation?.()
  panelRoot.value?.setPointerCapture?.(event.pointerId)
}

const handlePointerMove = (event) => {
  if (!isDragging) return

  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation?.()
  setProgress(startProgress + (startY - event.clientY) / 760)
}

const handlePointerUp = (event) => {
  if (!isDragging) return

  isDragging = false
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation?.()
  panelRoot.value?.releasePointerCapture?.(event.pointerId)
}

const handleResize = () => {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(createFlipTween, 140)
}

onMounted(() => {
  context = gsap.context(() => {
    createFlipTween()
  }, gallery)

  panelRoot.value?.addEventListener('wheel', handleWheel, { passive: false })
  panelRoot.value?.addEventListener('pointerdown', handlePointerDown)
  panelRoot.value?.addEventListener('pointermove', handlePointerMove)
  panelRoot.value?.addEventListener('pointerup', handlePointerUp)
  panelRoot.value?.addEventListener('pointercancel', handlePointerUp)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.clearTimeout(resizeTimer)

  if (scrubFrame) {
    cancelAnimationFrame(scrubFrame)
  }

  panelRoot.value?.removeEventListener('wheel', handleWheel)
  panelRoot.value?.removeEventListener('pointerdown', handlePointerDown)
  panelRoot.value?.removeEventListener('pointermove', handlePointerMove)
  panelRoot.value?.removeEventListener('pointerup', handlePointerUp)
  panelRoot.value?.removeEventListener('pointercancel', handlePointerUp)
  window.removeEventListener('resize', handleResize)
  flipContext?.revert()
  context?.revert()
})
</script>

<template>
  <div ref="panelRoot" class="panel-content relative z-10 mx-auto grid h-full w-full place-items-center px-6 pb-16 pt-32 will-change-transform max-[620px]:px-[18px] max-[620px]:pb-12 max-[620px]:pt-28">
    <div class="panel-visual gallery-wrap relative h-[min(72vh,720px)] w-[min(1320px,100%)] overflow-hidden will-change-transform max-[980px]:h-[62vh] max-[620px]:h-[54vh]" data-light-visual="true">
      <div ref="gallery" class="gallery gallery--bento">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="gallery__item overflow-hidden bg-black"
        >
          <img class="h-full w-full object-cover" :src="photo.src" :alt="`照片 ${photo.id}`" loading="lazy" decoding="async" fetchpriority="low" draggable="false" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-wrap {
  contain: layout paint;
}

.gallery {
  position: relative;
  width: 100%;
  height: 100%;
  flex: none;
}

.gallery--bento {
  display: grid;
  gap: 1vh;
  grid-template-columns: repeat(3, minmax(0, 32.5%));
  grid-template-rows: repeat(4, minmax(0, 23%));
  justify-content: center;
  align-content: center;
}

.gallery--final.gallery--bento {
  gap: 1vh;
  grid-template-columns: repeat(3, 100%);
  grid-template-rows: repeat(4, 49.5%);
}

.gallery__item {
  position: relative;
  flex: none;
  min-width: 0;
  min-height: 0;
  border-radius: 0;
  transform: translateZ(0);
  will-change: transform;
}

.gallery__item:nth-child(1) {
  grid-area: 2 / 2 / 4 / 3;
  z-index: 2;
}

.gallery__item:nth-child(2) {
  grid-area: 1 / 1 / 3 / 2;
}

.gallery__item:nth-child(3) {
  grid-area: 1 / 2 / 2 / 3;
}

.gallery__item:nth-child(4) {
  grid-area: 1 / 3 / 3 / 4;
}

.gallery__item:nth-child(5) {
  grid-area: 3 / 1 / 4 / 2;
}

.gallery__item:nth-child(6) {
  grid-area: 3 / 3 / 5 / 4;
}

.gallery__item:nth-child(7) {
  grid-area: 4 / 1 / 5 / 2;
}

.gallery__item:nth-child(8) {
  grid-area: 4 / 2 / 5 / 3;
}

.gallery__item img {
  display: block;
  transform: translateZ(0);
}

@media (max-width: 620px) {
  .gallery--bento {
    gap: 0.75vh;
    grid-template-columns: repeat(3, minmax(0, 32.5%));
    grid-template-rows: repeat(4, minmax(0, 23.5%));
  }

  .gallery--final.gallery--bento {
    gap: 0.75vh;
  }
}
</style>
