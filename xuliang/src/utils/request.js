import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求发起错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data

    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求服务发生异常')

      if (res.code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('userInfo')
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res
  },
  (error) => {
    console.error('响应接收异常：', error)
    let message = '网络异常，请检查网络后重试'

    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 400:
          message = '请求参数不正确'
          break
        case 401:
          message = '登录凭证已过期，请重新登录'
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('userInfo')
          break
        case 403:
          message = '拒绝访问，您没有该操作权限'
          break
        case 404:
          message = '请求的接口地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = error.response.data?.message || `网络连接出错(${status})`
      }
    } else if (error.message?.includes('timeout')) {
      message = '请求响应超时，请检查您的网络连接'
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service
