import request from "../utils/request";

// 获取随机音乐列表
export const getRandomMusicListApi = () => {
  return request({
    url: "/admin/music/song/random",
    method: "get"
  });
};

// 获取音乐列表 (分页查询)
export const getMusicListApi = (params) => {
  return request({
    url: "/admin/music/song/list",
    method: "get",
    params
  });
};

// 获取专辑列表 (分页查询)
export const getAlbumListApi = (params) => {
  return request({
    url: "/admin/music/album/list",
    method: "get",
    params
  });
};

// 根据网易云专辑ID查询下属歌曲
export const getAlbumSongsApi = (neteaseAlbumId) => {
  return request({
    url: `/admin/music/album/songs/${neteaseAlbumId}`,
    method: "get"
  });
};
