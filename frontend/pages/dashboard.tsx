import useSWR from 'swr'
import axios from 'axios'

const fetcher = (url: string) => axios.get(url, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.data)

function getToken() {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/token=([^;]+)/)
    return match ? match[1] : ''
  }
  return ''
}

export default function Dashboard() {
  const { data } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/grants`, fetcher)

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Available Grants</h1>
      <ul>
        {data?.map((g: any) => (
          <li key={g.id} className="mb-2 border p-2">
            <a href={`/grants/${g.id}`} className="text-blue-600 underline">{g.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
