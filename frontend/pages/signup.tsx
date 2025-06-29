import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, { email, password })
    router.push('/signin')
  }

  return (
    <form onSubmit={submit} className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Sign Up</h1>
      <input className="border p-2 w-full mb-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2" type="submit">Create account</button>
    </form>
  )
}
