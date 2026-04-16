import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-500 mt-2">Halaman tidak ditemukan</p>
      <Link href="/dashboard" className="mt-4 text-blue-500 hover:underline">
        Kembali ke Home
      </Link>
    </div>
  );
}