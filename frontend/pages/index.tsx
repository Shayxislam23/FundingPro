import Head from 'next/head'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Head>
        <title>FundingPro</title>
      </Head>
      <h1 className="text-4xl font-bold mb-4">FundingPro</h1>
      <p className="text-lg">Discover and apply for grants with AI assistance.</p>
    </div>
  )
}
