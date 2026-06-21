<script setup>
import storyBg from "../../../assets/images/07.jpg";
import image05 from "../../../assets/images/05.jpg";
import image06 from "../../../assets/images/06.jpg";
import image08 from "../../../assets/images/08.jpg";

const panel = {
  eyebrow: "About",
  title: "关于徐良",
  subtitle: "About",
  description: "用时间线承载作品、阶段和现场信息，让个人官网从作品入口延展到完整叙事。",
  accent: "#92d85b"
};

const panelNumber = "03";
const totalPanels = "04";

const stats = [
  { icon: "♪", value: "2010", label: "音乐起点" },
  { icon: "☆", value: "30+", label: "音乐作品" },
  { icon: "♬", value: "200+", label: "现场演出" },
  { icon: "∞", value: "∞", label: "陪伴与支持" }
];

const timelineItems = [
  {
    year: "2010",
    title: "代表作进入大众视野",
    text: "凭借原创作品开始受到关注，音乐风格逐渐被更多人认可。",
    image: image08
  },
  {
    year: "2011-2016",
    title: "作品扩展与沉淀",
    text: "不断尝试不同风格，与更多音乐人合作，作品影响力持续提升。",
    image: image05
  },
  {
    year: "Now",
    title: "多元发展与全新阶段",
    text: "持续创作，探索更多可能，在音乐、现场与影像中不断突破。",
    image: image06
  }
];
</script>

<template>
  <div class="panel-content story-panel relative z-10 h-full w-full overflow-hidden will-change-transform">
    <img
      class="story-bg-photo pointer-events-none absolute inset-y-0 left-[8%] h-full w-[72%] object-cover object-[45%_44%] opacity-[0.34] mix-blend-luminosity brightness-[0.54] contrast-[1.18] saturate-[0.72] hue-rotate-[58deg] max-[980px]:left-0 max-[980px]:w-full max-[980px]:opacity-[0.22]"
      :src="storyBg"
      alt=""
      aria-hidden="true"
    />
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_34%_22%,rgba(146,216,91,0.22),transparent_28vw),radial-gradient(circle_at_8%_72%,rgba(146,216,91,0.18),transparent_24vw),linear-gradient(90deg,rgba(4,12,14,0.94)_0%,rgba(9,17,14,0.64)_40%,rgba(6,11,10,0.76)_70%,rgba(4,8,10,0.94)_100%)]"></div>
    <div class="pointer-events-none absolute inset-y-0 left-[56%] w-[30%] bg-[linear-gradient(90deg,transparent,rgba(4,8,10,0.28)_46%,transparent)]"></div>
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,234,0.03)_0%,rgba(4,8,10,0.16)_45%,rgba(4,8,10,0.82)_100%)]"></div>
    <p class="pointer-events-none absolute left-[3%] top-[15%] select-none font-cfracelyncetta text-[clamp(108px,18vw,260px)] italic leading-none text-[#92d85b]/10 max-[760px]:hidden" aria-hidden="true">
      Xu Liang
    </p>

    <div class="relative z-10 mx-auto grid h-full w-[min(1280px,calc(100%_-_64px))] grid-cols-[minmax(430px,0.92fr)_minmax(470px,0.86fr)] items-center gap-12 pb-12 pt-32 max-[980px]:w-[min(760px,calc(100%_-_48px))] max-[980px]:grid-cols-1 max-[980px]:content-center max-[980px]:gap-8 max-[620px]:w-[calc(100%_-_32px)] max-[620px]:pb-9 max-[620px]:pt-24">
      <section class="min-w-0">
        <p class="mb-4 text-[11px] font-black uppercase text-[#92d85b]">
          {{ panelNumber }} / {{ totalPanels }}
        </p>

        <h1 class="m-0 font-serif text-[clamp(66px,8.7vw,124px)] font-black leading-[0.86] text-[#fff8ea] drop-shadow-[0_16px_36px_rgba(0,0,0,0.42)] max-[620px]:text-[clamp(48px,18vw,76px)]">
          {{ panel.title }}
          <span class="-mt-2 block font-cfracelyncetta text-[clamp(36px,5vw,62px)] font-light italic leading-none text-[#92d85b]">
            {{ panel.subtitle }}
          </span>
        </h1>

        <p class="mt-8 max-w-[420px] text-base leading-8 text-[#fff8ea]/72 max-[620px]:mt-6 max-[620px]:text-sm max-[620px]:leading-7">
          {{ panel.description }}
        </p>

        <button
          class="mt-9 inline-flex h-12 items-center gap-3 rounded-full border border-[#92d85b]/46 bg-[#92d85b]/8 px-3.5 pr-5 text-sm font-black text-[#fff8ea] shadow-[0_18px_42px_rgba(146,216,91,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:border-[#92d85b]/70 hover:bg-[#92d85b]/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
          type="button"
        >
          <span class="grid size-7 place-items-center rounded-full border border-[#92d85b]/70 bg-black/20 text-[#fff8ea]">
            <span class="ml-0.5 h-0 w-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-current"></span>
          </span>
          观看介绍视频
        </button>

        <div class="mt-16 grid max-w-[520px] grid-cols-4 gap-0 divide-x divide-white/10 max-[620px]:mt-10 max-[620px]:grid-cols-2 max-[620px]:gap-y-6 max-[620px]:divide-x-0">
          <article v-for="item in stats" :key="item.label" class="px-5 first:pl-0 max-[620px]:px-0">
            <p class="text-2xl font-black leading-none text-[#92d85b]">{{ item.icon }}</p>
            <strong class="mt-4 block text-[clamp(26px,3vw,34px)] font-black leading-none text-[#fff8ea]">{{ item.value }}</strong>
            <span class="mt-3 block text-sm font-semibold text-[#fff8ea]/58">{{ item.label }}</span>
          </article>
        </div>
      </section>

      <section class="panel-visual relative min-h-[560px] will-change-transform max-[980px]:min-h-0">
        <div class="absolute bottom-[22%] left-0 top-[18%] w-px bg-gradient-to-b from-transparent via-[#92d85b]/34 to-transparent max-[980px]:hidden" aria-hidden="true"></div>
        <div class="relative z-10 ml-8 grid gap-4 max-[980px]:ml-0">
          <article
            v-for="item in timelineItems"
            :key="item.year"
            class="group relative grid min-h-[132px] grid-cols-[120px_minmax(0,1fr)_112px] items-center gap-5 rounded-lg border border-white/11 bg-[linear-gradient(100deg,rgba(30,42,33,0.68),rgba(23,31,27,0.42)_62%,rgba(16,22,20,0.2))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-[6px] transition hover:border-[#92d85b]/44 max-[620px]:grid-cols-[1fr_92px] max-[620px]:gap-4 max-[620px]:p-4"
          >
            <span class="absolute -left-[37px] top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#92d85b] shadow-[0_0_18px_rgba(146,216,91,0.72)] max-[980px]:hidden"></span>
            <strong class="text-[clamp(24px,3vw,32px)] font-black leading-none text-[#92d85b] max-[620px]:col-span-2">{{ item.year }}</strong>
            <div class="min-w-0">
              <h2 class="text-lg font-black text-[#fff8ea]">{{ item.title }}</h2>
              <p class="mt-3 text-sm font-semibold leading-7 text-[#fff8ea]/58">{{ item.text }}</p>
            </div>
            <figure class="aspect-[1.14] overflow-hidden rounded-md border border-[#92d85b]/18 bg-black/24">
              <img class="h-full w-full object-cover brightness-[0.82] contrast-[1.1] saturate-[0.72] group-hover:brightness-100" :src="item.image" :alt="item.title" loading="lazy" decoding="async" />
            </figure>
          </article>
        </div>

        <blockquote class="ml-8 mt-12 max-w-[520px] text-[#fff8ea]/68 max-[980px]:ml-0 max-[620px]:mt-8">
          <span class="block text-7xl font-black leading-none text-[#92d85b]/42">“</span>
          <p class="-mt-5 text-base font-semibold leading-8">
            音乐是记录生活的方式，也是与世界对话的桥梁。感谢每一次相遇，让这些作品和现场变得完整。
          </p>
          <cite class="mt-5 block text-right font-cfracelyncetta text-3xl italic text-[#92d85b]/68">- Xu Liang</cite>
        </blockquote>
      </section>
    </div>
  </div>
</template>

<style scoped>
.story-bg-photo {
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 14%, #000 72%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 14%, #000 72%, transparent 100%);
}

@media (max-width: 980px) {
  .story-bg-photo {
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
    mask-image: linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
  }
}
</style>
