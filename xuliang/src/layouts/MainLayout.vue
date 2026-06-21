<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const progress = ref(0);
const route = useRoute();

const navLinks = [
  { to: "/", label: "首页" },
  { to: "/music", label: "音乐" },
  { to: "/photos", label: "照片集" },
  { to: "/about", label: "关于" }
];

const navLinkClass = (isExactActive) => [
  "relative overflow-hidden rounded-full border px-3.5 py-2.5 text-[13px] font-black backdrop-blur-2xl transition duration-200 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04)_42%,rgba(255,255,255,0.1)_100%)] before:opacity-0 before:transition-opacity before:duration-200 focus-visible:outline-none",
  isExactActive
    ? "border-white/30 bg-white/[0.075] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.52),inset_0_-10px_22px_rgba(255,255,255,0.055),inset_0_0_18px_rgba(255,255,255,0.05),0_10px_26px_rgba(0,0,0,0.22),0_0_24px_rgba(242,184,75,0.1)] before:opacity-100"
    : "border-transparent text-[#fff8ea]/62 hover:border-white/18 hover:bg-white/[0.045] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-8px_18px_rgba(255,255,255,0.035)] hover:before:opacity-50 focus-visible:border-white/18 focus-visible:bg-white/[0.045] focus-visible:text-white focus-visible:before:opacity-50"
];

const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.value = Math.max(0, Math.min(1, ratio));
};

onMounted(() => {
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateProgress);
  window.removeEventListener("resize", updateProgress);
});
</script>

<template>
  <div
    class="min-h-svh overflow-x-hidden bg-[#08090d] text-[#fff8ea] [background:radial-gradient(circle_at_12%_8%,rgba(255,79,63,0.24),transparent_34vw),radial-gradient(circle_at_78%_12%,rgba(99,215,231,0.18),transparent_30vw),linear-gradient(180deg,#08090d_0%,#101018_42%,#08090d_100%)] [font-family:'Avenir_Next','PingFang_SC','Microsoft_YaHei',sans-serif]"
  >
    <div
      v-if="route.name !== 'home'"
      class="fixed left-0 top-0 z-[80] h-[3px] w-full origin-left bg-gradient-to-r from-[#ff4f3f] via-[#f2b84b] to-[#63d7e7]"
      :style="{ transform: `scaleX(${progress})` }"
    ></div>

    <header v-if="route.name !== 'home'" class="relative z-[70]">
      <nav
        class="fixed left-1/2 top-[18px] isolate grid min-h-16 w-[min(1180px,calc(100%_-_28px))] -translate-x-1/2 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[18px] overflow-hidden rounded-full border border-white/16 bg-white/[0.022] py-2 pl-4 pr-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.46),inset_0_-18px_38px_rgba(255,255,255,0.03),inset_0_0_26px_rgba(255,255,255,0.035),0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-[46px] backdrop-brightness-125 backdrop-saturate-200 max-[920px]:grid-cols-[1fr_auto] max-[920px]:rounded-3xl max-[620px]:w-[min(calc(100%_-_20px),1180px)] max-[620px]:pl-3"
        aria-label="主导航"
      >
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(110deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.045)_28%,rgba(255,255,255,0.008)_52%,rgba(255,255,255,0.08)_100%)]"
        ></span>
        <span aria-hidden="true" class="pointer-events-none absolute -left-16 -top-20 z-0 h-36 w-96 rotate-[-16deg] rounded-full bg-white/10 blur-2xl"></span>
        <span aria-hidden="true" class="pointer-events-none absolute right-24 top-1 z-0 h-12 w-64 rounded-full bg-[#63d7e7]/10 blur-xl"></span>
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-[1px] z-0 rounded-[inherit] border border-white/8 shadow-[inset_0_0_22px_rgba(255,255,255,0.075),inset_0_-12px_26px_rgba(255,255,255,0.035)]"
        ></span>
        <span aria-hidden="true" class="pointer-events-none absolute left-8 right-8 top-0 z-0 h-px bg-white/45"></span>
        <RouterLink class="relative z-10 flex min-w-[136px] items-center gap-[11px] max-[620px]:min-w-0" to="/" aria-label="首页">
          <span
            class="grid size-[38px] place-items-center rounded-full border border-white/30 bg-white/[0.075] text-xs font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.52),inset_0_-8px_14px_rgba(255,255,255,0.055),0_8px_24px_rgba(255,79,63,0.16)] backdrop-blur-2xl"
          >
            XL
          </span>
          <span class="grid gap-0.5">
            <strong class="font-serif text-[22px] leading-none">徐良</strong>
            <span class="text-[10px] font-black text-[#fff8ea]/45 max-[620px]:hidden"> OFFICIAL SITE </span>
          </span>
        </RouterLink>

        <div class="relative z-10 flex justify-center gap-1 max-[920px]:hidden">
          <RouterLink v-for="item in navLinks" :key="item.to" v-slot="{ href, navigate, isExactActive }" custom :to="item.to">
            <a :href="href" :aria-current="isExactActive ? 'page' : undefined" :class="navLinkClass(isExactActive)" @click="navigate">
              {{ item.label }}
            </a>
          </RouterLink>
        </div>

        <RouterLink
          class="relative z-10 inline-flex min-h-[42px] items-center justify-center overflow-hidden rounded-full border border-white/24 bg-white/[0.07] px-4 text-[13px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.48),inset_0_-10px_22px_rgba(255,255,255,0.055),0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition duration-200 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.035)_45%,rgba(242,184,75,0.1))] hover:-translate-y-0.5 hover:border-white/36 hover:bg-white/[0.11] focus-visible:-translate-y-0.5 focus-visible:border-white/36 focus-visible:bg-white/[0.11] focus-visible:outline-none max-[620px]:px-3"
          to="/login"
        >
          <span class="relative z-10">登陆</span>
        </RouterLink>
      </nav>
    </header>

    <main :class="route.name === 'home' ? 'min-h-svh' : 'min-h-svh pt-24 max-[620px]:pt-[90px]'">
      <RouterView />
    </main>

    <footer class="bg-[#050609] px-[max(24px,calc((100vw_-_1180px)/2))] pb-8 pt-20 max-[620px]:px-[18px]">
      <div class="grid items-end gap-9 min-[921px]:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p class="mb-3 text-xs font-black uppercase text-[#f2b84b]">Keep Listening</p>
          <h2 class="m-0 font-serif text-[clamp(40px,6vw,84px)] font-black leading-[0.96] text-[#fff8ea]">继续听他的歌</h2>
          <p class="mt-[18px] max-w-[640px] text-base leading-8 text-[#fff8ea]/70">这里承接音乐平台、社交入口和版权信息。</p>
        </div>

        <div class="flex flex-wrap gap-2.5 min-[921px]:justify-end">
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >微博</a
          >
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >抖音</a
          >
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >B站</a
          >
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >网易云</a
          >
          <a
            class="rounded-full border border-white/15 px-3.5 py-2.5 text-[13px] font-black text-[#fff8ea]/70 transition hover:border-[#f2b84b]/50 hover:text-[#fff8ea] focus-visible:border-[#f2b84b]/50 focus-visible:text-[#fff8ea] focus-visible:outline-none"
            href="#"
            >QQ音乐</a
          >
        </div>
      </div>
    </footer>
  </div>
</template>
