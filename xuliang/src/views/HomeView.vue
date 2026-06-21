<script setup>
import { markRaw, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import HeroPanel from "../components/home/HeroPanel.vue";
import PhotosPanel from "../components/home/PhotosPanel.vue";
import StoryPanel from "../components/home/StoryPanel.vue";
import TracksPanel from "../components/home/TracksPanel.vue";

gsap.registerPlugin(Observer);

const root = ref(null);
const activeIndex = ref(0);

const panels = [
  {
    label: "徐良",
    background:
      "radial-gradient(circle at 16% 18%, rgba(255,79,63,0.42), transparent 34vw), radial-gradient(circle at 82% 22%, rgba(99,215,231,0.34), transparent 30vw), linear-gradient(135deg, #08090d 0%, #26131d 48%, #07323b 100%)",
    component: markRaw(HeroPanel)
  },
  {
    label: "精选作品集",
    background:
      "radial-gradient(circle at 76% 18%, rgba(242,184,75,0.42), transparent 30vw), radial-gradient(circle at 14% 78%, rgba(255,122,168,0.28), transparent 32vw), linear-gradient(135deg, #140d11 0%, #33200c 46%, #101114 100%)",
    component: markRaw(TracksPanel)
  },
  {
    label: "照片集",
    background:
      "radial-gradient(circle at 18% 20%, rgba(99,215,231,0.42), transparent 30vw), radial-gradient(circle at 86% 76%, rgba(162,214,111,0.3), transparent 32vw), linear-gradient(135deg, #07161b 0%, #132333 52%, #08090d 100%)",
    component: markRaw(PhotosPanel)
  },
  {
    label: "关于徐良",
    background:
      "radial-gradient(circle at 20% 24%, rgba(162,214,111,0.34), transparent 28vw), radial-gradient(circle at 78% 20%, rgba(255,79,63,0.24), transparent 30vw), linear-gradient(135deg, #101114 0%, #172112 46%, #08090d 100%)",
    component: markRaw(StoryPanel)
  }
];

const navItems = [
  { label: "首页", panelIndex: 0 },
  { label: "音乐", panelIndex: 1 },
  { label: "影像", panelIndex: 2 },
  { label: "关于", panelIndex: 3 }
];

let context;
let observer;
let transitionToPanel;
let releasedToFooter = false;

const getPanelTop = () => {
  if (!root.value) return 0;

  return root.value.getBoundingClientRect().top + window.scrollY;
};

const lockPanelScroll = () => {
  if (!root.value || releasedToFooter) return;

  const panelTop = getPanelTop();
  if (Math.abs(window.scrollY - panelTop) > 1) {
    window.scrollTo({ top: panelTop, left: 0, behavior: "auto" });
  }
};

const scrollPastPanels = () => {
  if (!root.value) return;

  releasedToFooter = true;
  const nextTop = getPanelTop() + root.value.offsetHeight;
  window.scrollTo({ top: nextTop, left: 0, behavior: "smooth" });
};

const handleWindowScroll = () => {
  if (!releasedToFooter) {
    lockPanelScroll();
    return;
  }

  if (window.scrollY <= getPanelTop() + 1) {
    releasedToFooter = false;
  }
};

const selectPanel = (index) => {
  const direction = index > activeIndex.value ? 1 : -1;
  transitionToPanel?.(index, direction);
};

const handleKeydown = (event) => {
  if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();

    if (activeIndex.value === panels.length - 1) {
      scrollPastPanels();
    } else {
      transitionToPanel?.(activeIndex.value + 1, 1);
    }
  }

  if (event.key === "ArrowUp" || event.key === "PageUp") {
    event.preventDefault();
    transitionToPanel?.(activeIndex.value - 1, -1);
  }
};

onMounted(async () => {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  await nextTick();

  context = gsap.context(() => {
    const panelElements = gsap.utils.toArray(".loop-panel", root.value);
    const outerWrappers = gsap.utils.toArray(".loop-outer", root.value);
    const innerWrappers = gsap.utils.toArray(".loop-inner", root.value);
    const contents = gsap.utils.toArray(".panel-content", root.value);
    const visuals = gsap.utils.toArray(".panel-visual", root.value);
    const wrappers = [...outerWrappers, ...innerWrappers];
    const lastIndex = panelElements.length - 1;
    let currentIndex = 0;
    let animating = false;

    gsap.set(panelElements, { autoAlpha: 0, zIndex: 0 });
    gsap.set(panelElements[0], { autoAlpha: 1, zIndex: 1 });
    gsap.set(wrappers, { yPercent: 0 });
    gsap.set(contents, { autoAlpha: 0, y: 48 });
    gsap.set(visuals, { autoAlpha: 0, scale: 0.96, y: 22 });
    gsap.set(contents[0], { autoAlpha: 1, y: 0 });
    gsap.set(visuals[0], { autoAlpha: 1, scale: 1, y: 0 });

    transitionToPanel = (index, direction = 1) => {
      const nextIndex = gsap.utils.clamp(0, lastIndex, index);

      if (animating || nextIndex === currentIndex) return;

      releasedToFooter = false;
      lockPanelScroll();
      animating = true;
      activeIndex.value = nextIndex;

      const currentPanel = panelElements[currentIndex];
      const nextPanel = panelElements[nextIndex];
      const currentOuter = outerWrappers[currentIndex];
      const currentInner = innerWrappers[currentIndex];
      const nextOuter = outerWrappers[nextIndex];
      const nextInner = innerWrappers[nextIndex];
      const currentContent = contents[currentIndex];
      const nextContent = contents[nextIndex];
      const currentVisual = visuals[currentIndex];
      const nextVisual = visuals[nextIndex];
      const currentVisualIsLight = currentVisual?.dataset.lightVisual === "true";
      const nextVisualIsLight = nextVisual?.dataset.lightVisual === "true";
      const y = direction > 0 ? 1 : -1;

      gsap
        .timeline({
          defaults: { duration: 1, ease: "power4.inOut" },
          onComplete: () => {
            gsap.set(currentPanel, { autoAlpha: 0, zIndex: 0 });
            gsap.set(nextPanel, { zIndex: 1 });
            currentIndex = nextIndex;
            animating = false;
          }
        })
        .set(nextPanel, { autoAlpha: 1, zIndex: 2 }, 0)
        .fromTo(nextOuter, { yPercent: 100 * y }, { yPercent: 0 }, 0)
        .fromTo(nextInner, { yPercent: -100 * y }, { yPercent: 0 }, 0)
        .to(currentOuter, { yPercent: -100 * y }, 0)
        .to(currentInner, { yPercent: 100 * y }, 0)
        .to(currentContent, { autoAlpha: 0, y: -72 * y, duration: 0.5, ease: "power3.in" }, 0)
        .to(
          currentVisual,
          {
            autoAlpha: 0,
            scale: currentVisualIsLight ? 1 : 0.92,
            y: (currentVisualIsLight ? -14 : -34) * y,
            duration: currentVisualIsLight ? 0.38 : 0.58,
            ease: "power3.in"
          },
          0
        )
        .fromTo(nextContent, { autoAlpha: 0, y: 82 * y }, { autoAlpha: 1, y: 0, duration: 0.72, ease: "power3.out" }, 0.24)
        .fromTo(
          nextVisual,
          {
            autoAlpha: nextVisualIsLight ? 0.74 : 0.35,
            scale: nextVisualIsLight ? 1 : 1.12,
            y: (nextVisualIsLight ? 16 : 44) * y,
            rotate: nextVisualIsLight ? 0 : -3 * y
          },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            rotate: 0,
            duration: nextVisualIsLight ? 0.52 : 0.95,
            ease: "power3.out"
          },
          0.12
        );
    };

    observer = Observer.create({
      target: root.value,
      type: "wheel,touch,pointer",
      wheelSpeed: -1,
      tolerance: 16,
      preventDefault: true,
      onUp: () => {
        if (currentIndex === lastIndex) {
          scrollPastPanels();
          return;
        }

        transitionToPanel(currentIndex + 1, 1);
      },
      onDown: () => transitionToPanel(currentIndex - 1, -1)
    });
  }, root);

  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("scroll", handleWindowScroll, { passive: true });
});

onBeforeUnmount(() => {
  observer?.kill();
  context?.revert();
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("scroll", handleWindowScroll);
  transitionToPanel = undefined;
});
</script>

<template>
  <section ref="root" class="relative h-[100dvh] min-h-screen overflow-hidden bg-[#08090d] text-[#fff8ea]">
    <article v-for="(panel, index) in panels" :key="panel.label" class="loop-panel invisible absolute inset-0 overflow-hidden" :aria-hidden="activeIndex !== index">
      <div class="loop-outer absolute inset-0 overflow-hidden">
        <div class="loop-inner absolute inset-0 overflow-hidden" :style="{ background: panel.background }">
          <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,234,0.055),rgba(8,9,13,0)_34%,rgba(8,9,13,0.26)_100%)]"></div>

          <component :is="panel.component" />
        </div>
      </div>
    </article>

    <nav
      class="absolute left-1/2 top-7 z-40 grid h-12 w-[min(1280px,calc(100%_-_64px))] -translate-x-1/2 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-8 max-[760px]:w-[calc(100%_-_32px)] max-[760px]:gap-4"
      aria-label="首页导航"
    >
      <button class="group flex items-center gap-3 text-left focus-visible:outline-none" type="button" aria-label="回到首页" @click="selectPanel(0)">
        <span class="grid size-10 place-items-center rounded-full bg-[linear-gradient(135deg,#d77475,#8b3e5a)] text-xs font-black text-white shadow-[0_12px_28px_rgba(183,72,91,0.22)]">XL</span>
        <span class="grid gap-0.5">
          <strong class="text-[17px] font-black leading-none tracking-wide text-[#fff8ea] transition group-hover:text-white">徐良</strong>
          <span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#fff8ea]/58">Official Site</span>
        </span>
      </button>

      <div class="flex items-center justify-center gap-9 max-[760px]:hidden">
        <button
          v-for="item in navItems"
          :key="item.label"
          class="relative h-10 px-1 text-sm font-black text-[#fff8ea]/68 transition hover:text-[#fff8ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
          :class="item.panelIndex === 0 ? 'text-[#fff8ea]' : ''"
          type="button"
          :aria-current="item.panelIndex === 0 ? 'page' : undefined"
          @click="selectPanel(item.panelIndex)"
        >
          {{ item.label }}
          <span
            class="absolute bottom-0 left-1/2 h-px w-5 -translate-x-1/2 bg-[#f2b84b] transition"
            :class="item.panelIndex === 0 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'"
          ></span>
        </button>
      </div>

      <button
        class="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/38 px-4 text-sm font-black text-[#fff8ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-[#f2b84b]/46 hover:bg-black/48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
        type="button"
        @click="selectPanel(1)"
      >
        开始听
        <span class="grid size-4 place-items-center rounded-full bg-[#fff8ea] text-[#111]">
          <span class="ml-0.5 h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-current"></span>
        </span>
      </button>
    </nav>

    <div
      class="absolute right-6 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/15 bg-white/[0.035] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl max-[620px]:right-3"
    >
      <button
        v-for="(panel, index) in panels"
        :key="panel.label"
        class="h-2 w-2 rounded-full bg-[#fff8ea] opacity-45 transition-[height,opacity,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
        :class="activeIndex === index ? 'h-7 opacity-100' : 'hover:opacity-75'"
        :aria-label="`切换到${panel.label}`"
        :aria-current="activeIndex === index ? 'step' : undefined"
        type="button"
        @click="selectPanel(index)"
      ></button>
    </div>
  </section>
</template>
