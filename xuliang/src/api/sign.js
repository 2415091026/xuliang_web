import request from "../utils/request";

/**
 * 获取当前用户签到累积状态与历史
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const getSignStatusApi = () => {
  return request({
    url: "admin/system/sign/status",
    method: "get",
  });
};

/**
 * 用户执行每日签到
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const doSignApi = () => {
  return request({
    url: "admin/system/sign/check-in",
    method: "post",
  });
};
