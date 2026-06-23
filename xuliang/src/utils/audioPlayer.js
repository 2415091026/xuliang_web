import { reactive } from "vue";

// 初始化浏览器原生 Audio 实例
const audio = new Audio();

export const audioPlayer = reactive({
  currentSong: null,
  isPlaying: false,
  playProgressSeconds: 0,
  isRandomPlay: false,
  isLoopPlay: false,
  volume: 70,
  allSongs: [], // 当前播放列表

  // 初始化事件监听
  init() {
    audio.addEventListener("timeupdate", () => {
      audioPlayer.playProgressSeconds = Math.floor(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      if (audioPlayer.isLoopPlay) {
        audio.currentTime = 0;
        audio.play().catch((err) => console.error("循环播放失败:", err));
      } else {
        audioPlayer.next();
      }
    });

    audio.addEventListener("loadedmetadata", () => {
      audio.volume = audioPlayer.volume / 100;
    });

    audio.addEventListener("play", () => {
      audioPlayer.isPlaying = true;
    });

    audio.addEventListener("pause", () => {
      audioPlayer.isPlaying = false;
    });
  },

  // 播放与暂停切换
  toggle() {
    if (!audioPlayer.currentSong) return;
    if (audioPlayer.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn("播放失败，可能由于浏览器安全策略限制，需用户主动交互:", err);
        audioPlayer.isPlaying = false;
      });
    }
  },

  // 播放特定歌曲，并同步队列
  playSong(song, songsList = []) {
    if (songsList && songsList.length > 0) {
      audioPlayer.allSongs = songsList;
    }

    if (audioPlayer.currentSong && audioPlayer.currentSong.id === song.id) {
      audioPlayer.toggle();
    } else {
      audioPlayer.currentSong = song;
      audioPlayer.playProgressSeconds = 0;
      audioPlayer.isPlaying = true;
      audio.src = song.audioUrl;
      audio.load();
      audio.play().catch((err) => {
        console.warn("自动播放失败，需用户主动交互:", err);
        audioPlayer.isPlaying = false;
      });
    }
  },

  // 切换至下一首
  next() {
    if (audioPlayer.allSongs.length === 0) return;
    if (audioPlayer.isRandomPlay) {
      const randomIndex = Math.floor(Math.random() * audioPlayer.allSongs.length);
      audioPlayer.playSong(audioPlayer.allSongs[randomIndex]);
    } else {
      const currentIndex = audioPlayer.currentSong
        ? audioPlayer.allSongs.findIndex((s) => s.id === audioPlayer.currentSong.id)
        : -1;
      const nextIndex = (currentIndex + 1) % audioPlayer.allSongs.length;
      audioPlayer.playSong(audioPlayer.allSongs[nextIndex]);
    }
  },

  // 切换至上一首
  prev() {
    if (audioPlayer.allSongs.length === 0) return;
    const currentIndex = audioPlayer.currentSong
      ? audioPlayer.allSongs.findIndex((s) => s.id === audioPlayer.currentSong.id)
      : -1;
    const prevIndex = (currentIndex - 1 + audioPlayer.allSongs.length) % audioPlayer.allSongs.length;
    audioPlayer.playSong(audioPlayer.allSongs[prevIndex]);
  },

  // 手动跳转进度（百分比）
  setProgress(percent) {
    if (!audioPlayer.currentSong) return;
    const targetSeconds = Math.floor((percent / 100) * audioPlayer.currentSong.durationSeconds);
    audio.currentTime = targetSeconds;
    audioPlayer.playProgressSeconds = targetSeconds;
  },

  // 设置音量 (0 - 100)
  setVolume(val) {
    audioPlayer.volume = val;
    audio.volume = val / 100;
  }
});

// 在单例导入时立即启动初始化监听器
audioPlayer.init();
