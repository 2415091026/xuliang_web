<script setup>
import heroBg from "../../../assets/images/09.jpg";
import image02 from "../../../assets/images/02.jpg";
import image03 from "../../../assets/images/03.jpg";
import image04 from "../../../assets/images/04.jpg";

const panel = {
  eyebrow: "Music Library",
  title: "精选作品集",
  subtitle: "Songs",
  description: "把代表作整理成动听的入口，让首页第一眼就能听见他的创作线索。",
  accent: "#f2b84b"
};

const panelNumber = "02";
const totalPanels = "04";

const thumbnails = [
  { src: image02, alt: "徐良演唱现场" },
  { src: image03, alt: "徐良舞台现场" },
  { src: image04, alt: "徐良音乐现场" }
];

const waveform = [38, 54, 32, 72, 44, 88, 36, 66, 48, 78, 40, 92, 50, 70, 34, 84, 46, 62];

const tracks = [
  {
    number: "01",
    title: "客官不可以",
    category: "Pop Memory",
    duration: "03:42",
    active: true,
    bars: [38, 62, 44, 76, 48, 86, 40, 70, 52, 92, 46, 78, 56, 84, 42, 68, 50, 74]
  },
  {
    number: "02",
    title: "犯贱",
    category: "Collaboration",
    duration: "04:06",
    active: false,
    bars: [24, 38, 28, 46, 32, 54, 26, 42, 30, 50, 22, 44, 34, 48, 26, 40, 30, 36]
  },
  {
    number: "03",
    title: "后会无期",
    category: "Acoustic",
    duration: "03:58",
    active: false,
    bars: [20, 30, 24, 38, 28, 44, 22, 36, 26, 42, 24, 40, 30, 46, 22, 34, 28, 38]
  }
];
</script>

<template>
  <div class="panel-content tracks-panel relative z-10 h-full w-full overflow-hidden will-change-transform">
    <img
      class="tracks-bg-photo pointer-events-none absolute inset-y-0 right-[-5%] h-full w-[76%] object-cover object-[58%_24%] opacity-[0.4] mix-blend-luminosity brightness-[0.62] contrast-[1.16] saturate-[0.72] max-[900px]:right-0 max-[900px]:w-full max-[900px]:opacity-[0.18]"
      :src="heroBg"
      alt=""
      aria-hidden="true"
    />
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,13,0.96)_0%,rgba(22,12,18,0.84)_36%,rgba(10,8,11,0.56)_58%,rgba(6,6,8,0.9)_100%)]"></div>
    <div class="pointer-events-none absolute inset-y-0 left-[36%] w-[30%] bg-[linear-gradient(90deg,transparent,rgba(10,8,13,0.24)_48%,transparent)]"></div>
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_77%_4%,rgba(242,184,75,0.42),transparent_25vw),radial-gradient(circle_at_9%_70%,rgba(207,42,71,0.36),transparent_23vw)]"></div>
    <div class="pointer-events-none absolute inset-x-[6%] bottom-[31%] h-24 opacity-[0.26] max-[760px]:hidden" aria-hidden="true">
      <div class="flex h-full items-center gap-1">
        <span
          v-for="(height, index) in waveform"
          :key="`${height}-${index}`"
          class="w-px rounded-full bg-[#f2b84b]/45"
          :style="{ height: `${height}%` }"
        ></span>
      </div>
    </div>

    <div class="relative z-10 mx-auto grid h-full w-[min(1280px,calc(100%_-_64px))] grid-cols-[minmax(420px,0.92fr)_minmax(420px,0.78fr)] items-center gap-10 pb-14 pt-32 max-[980px]:w-[min(760px,calc(100%_-_48px))] max-[980px]:grid-cols-1 max-[980px]:content-center max-[980px]:gap-8 max-[620px]:w-[calc(100%_-_32px)] max-[620px]:pb-10 max-[620px]:pt-24">
      <section class="min-w-0">
        <p class="mb-4 text-[11px] font-black uppercase text-[#fff8ea]/62">
          {{ panelNumber }} / {{ totalPanels }}
        </p>
        <p class="mb-5 text-xs font-black uppercase" :style="{ color: panel.accent }">
          {{ panel.eyebrow }}
        </p>

        <h1 class="m-0 font-serif text-[clamp(58px,8.9vw,116px)] font-black leading-[0.86] text-[#fff8ea] drop-shadow-[0_12px_30px_rgba(0,0,0,0.34)] max-[620px]:text-[clamp(46px,18vw,74px)]">
          {{ panel.title }}
          <span class="-mt-2 ml-[42%] block font-cfracelyncetta text-[clamp(34px,5vw,58px)] font-light italic leading-none text-[#d38a18] max-[620px]:ml-[28%]">
            {{ panel.subtitle }}
          </span>
        </h1>

        <p class="mt-8 max-w-[360px] text-sm leading-8 text-[#fff8ea]/72 max-[620px]:mt-6 max-[620px]:leading-7">
          {{ panel.description }}
        </p>

        <button
          class="mt-8 inline-flex h-12 items-center gap-3 rounded-full border border-[#ff4f66]/55 bg-[#ff4f66]/12 px-3.5 pr-5 text-sm font-black text-[#fff8ea] shadow-[0_16px_42px_rgba(255,79,102,0.16),inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:border-[#ff6a78]/80 hover:bg-[#ff4f66]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
          type="button"
        >
          <span class="grid size-7 place-items-center rounded-full border border-[#fff8ea]/46 bg-black/22">
            <span class="ml-0.5 h-0 w-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-[#fff8ea]"></span>
          </span>
          随机播放全部
        </button>

        <div class="mt-16 flex gap-3 max-[980px]:mt-9 max-[620px]:grid max-[620px]:grid-cols-3">
          <figure
            v-for="photo in thumbnails"
            :key="photo.src"
            class="h-[104px] w-[120px] overflow-hidden rounded-lg border border-white/8 bg-white/5 shadow-[0_20px_42px_rgba(0,0,0,0.22)] max-[620px]:h-auto max-[620px]:w-full max-[620px]:aspect-[1.15]"
          >
            <img class="h-full w-full object-cover" :src="photo.src" :alt="photo.alt" loading="lazy" decoding="async" />
          </figure>
        </div>
      </section>

      <section class="panel-visual relative min-h-[430px] will-change-transform max-[980px]:min-h-0">
        <p class="pointer-events-none absolute -right-20 bottom-2 select-none text-[100px] font-black uppercase leading-[0.9] text-[#fff8ea]/[0.035] max-[1100px]:hidden" aria-hidden="true">
          XU<br />LIANG
        </p>

        <div class="relative z-10 ml-auto grid w-[min(440px,100%)] translate-y-12 gap-3 max-[980px]:ml-0 max-[980px]:w-full max-[980px]:max-w-[560px] max-[980px]:translate-y-0">
          <article
            v-for="track in tracks"
            :key="track.number"
            class="group grid min-h-[94px] grid-cols-[minmax(0,1fr)_104px_40px] items-center gap-4 rounded-lg border px-6 py-4 shadow-[0_22px_58px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[3px] transition max-[620px]:grid-cols-[minmax(0,1fr)_38px] max-[620px]:px-5 max-[620px]:py-4"
            :class="track.active ? 'border-[#ff4f66]/70 bg-[linear-gradient(100deg,rgba(44,24,23,0.58),rgba(44,24,23,0.22)_62%,rgba(44,24,23,0.06))]' : 'border-white/12 bg-[linear-gradient(100deg,rgba(16,14,16,0.36),rgba(16,14,16,0.14)_64%,rgba(16,14,16,0.03))] hover:border-[#f2b84b]/42'"
          >
            <div class="min-w-0">
              <p class="text-sm font-black" :class="track.active ? 'text-[#ff566d]' : 'text-[#f2b84b]'">
                {{ track.number }}
              </p>
              <h2 class="mt-2 truncate text-lg font-black text-[#fff8ea] max-[620px]:text-lg">
                {{ track.title }}
              </h2>
              <p class="mt-2 text-[11px] font-semibold uppercase text-[#fff8ea]/54">
                {{ track.category }}
                <span class="mx-2 text-[#f2b84b]/80">·</span>
                {{ track.duration }}
              </p>
            </div>

            <div class="flex h-9 items-end gap-1 opacity-80 max-[620px]:hidden" aria-hidden="true">
              <span
                v-for="(height, index) in track.bars"
                :key="`${track.number}-${index}`"
                class="w-0.5 rounded-full"
                :class="track.active ? 'bg-gradient-to-t from-[#ff4f66] to-[#f2b84b]' : 'bg-[#fff8ea]/12 group-hover:bg-[#f2b84b]/32'"
                :style="{ height: `${height}%` }"
              ></span>
            </div>

            <button
              class="grid size-9 place-items-center rounded-full border bg-black/8 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ea]/70"
              :class="track.active ? 'border-[#ff566d] text-[#ff566d]' : 'border-[#f2b84b]/66 text-[#f2b84b]'"
              type="button"
              :aria-label="`播放 ${track.title}`"
            >
              <span class="ml-0.5 h-0 w-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-current"></span>
            </button>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tracks-bg-photo {
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 16%, #000 88%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 16%, #000 88%, transparent 100%);
}

@media (max-width: 900px) {
  .tracks-bg-photo {
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
    mask-image: linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
  }
}
</style>
