import request from "../utils/request";

/**
 * 管理员登录接口
 * @param {Object} data 登录信息
 * @param {string} data.username 用户名（手机号/邮箱）
 * @param {string} data.password 密码
 * @returns {Promise} axios 请求的 Promise 对象
 */
export const loginApi = (data) => {
  return request({
    url: "/admin/login",
    method: "post",
    data
  });
};

// 获取当前登录管理员信息
export const getInfoApi = () => {
  return request({
    url: "/admin/getInfo",
    method: "get"
  });
};

// 管理员注册接口
export const registerApi = (data) => {
  return request({
    url: "/admin/register",
    method: "post",
    data
  });
};

// 获取验证码接口
export const getCodeImgApi = () => {
  return request({
    url: "/admin/captchaImage",
    method: "get",
    timeout: 20000
  });
};

