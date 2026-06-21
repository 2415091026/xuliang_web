import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  // 可以根据环境变量动态配置 baseURL，默认使用 /api
  baseURL: '/api',
  timeout: 10000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前携带持久登录或当前会话的 token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 处理发送请求时的错误
    console.error('请求发起错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 拦截响应数据进行业务层判断
    // 默认后端返回结构为：{ code: 200, data: any, message: string }
    const res = response.data

    // 如果接口返回的业务状态码存在且不为 200，则判定为业务错误
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求服务发生异常')

      // 401 凭证过期或未登录处理
      if (res.code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('userInfo')
        // 这里可以执行跳转登录页的逻辑，例如 window.location.href = '/login'
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res
  },
  (error) => {
    // 拦截 HTTP 级别的非 2xx 网络错误或超时错误
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
    } else if (error.message.includes('timeout')) {
      message = '请求响应超时，请检查您的网络连接'
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service
