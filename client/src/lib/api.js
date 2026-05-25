import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl
}

export default axios
