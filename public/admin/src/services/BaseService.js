class BaseService {
  constructor() {
    this.baseURL = '/api/admin'
    this.setupInterceptors()
  }

  setupInterceptors() {
    // Request interceptor để thêm token
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')

        if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Thêm headers cần thiết
        config.headers['Content-Type'] = 'application/json'
        config.headers['Accept'] = 'application/json'
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor để xử lý lỗi
    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // if (error.response?.status === 401) {
        //   // Token hết hạn, clear storage và redirect về login
        //   localStorage.removeItem('token')
        //   localStorage.removeItem('user')
          
        //   // Chỉ redirect nếu không phải trang login và không đang trong quá trình redirect
        //   if (window.location.pathname !== '/admin/login' && !window.isRedirecting) {
        //     window.isRedirecting = true
        //     setTimeout(() => {
        //       window.location.href = '/admin/login'
        //     }, 100)
        //   }
        // }
        return Promise.reject(error)
      }
    )
  }

  get(url, params = {}) {
    return axios.get(`${this.baseURL}${url}`, { params })
  }

  post(url, data = {}) {
    return axios.post(`${this.baseURL}${url}`, data)
  }

  put(url, data = {}) {
    return axios.put(`${this.baseURL}${url}`, data)
  }

  delete(url) {
    return axios.delete(`${this.baseURL}${url}`)
  }

  patch(url, data = {}) {
    return axios.patch(`${this.baseURL}${url}`, data)
  }
}

// Export to global window object
if (!window.BaseService) {
    window.BaseService = BaseService;
}
