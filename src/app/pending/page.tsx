import Image from 'next/image'

export default function PendingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
      <Image src="/sbk-logo.svg" alt="SBK Logo" width={100} height={100} className="mb-6 rounded-full" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Requested</h1>
      <p className="text-gray-600">
        Your account is currently pending approval by an admin. Once your SBK group membership is verified, you will be granted access.
      </p>
      <form action="/auth/logout" method="post" className="mt-8">
        <button type="submit" className="text-sbk-blue underline">Sign Out</button>
      </form>
    </div>
  )
}
