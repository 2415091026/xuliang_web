<script setup>
import { markRaw, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import HeroPanel from "./components/HeroPanel.vue";
import PhotosPanel from "./components/PhotosPanel.vue";
import StoryPanel from "./components/StoryPanel.vue";
import TracksPanel from "./components/TracksPanel.vue";

gsap.registerPlugin(Observer);

const root = ref(null);
const activeIndex = ref(0);
const mountedPanelIndexes = ref([0]);

const panels = [
  {
    label: "徐良",
    background:
      "radial-gradient(circle at 16% 18%, rgba(255,79,63,0.42), transparent 34vw), radial-gradient(circle at 82% 22%, rgba(99,215,231,0.34), transparent 30vw), linear-gradient(135deg, #08090d 0%, #26131d 48%, #07323b 100%)",
    component: markRaw(HeroPanel)
  },
  // {
  //   label: "精选作品集",
  //   background:
  //     "radial-gradient(circle at 76% 18%, rgba(242,184,75,0.42), transparent 30vw), radial-gradient(circle at 14% 78%, rgba(255,122,168,0.28), transparent 32vw), linear-gradient(135deg, #140d11 0%, #33200c 46%, #101114 100%)",
  //   component: markRaw(TracksPanel)
  // },
  // {
  //   label: "关于徐良",
  //   background:
  //     "radial-gradient(circle at 20% 24%, rgba(162,214,111,0.34), transparent 28vw), radial-gradient(circle at 78% 20%, rgba(255,79,63,0.24), transparent 30vw), linear-gradient(135deg, #101114 0%, #172112 46%, #08090d 100%)",
  //   component: markRaw(StoryPanel)
  // },
  {
    label: "照片集",
    background:
      "radial-gradient(circle at 18% 20%, rgba(99,215,231,0.42), transparent 30vw), radial-gradient(circle at 86% 76%, rgba(162,214,111,0.3), transparent 32vw), linear-gradient(135deg, #07161b 0%, #132333 52%, #08090d 100%)",
    component: markRaw(PhotosPanel)
  }
];

let context;
let observer;
let transitionToPanel;
let releasedToFooter = false;
let preloadHandle = 0;
let preloadUsesIdleCallback = false;

const isPanelMounted = (index) => mountedPanelIndexes.value.includes(index);

const ensurePanelMounted = async (index) => {
  if (index < 0 || index >= panels.length || isPanelMounted(index)) return;

  mountedPanelIndexes.value = [...mountedPanelIndexes.value, index];
  await nextTick();
};

const waitForRenderFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const clearPanelPreload = () => {
  if (!preloadHandle) return;

  if (preloadUsesIdleCallback && "cancelIdleCallback" in window) {
    window.cancelIdleCallback(preloadHandle);
  } else {
    window.clearTimeout(preloadHandle);
  }

  preloadHandle = 0;
};

const schedulePanelPreload = (index) => {
  if (index < 0 || index >= panels.length || isPanelMounted(index)) return;

  clearPanelPreload();

  const preloadPanel = () => {
    preloadHandle = 0;
    ensurePanelMounted(index);
  };

  if ("requestIdleCallback" in window) {
    preloadUsesIdleCallback = true;
    preloadHandle = window.requestIdleCallback(preloadPanel, { timeout: 900 });
    return;
  }

  preloadUsesIdleCallback = false;
  preloadHandle = window.setTimeout(preloadPanel, 240);
};

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
    const wrappers = [...outerWrappers, ...innerWrappers];
    const lastIndex = panelElements.length - 1;
    let currentIndex = 0;
    let animating = false;
    const getPanelContent = (index) => panelElements[index]?.querySelector(".panel-content") ?? null;
    const getPanelVisual = (index) => panelElements[index]?.querySelector(".panel-visual") ?? null;

    gsap.set(panelElements, { autoAlpha: 0, zIndex: 0 });
    gsap.set(panelElements[0], { autoAlpha: 1, zIndex: 1 });
    gsap.set(wrappers, { yPercent: 0, force3D: true });
    gsap.set(getPanelContent(0), { autoAlpha: 1, y: 0 });
    gsap.set(getPanelVisual(0), { autoAlpha: 1, scale: 1, y: 0 });

    transitionToPanel = async (index, direction = 1) => {
      const nextIndex = gsap.utils.clamp(0, lastIndex, index);

      if (animating || nextIndex === currentIndex) return;

      releasedToFooter = false;
      lockPanelScroll();
      animating = true;
      await ensurePanelMounted(nextIndex);
      await waitForRenderFrame();

      if (!root.value) {
        animating = false;
        return;
      }

      const currentPanel = panelElements[currentIndex];
      const nextPanel = panelElements[nextIndex];
      const currentOuter = outerWrappers[currentIndex];
      const currentInner = innerWrappers[currentIndex];
      const nextOuter = outerWrappers[nextIndex];
      const nextInner = innerWrappers[nextIndex];
      const currentContent = getPanelContent(currentIndex);
      const nextContent = getPanelContent(nextIndex);
      const currentVisual = getPanelVisual(currentIndex);
      const nextVisual = getPanelVisual(nextIndex);
      const currentVisualIsLight = currentVisual?.dataset.lightVisual === "true";
      const nextVisualIsLight = nextVisual?.dataset.lightVisual === "true";
      const y = direction > 0 ? 1 : -1;
      activeIndex.value = nextIndex;

      if (!currentPanel || !nextPanel || !currentOuter || !currentInner || !nextOuter || !nextInner) {
        currentIndex = nextIndex;
        animating = false;
        return;
      }

      const timeline = gsap.timeline({
        defaults: { duration: 0.82, ease: "power3.inOut", overwrite: "auto" },
        onComplete: () => {
          gsap.set(currentPanel, { autoAlpha: 0, zIndex: 0 });
          gsap.set(nextPanel, { zIndex: 1 });
          currentIndex = nextIndex;
          animating = false;
          schedulePanelPreload(currentIndex + 1);
        }
      });

      timeline
        .set(nextPanel, { autoAlpha: 1, zIndex: 2 }, 0)
        .fromTo(nextOuter, { yPercent: 100 * y }, { yPercent: 0 }, 0)
        .fromTo(nextInner, { yPercent: -100 * y }, { yPercent: 0 }, 0)
        .to(currentOuter, { yPercent: -100 * y }, 0)
        .to(currentInner, { yPercent: 100 * y }, 0);

      if (currentContent) {
        timeline.to(currentContent, { autoAlpha: 0, y: -72 * y, duration: 0.42, ease: "power3.in" }, 0);
      }

      if (currentVisual) {
        timeline.to(
          currentVisual,
          {
            autoAlpha: 0,
            scale: currentVisualIsLight ? 1 : 0.92,
            y: (currentVisualIsLight ? -14 : -34) * y,
            duration: currentVisualIsLight ? 0.34 : 0.48,
            ease: "power3.in"
          },
          0
        );
      }

      if (nextContent) {
        timeline.fromTo(nextContent, { autoAlpha: 0, y: 72 * y }, { autoAlpha: 1, y: 0, duration: 0.58, ease: "power3.out" }, 0.18);
      }

      if (nextVisual) {
        timeline.fromTo(
          nextVisual,
          {
            autoAlpha: nextVisualIsLight ? 0.74 : 0.35,
            scale: nextVisualIsLight ? 1 : 1.08,
            y: (nextVisualIsLight ? 16 : 38) * y,
            rotate: nextVisualIsLight ? 0 : -3 * y
          },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            rotate: 0,
            duration: nextVisualIsLight ? 0.48 : 0.72,
            ease: "power3.out"
          },
          0.12
        );
      }
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

  schedulePanelPreload(1);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("scroll", handleWindowScroll, { passive: true });
});

onBeforeUnmount(() => {
  clearPanelPreload();
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
      <div class="loop-outer absolute inset-0 overflow-hidden will-change-transform">
        <div class="loop-inner absolute inset-0 overflow-hidden will-change-transform" :style="{ background: panel.background }">
          <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,234,0.055),rgba(8,9,13,0)_34%,rgba(8,9,13,0.26)_100%)]"></div>

          <component v-if="isPanelMounted(index)" :is="panel.component" />
        </div>
      </div>
    </article>

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
