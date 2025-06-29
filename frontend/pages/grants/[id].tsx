import { useRouter } from 'next/router'
import useSWR from 'swr'
import axios from 'axios'

const fetcher = (url: string) => axios.get(url).then(r => r.data)

export default function GrantDetail() {
  const router = useRouter()
  const { id } = router.query
  const { data } = useSWR(id ? `${process.env.NEXT_PUBLIC_API_URL}/grants/${id}` : null, fetcher)

  if (!data) return <p>Loading...</p>
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-2">{data.title}</h1>
      <p className="mb-2">{data.description}</p>
      <p>Amount: ${data.amount}</p>
    </div>
  )
}
