import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Image src="/404.png" alt="404 Error" width={300} height={300} />
      <Link
        href="/dashboard"
        className="text-green-800 text-xl font-bold duration-100 ease-in-out hover:scale-105"
      >
        Go Back Home
      </Link>
    </div>
  );
}
