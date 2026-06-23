import request from "../utils/request";

/**
 * 获取论坛分类板块列表
 * @param {Object} params 查询参数
 * @param {string} [params.name] 分类名称（模糊查询）
 * @param {string} [params.status] 状态（0正常 1停用）
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const getCategoryListApi = (params) => {
  return request({
    url: "/admin/forum/category/list",
    method: "get",
    params,
  });
};

/**
 * 获取论坛帖子列表 (分页)
 * @param {Object} params 查询参数
 * @param {number} [params.categoryId] 分类板块ID
 * @param {string} [params.title] 帖子标题（模糊查询）
 * @param {string} [params.isTop] 是否置顶 (0否 1是)
 * @param {string} [params.isEssence] 是否精华 (0否 1是)
 * @param {string} [params.status] 状态 (0正常 1停用)
 * @param {number} [params.pageNum] 当前页码
 * @param {number} [params.pageSize] 每页条数
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const getPostListApi = (params) => {
  return request({
    url: "/admin/forum/post/list",
    method: "get",
    params,
  });
};

/**
 * 创建帖子
 * @param {Object} data 帖子数据
 * @param {number} data.categoryId 分类板块ID
 * @param {string} data.title 帖子标题
 * @param {string} data.content 帖子正文内容
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const createPostApi = (data) => {
  return request({
    url: "/admin/forum/post",
    method: "post",
    data,
  });
};

/**
 * 获取某帖子的嵌套评论盖楼树
 * @param {number} postId 帖子ID
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const getCommentTreeApi = (postId) => {
  return request({
    url: `/admin/forum/comment/list/${postId}`,
    method: "get",
  });
};

/**
 * 发表回帖评论
 * @param {Object} data 评论数据
 * @param {number} data.postId 关联帖子ID
 * @param {number} [data.parentId] 父级评论ID
 * @param {string} data.content 评论正文内容
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const createCommentApi = (data) => {
  return request({
    url: "/admin/forum/comment",
    method: "post",
    data,
  });
};

/**
 * 获取单个帖子的详细信息
 * @param {number|string} postId 帖子ID
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const getPostDetailApi = (postId) => {
  return request({
    url: `/admin/forum/post/${postId}`,
    method: "get",
  });
};

/**
 * 帖子点赞 (Toggle)
 * @param {number|string} postId 帖子ID
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const togglePostLikeApi = (postId) => {
  return request({
    url: `/admin/forum/post/like/${postId}`,
    method: "post",
  });
};

/**
 * 帖子收藏 (Toggle)
 * @param {number|string} postId 帖子ID
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const togglePostCollectApi = (postId) => {
  return request({
    url: `/admin/forum/post/collect/${postId}`,
    method: "post",
  });
};

/**
 * 评论点赞 (Toggle)
 * @param {number|string} commentId 评论ID
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const toggleCommentLikeApi = (commentId) => {
  return request({
    url: `/admin/forum/comment/like/${commentId}`,
    method: "post",
  });
};

/**
 * 举报帖子
 * @param {Object} data 举报数据
 * @param {number} data.postId 帖子ID
 * @param {string} data.reason 举报原因
 * @param {string} [data.content] 举报详细说明
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const reportPostApi = (data) => {
  return request({
    url: "/admin/forum/post/report",
    method: "post",
    data,
  });
};

/**
 * 获取当前登录用户收藏的帖子列表
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const getMyCollectedPostsApi = () => {
  return request({
    url: "/admin/forum/post/collect/my",
    method: "get",
  });
};


