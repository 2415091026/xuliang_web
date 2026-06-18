<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import heroImg from '../assets/hero.png'

gsap.registerPlugin(ScrollTrigger)

const root = ref(null)
let context
let activePanel = -1

const setActiveDot = (dots, index) => {
  if (activePanel === index) return

  activePanel = index
  dots.forEach((dot, dotIndex) => {
    gsap.to(dot, {
      height: dotIndex === index ? 28 : 8,
      opacity: dotIndex === index ? 1 : 0.42,
      scale: dotIndex === index ? 1 : 0.92,
      duration: 0.24,
      ease: 'power2.out',
      overwrite: true,
    })
  })
}

onMounted(async () => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  await nextTick()

  context = gsap.context(() => {
    const stage = root.value.querySelector('.flip-stage')
    const panels = gsap.utils.toArray('.flip-panel', root.value)
    const dots = gsap.utils.toArray('.page-dot', root.value)
    const panelContent = gsap.utils.toArray('.panel-content', root.value)

    activePanel = -1

    gsap.set(panels, {
      autoAlpha: 0,
      force3D: true,
      rotateX: -26,
      scale: 0.86,
      transformOrigin: '50% 58%',
      transformPerspective: 1400,
      yPercent: 112,
    })

    gsap.set(panels[0], {
      autoAlpha: 1,
      rotateX: 0,
      scale: 1,
      yPercent: 0,
    })

    gsap.set(panelContent, { autoAlpha: 0, y: 34 })
    gsap.set(panelContent[0], { autoAlpha: 1, y: 0 })

    setActiveDot(dots, 0)

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: () => `+=${window.innerHeight * (panels.length - 1)}`,
        scrub: 0.35,
        pin: stage,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: {
          snapTo: 1 / (panels.length - 1),
          delay: 0.04,
          duration: { min: 0.12, max: 0.28 },
          ease: 'power1.out',
          inertia: false,
        },
        onUpdate: (self) => {
          const index = Math.round(self.progress * (panels.length - 1))
          setActiveDot(dots, index)
        },
      },
    })

    panels.forEach((panel, index) => {
      if (index === 0) return

      const previousPanel = panels[index - 1]
      const previousContent = panelContent[index - 1]
      const content = panelContent[index]
      const position = index - 1

      timeline
        .to(
          previousContent,
          {
            autoAlpha: 0,
            y: -28,
            duration: 0.34,
          },
          position,
        )
        .to(
          previousPanel,
          {
            autoAlpha: 0,
            rotateX: 22,
            scale: 0.88,
            yPercent: -68,
            duration: 0.9,
          },
          position,
        )
        .to(
          panel,
          {
            autoAlpha: 1,
            rotateX: 0,
            scale: 1,
            yPercent: 0,
            duration: 0.9,
          },
          position + 0.08,
        )
        .to(
          content,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.54,
          },
          position + 0.38,
        )
    })

    ScrollTrigger.refresh()
  }, root)
})

onBeforeUnmount(() => {
  context?.revert()
})
</script>

<template>
  <section ref="root" class="relative overflow-hidden">
    <div class="flip-stage relative h-svh min-h-[700px] overflow-hidden bg-[#08090d] [perspective:1400px] max-[620px]:min-h-[680px]">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,79,63,0.24),transparent_30vw),radial-gradient(circle_at_82%_20%,rgba(99,215,231,0.2),transparent_28vw),linear-gradient(180deg,rgba(255,248,234,0.04),rgba(8,9,13,0))]"></div>
      <div class="pointer-events-none absolute inset-x-8 top-24 h-px bg-white/15"></div>

      <article class="flip-panel visible absolute inset-0 grid transform-gpu place-items-center px-6 pb-16 pt-32 opacity-100 will-change-transform [backface-visibility:hidden] [transform-style:preserve-3d] max-[620px]:px-[18px] max-[620px]:pb-12 max-[620px]:pt-28">
        <div class="panel-content mx-auto grid w-full max-w-[1180px] transform-gpu grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] items-center gap-16 will-change-transform max-[920px]:grid-cols-1">
          <div>
            <div class="mb-7 flex flex-wrap gap-2.5 text-xs font-black text-[#fff8ea]/70">
              <span class="rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 backdrop-blur-xl">Music</span>
              <span class="rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 backdrop-blur-xl">Photos</span>
              <span class="rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 backdrop-blur-xl">Story</span>
            </div>

            <h1 class="m-0 font-serif text-[clamp(76px,12vw,170px)] font-black leading-[0.82] text-[#fff8ea]">
              徐良
              <span class="mt-3 block font-sans text-[clamp(34px,5vw,74px)] text-transparent [-webkit-text-stroke:1px_rgba(255,248,234,0.78)]">
                Official
              </span>
            </h1>

            <p class="mt-8 max-w-[660px] text-[clamp(17px,2vw,21px)] leading-[1.9] text-[#fff8ea]/70">
              一个围绕音乐、照片集和个人故事展开的官方网站。向下滚动，像翻开一张张唱片内页一样进入不同内容。
            </p>
          </div>

          <div class="relative min-h-[560px] max-[920px]:min-h-[430px]">
            <div class="absolute inset-x-0 top-0 bottom-20 overflow-hidden rounded-[42%_58%_40%_60%/50%_38%_62%_50%] border border-white/15 bg-[linear-gradient(180deg,transparent_0_52%,rgba(8,9,13,0.76)_86%),radial-gradient(circle_at_50%_22%,rgba(255,248,234,0.2),transparent_35%),linear-gradient(135deg,rgba(255,79,63,0.72),rgba(99,215,231,0.35)_48%,rgba(242,184,75,0.54))] shadow-[0_34px_90px_rgba(0,0,0,0.34)]">
              <img class="mx-auto h-full max-h-[520px] w-auto object-contain object-center opacity-95" :src="heroImg" alt="徐良视觉图" />
            </div>
            <div class="absolute bottom-0 left-8 right-0 rounded-lg border border-white/15 bg-white/[0.045] p-[22px] shadow-[0_34px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl max-[620px]:left-0">
              <p class="text-xs font-black uppercase text-[#f2b84b]">Now Playing</p>
              <h2 class="mt-2 text-xl font-black text-[#fff8ea]">青春旋律 Demo</h2>
              <div class="mt-5 grid h-14 grid-cols-[repeat(24,minmax(0,1fr))] items-end gap-1.5" aria-hidden="true">
                <span v-for="height in [38,66,42,82,54,92,48,74,60,34,88,46,68,52,96,40,72,58,84,44,76,50,90,62]" :key="height" class="rounded-full bg-gradient-to-b from-[#f2b84b] to-[#ff4f3f]" :style="{ height: `${height}%` }"></span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article class="flip-panel invisible absolute inset-0 grid transform-gpu place-items-center px-6 pb-16 pt-32 opacity-0 will-change-transform [backface-visibility:hidden] [transform-style:preserve-3d] max-[620px]:px-[18px] max-[620px]:pb-12 max-[620px]:pt-28">
        <div class="panel-content mx-auto grid w-full max-w-[1180px] transform-gpu grid-cols-[360px_minmax(0,1fr)] items-stretch gap-6 will-change-transform max-[920px]:grid-cols-1">
          <aside class="rounded-lg border border-white/15 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div class="grid min-h-[330px] place-items-center rounded-md bg-[radial-gradient(circle_at_34%_28%,rgba(255,248,234,0.2),transparent_26%),linear-gradient(135deg,#ff4f3f,#2d1c38_48%,#63d7e7)] font-serif text-5xl font-black text-[#fff8ea] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]">
              XL
            </div>
            <p class="mt-5 text-xs font-black uppercase text-[#f2b84b]">Music Library</p>
            <h2 class="mt-2 text-2xl font-black text-[#fff8ea]">精选作品集</h2>
          </aside>

          <div class="grid gap-3">
            <div class="rounded-lg border border-white/15 bg-white/[0.055] p-5 backdrop-blur-2xl transition hover:-translate-x-1 hover:border-[#f2b84b]/45">
              <p class="text-xs font-black text-[#f2b84b]">01</p>
              <h3 class="mt-2 text-2xl font-black text-[#fff8ea]">客官不可以</h3>
              <p class="mt-1 text-sm text-[#fff8ea]/45">Single / Pop Memory / 03:42</p>
            </div>
            <div class="rounded-lg border border-white/15 bg-white/[0.055] p-5 backdrop-blur-2xl transition hover:-translate-x-1 hover:border-[#f2b84b]/45">
              <p class="text-xs font-black text-[#f2b84b]">02</p>
              <h3 class="mt-2 text-2xl font-black text-[#fff8ea]">犯贱</h3>
              <p class="mt-1 text-sm text-[#fff8ea]/45">Single / Collaboration / 04:06</p>
            </div>
            <div class="rounded-lg border border-white/15 bg-white/[0.055] p-5 backdrop-blur-2xl transition hover:-translate-x-1 hover:border-[#f2b84b]/45">
              <p class="text-xs font-black text-[#f2b84b]">03</p>
              <h3 class="mt-2 text-2xl font-black text-[#fff8ea]">后会无期</h3>
              <p class="mt-1 text-sm text-[#fff8ea]/45">Single / Acoustic / 03:58</p>
            </div>
          </div>
        </div>
      </article>

      <article class="flip-panel invisible absolute inset-0 grid transform-gpu place-items-center px-6 pb-16 pt-32 opacity-0 will-change-transform [backface-visibility:hidden] [transform-style:preserve-3d] max-[620px]:px-[18px] max-[620px]:pb-12 max-[620px]:pt-28">
        <div class="panel-content mx-auto w-full max-w-[1180px] transform-gpu will-change-transform">
          <p class="text-xs font-black uppercase text-[#f2b84b]">Photo Archive</p>
          <h2 class="mt-3 max-w-3xl font-serif text-[clamp(42px,7vw,92px)] font-black leading-[0.95] text-[#fff8ea]">
            照片集要有记忆点
          </h2>
          <div class="mt-10 grid grid-cols-3 gap-4 max-[920px]:grid-cols-2 max-[620px]:grid-cols-1">
            <article class="min-h-[280px] rounded-lg border border-white/15 bg-[linear-gradient(180deg,transparent_44%,rgba(8,9,13,0.82)),linear-gradient(135deg,rgba(255,79,63,0.78),rgba(99,215,231,0.46))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <p class="text-xs font-black text-[#fff8ea]/70">LIVE / 01</p>
            </article>
            <article class="min-h-[280px] rounded-lg border border-white/15 bg-[linear-gradient(180deg,transparent_44%,rgba(8,9,13,0.82)),linear-gradient(135deg,rgba(242,184,75,0.72),rgba(255,122,168,0.52))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <p class="text-xs font-black text-[#fff8ea]/70">BACKSTAGE / 02</p>
            </article>
            <article class="min-h-[280px] rounded-lg border border-white/15 bg-[linear-gradient(180deg,transparent_44%,rgba(8,9,13,0.82)),linear-gradient(135deg,rgba(99,215,231,0.68),rgba(162,214,111,0.46))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <p class="text-xs font-black text-[#fff8ea]/70">PORTRAIT / 03</p>
            </article>
          </div>
        </div>
      </article>

      <article class="flip-panel invisible absolute inset-0 grid transform-gpu place-items-center px-6 pb-16 pt-32 opacity-0 will-change-transform [backface-visibility:hidden] [transform-style:preserve-3d] max-[620px]:px-[18px] max-[620px]:pb-12 max-[620px]:pt-28">
        <div class="panel-content mx-auto grid w-full max-w-[1180px] transform-gpu grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 will-change-transform max-[920px]:grid-cols-1">
          <section class="rounded-lg border border-white/15 bg-white/[0.055] p-7 backdrop-blur-2xl">
            <p class="text-xs font-black uppercase text-[#f2b84b]">About</p>
            <h2 class="mt-3 font-serif text-[clamp(42px,6vw,82px)] font-black leading-[0.96] text-[#fff8ea]">
              关于徐良
            </h2>
            <p class="mt-5 text-base leading-8 text-[#fff8ea]/70">
              关于页不必写成长篇百科，更适合把代表作品、创作阶段和演出节点整理成一条可阅读的故事线。
            </p>
          </section>

          <div class="grid gap-3">
            <article class="grid grid-cols-[110px_1fr] gap-5 rounded-lg border border-white/15 bg-white/[0.055] p-5 backdrop-blur-2xl max-[620px]:grid-cols-1">
              <strong class="text-xl font-black text-[#f2b84b]">2010</strong>
              <span class="leading-8 text-[#fff8ea]/70">代表作品进入大众视野，形成鲜明的网络音乐记忆点。</span>
            </article>
            <article class="grid grid-cols-[110px_1fr] gap-5 rounded-lg border border-white/15 bg-white/[0.055] p-5 backdrop-blur-2xl max-[620px]:grid-cols-1">
              <strong class="text-xl font-black text-[#f2b84b]">2011-2016</strong>
              <span class="leading-8 text-[#fff8ea]/70">作品库扩展，合作、专辑和创作风格逐渐沉稳。</span>
            </article>
            <article class="grid grid-cols-[110px_1fr] gap-5 rounded-lg border border-white/15 bg-white/[0.055] p-5 backdrop-blur-2xl max-[620px]:grid-cols-1">
              <strong class="text-xl font-black text-[#f2b84b]">Now</strong>
              <span class="leading-8 text-[#fff8ea]/70">围绕新歌、现场、影像和粉丝互动，形成更完整的个人官网内容体系。</span>
            </article>
          </div>
        </div>
      </article>

      <div class="pointer-events-none fixed left-6 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/15 bg-white/[0.035] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl max-[620px]:left-3">
        <span
          v-for="index in 4"
          :key="index"
          class="page-dot block h-2 w-2 rounded-full bg-gradient-to-b from-[#fff8ea] to-[#f2b84b] opacity-40 shadow-[0_0_14px_rgba(242,184,75,0.18)]"
        ></span>
      </div>

      <div class="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 text-xs font-black uppercase text-[#fff8ea]/45">
        <span>Scroll</span>
        <span class="h-px w-10 bg-[#fff8ea]/30"></span>
        <span>Flip</span>
      </div>
    </div>
  </section>
</template>
