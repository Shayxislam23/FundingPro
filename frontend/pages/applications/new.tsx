import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

function getToken() {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/token=([^;]+)/)
    return match ? match[1] : ''
  }
  return ''
}

export default function NewApplication() {
  const [grantId, setGrantId] = useState('')
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/applications`, { grant_id: Number(grantId) }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    router.push('/dashboard')
  }

  return (
    <form onSubmit={submit} className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">New Application</h1>
      <input className="border p-2 w-full mb-2" placeholder="Grant ID" value={grantId} onChange={e => setGrantId(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2" type="submit">Create</button>
    </form>
  )
}
