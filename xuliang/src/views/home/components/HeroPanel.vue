<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { getRandomMusicListApi } from "../../../api/music.js";
import heroBg from "../../../assets/images/09.jpg";

const musicList = ref([]);
const audioPlayer = ref(null);
const currentIndex = ref(0);
const isPlaying = ref(false);
const audioDuration = ref(0);

const currentTrack = computed(() => musicList.value[currentIndex.value] ?? null);

const formatTime = (value) => {
  if (typeof value === "string" && value.trim()) return value;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "--:--";

  const seconds = numericValue > 1000 ? Math.round(numericValue / 1000) : Math.round(numericValue);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = String(seconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
};

const currentDuration = computed(() => formatTime(currentTrack.value?.durationMs || audioDuration.value || currentTrack.value?.duration));

const getRandomMusicList = async () => {
  try {
    const response = await getRandomMusicListApi();
    musicList.value = Array.isArray(response.data) ? response.data : [];
    currentIndex.value = 0;
  } catch (error) {
    console.error("获取随机音乐列表失败:", error);
  }
};

const playCurrentTrack = async () => {
  if (!currentTrack.value?.audioUrl || !audioPlayer.value) return;

  await nextTick();

  try {
    await audioPlayer.value.play();
    isPlaying.value = true;
  } catch (error) {
    console.error("播放音乐失败:", error);
  }
};

const playMusic = async (index) => {
  if (index < 0 || index >= musicList.value.length) return;

  currentIndex.value = index;
  audioDuration.value = 0;
  await playCurrentTrack();
};

const togglePlay = () => {
  if (!currentTrack.value?.audioUrl || !audioPlayer.value) return;

  if (isPlaying.value) {
    audioPlayer.value.pause();
    return;
  }

  playMusic(currentIndex.value);
};

const playPrevious = () => {
  if (!musicList.value.length) return;

  playMusic((currentIndex.value - 1 + musicList.value.length) % musicList.value.length);
};

const playNext = () => {
  if (!musicList.value.length) return;

  playMusic((currentIndex.value + 1) % musicList.value.length);
};

const handleLoadedMetadata = () => {
  audioDuration.value = audioPlayer.value?.duration || 0;
};

onBeforeUnmount(() => {
  audioPlayer.value?.pause();
});

const bars = [34, 58, 42, 74, 50, 82, 39, 64, 47, 71, 36, 86, 44, 62, 53, 78, 41, 68, 49, 76, 57, 84];

onMounted(() => {
  getRandomMusicList();
});
</script>

<template>
  <div class="panel-content absolute inset-0 z-10 overflow-hidden bg-[#050609] will-change-transform">
    <audio ref="audioPlayer" :src="currentTrack?.audioUrl" preload="metadata" @loadedmetadata="handleLoadedMetadata" @play="isPlaying = true" @pause="isPlaying = false" @ended="playNext"></audio>
    <img class="absolute inset-0 h-full w-full scale-105 object-cover object-center opacity-35 blur-sm" :src="heroBg" alt="" aria-hidden="true" />
    <img class="absolute inset-0 h-full w-full object-cover object-[center_34%]" :src="heroBg" alt="徐良演唱现场" />
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,52,52,0.34),transparent_28vw),radial-gradient(circle_at_82%_22%,rgba(16,169,221,0.34),transparent_30vw),linear-gradient(90deg,rgba(8,9,13,0.86)_0%,rgba(8,9,13,0.38)_44%,rgba(8,9,13,0.86)_100%),linear-gradient(180deg,rgba(8,9,13,0.12)_0%,rgba(8,9,13,0.92)_100%)]"
    ></div>
    <div class="pointer-events-none absolute inset-x-[7vw] top-[92px] h-px bg-white/10 max-[620px]:inset-x-5 max-[620px]:top-[92px]"></div>

    <div
      class="relative z-10 mx-auto grid h-full w-full max-w-[1280px] grid-cols-[minmax(0,1fr)_360px] items-center gap-12 px-8 pb-20 pt-32 max-[980px]:grid-cols-1 max-[980px]:content-center max-[980px]:gap-8 max-[620px]:px-[18px] max-[620px]:pb-14 max-[620px]:pt-28"
    >
      <section class="max-w-[650px] -translate-y-50">
        <h1 class="relative m-0 font-serif text-[clamp(76px,13vw,172px)] font-black leading-[0.82] text-[#fff8ea]">
          徐良
          <span class="absolute left-[22%] top-[140%] -rotate-6 font-cfracelyncetta text-[clamp(34px,5vw,68px)] font-light italic leading-none text-[#ff4f3f]/70"> Xu Liang </span>
        </h1>
      </section>

      <aside class="panel-visual relative min-h-[540px] will-change-transform max-[980px]:hidden">
        <div class="absolute inset-x-2 top-0 overflow-hidden rounded-lg border border-white/14 bg-white/[0.08] p-4 shadow-[0_34px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <div class="relative aspect-[1.75] overflow-hidden rounded-md bg-[#07080d]">
            <img
              v-if="currentTrack?.albumCover"
              class="h-full w-full object-cover"
              :src="currentTrack.albumCover"
              :alt="`${currentTrack.name || '歌曲'}封面`"
              loading="lazy"
              decoding="async"
            />
            <div v-else class="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_32%_28%,rgba(242,184,75,0.22),transparent_42%),linear-gradient(135deg,#07080d,#17121b)]">
              <span class="text-xs font-black uppercase tracking-[0.16em] text-[#fff8ea]/34">Album Cover</span>
            </div>
          </div>

          <div class="mt-5">
            <p class="text-xs font-black uppercase text-[#f2b84b]">Now Playing</p>
            <div class="mt-2 flex items-end justify-between gap-4">
              <h3 class="truncate text-2xl font-black leading-tight text-[#fff8ea]">{{ currentTrack?.name || "等待播放" }}</h3>
              <span class="shrink-0 text-[10px] font-black text-[#fff8ea]/45">{{ currentDuration }}</span>
            </div>
            <p class="mt-2 truncate text-[11px] font-black uppercase text-[#fff8ea]/38">{{ currentTrack?.albumName || "Random Music" }}</p>
          </div>

          <div class="mt-4 grid h-10 grid-cols-[repeat(22,minmax(0,1fr))] items-end gap-1" aria-hidden="true">
            <span
              v-for="(height, index) in bars"
              :key="`${height}-${index}`"
              class="equalizer-bar bg-gradient-to-b from-[#f2b84b] to-[#ff4f3f]"
              :class="isPlaying ? 'equalizer-bar--playing' : 'equalizer-bar--idle'"
              :style="{
                height: `${height}%`,
                '--bar-delay': `${index * -0.08}s`,
                '--bar-duration': `${0.58 + (index % 5) * 0.07}s`,
                '--bar-scale': 0.52 + (index % 4) * 0.12
              }"
            ></span>
          </div>

          <div class="mt-5 grid grid-cols-3 items-center rounded-md bg-white/[0.045] p-4">
            <button class="grid place-items-center text-xl font-black text-[#fff8ea]/46 transition hover:text-[#fff8ea] disabled:opacity-35" type="button" aria-label="上一首" :disabled="!musicList.length" @click="playPrevious">‹</button>
            <button
              class="mx-auto grid size-16 place-items-center rounded-full bg-[radial-gradient(circle_at_32%_28%,#ff9b8f,#bd3152_58%,#6a1630)] shadow-[0_16px_42px_rgba(255,79,63,0.24)]"
              type="button"
              :aria-label="isPlaying ? '暂停' : '播放'"
              :disabled="!currentTrack?.audioUrl"
              @click="togglePlay"
            >
              <span v-if="!isPlaying" class="ml-1 h-0 w-0 border-y-[10px] border-l-[15px] border-y-transparent border-l-[#fff8ea]"></span>
              <span v-else class="flex h-6 w-6 items-center justify-center gap-1.5">
                <span class="h-5 w-1.5 rounded-full bg-[#fff8ea]"></span>
                <span class="h-5 w-1.5 rounded-full bg-[#fff8ea]"></span>
              </span>
            </button>
            <button class="grid place-items-center text-xl font-black text-[#fff8ea]/46 transition hover:text-[#fff8ea] disabled:opacity-35" type="button" aria-label="下一首" :disabled="!musicList.length" @click="playNext">›</button>
          </div>

          <div class="mt-5 divide-y divide-white/8">
            <button
              v-for="(track, index) in musicList"
              :key="track.id || track.audioUrl || track.name"
              class="grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-left transition hover:bg-white/[0.035] focus-visible:bg-white/[0.035] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
              :class="currentIndex === index ? 'bg-white/[0.045]' : ''"
              type="button"
              :disabled="!track.audioUrl"
              @click="playMusic(index)"
            >
              <span class="text-xs font-black text-[#f2b84b]">0{{ index + 1 }}</span>
              <strong class="truncate text-sm font-black text-[#fff8ea]">{{ track.name }}</strong>
              <span class="text-[10px] font-black text-[#fff8ea]/34">{{ track.albumName }}</span>
            </button>
          </div>

          <a class="mt-6 flex items-center justify-center gap-2 text-xs font-black text-[#fff8ea]/46 transition hover:text-[#fff8ea]" href="#">
            查看全部作品
            <span>→</span>
          </a>
        </div>
      </aside>
    </div>

    <div class="absolute bottom-9 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 text-xs font-black text-[#fff8ea]/46 max-[620px]:hidden">
      <span class="grid h-10 w-6 place-items-start rounded-full border border-white/30 p-1">
        <span class="block h-2 w-2 rounded-full bg-[#fff8ea]"></span>
      </span>
      <span>向下探索更多</span>
    </div>
  </div>
</template>

<style scoped>
.equalizer-bar {
  transform: scaleY(0.52);
  transform-origin: bottom;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  will-change: transform;
}

.equalizer-bar--idle {
  opacity: 0.72;
}

.equalizer-bar--playing {
  animation: equalizer-pulse var(--bar-duration) ease-in-out infinite;
  animation-delay: var(--bar-delay);
  opacity: 1;
}

@keyframes equalizer-pulse {
  0%,
  100% {
    transform: scaleY(0.38);
  }

  34% {
    transform: scaleY(1);
  }

  68% {
    transform: scaleY(var(--bar-scale));
  }
}
</style>
