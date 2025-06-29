import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Head>
        <title>FundingPro</title>
      </Head>
      <h1 className="text-4xl font-bold mb-4">FundingPro</h1>
      <p className="text-lg mb-4">Discover and apply for grants with AI assistance.</p>
      <div className="space-x-4">
        <Link href="/signup" className="text-blue-600 underline">Sign Up</Link>
        <Link href="/signin" className="text-blue-600 underline">Sign In</Link>
      </div>
    </div>
  )
}
