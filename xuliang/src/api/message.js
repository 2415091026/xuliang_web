import request from "../utils/request";

/**
 * 分页获取当前用户的全部通知消息
 * @param {Object} params 查询参数
 * @param {number} [params.pageNum] 当前页码
 * @param {number} [params.pageSize] 每页大小
 * @param {string} [params.messageType] 消息类型（1系统通知，2社交互动，3业务提醒）
 * @param {string} [params.readStatus] 已读状态（0未读，1已读）
 * @returns {Promise}
 */
export const getMessagesApi = (params) => {
  return request({
    url: "/admin/system/message/list",
    method: "get",
    params,
  });
};

/**
 * 批量标记消息为已读状态
 * @param {Object} data 请求数据
 * @param {number[]} data.messageIds 消息ID数组
 * @returns {Promise}
 */
export const markMessagesAsReadApi = (data) => {
  return request({
    url: "/admin/system/message/read",
    method: "put",
    data,
  });
};

/**
 * 获取当前登录用户的全部未读消息总数
 * @returns {Promise}
 */
export const getUnreadCountApi = () => {
  return request({
    url: "/admin/system/message/unread/count",
    method: "get",
  });
};
