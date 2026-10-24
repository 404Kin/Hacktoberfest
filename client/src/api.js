import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 150000,
})

export async function sendChat({ messages, count, difficulty }) {
  try {
    const { data } = await client.post('/api/chat', { messages, count, difficulty })
    return data
  } catch (err) {
    const serverMsg = err.response?.data?.error
    if (serverMsg) throw new Error(serverMsg, { cause: err })
    if (err.code === 'ECONNABORTED') throw new Error('The request timed out. Please try again.', { cause: err })
    throw new Error('Cannot reach the server. Start it with "npm run dev" in the server folder.', { cause: err })
  }
}
