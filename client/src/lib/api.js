import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl
}

// Retry failed requests up to 3 times with exponential backoff
// Helps massively on weak/intermittent networks
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    if (!config) return Promise.reject(error)

    // Only retry on network errors or 5xx, not on 4xx client errors
    const isNetworkError = !error.response
    const isServerError = error.response && error.response.status >= 500
    if (!isNetworkError && !isServerError) return Promise.reject(error)

    config._retryCount = config._retryCount || 0
    if (config._retryCount >= 3) return Promise.reject(error)

    config._retryCount += 1
    const delay = Math.min(1000 * Math.pow(2, config._retryCount - 1), 8000)
    await new Promise((resolve) => setTimeout(resolve, delay))
    return axios(config)
  }
)

// Shorter timeout so the UI can show an error faster instead of hanging
axios.defaults.timeout = 15000

export default axios
