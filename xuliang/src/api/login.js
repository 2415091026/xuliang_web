import request from '../utils/request'

/**
 * 管理员登录接口
 * @param {Object} data 登录信息
 * @param {string} data.username 用户名（手机号/邮箱）
 * @param {string} data.password 密码
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const loginApi = (data) => {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}
