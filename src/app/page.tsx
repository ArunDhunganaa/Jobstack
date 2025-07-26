import logo from "@/assets/logo.png";
import resumePreview from "@/assets/resume-preview.jpg";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-100 px-5 py-12 text-center text-gray-900 md:flex-row md:text-start lg:gap-12">
      <div className="md:pr-30 max-w-prose">
        <Image
          src={logo}
          alt="Logo"
          width={250}
          height={150}
          className="mx-auto md:ms-0"
        />
        <h1 className="mb-24 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Create the{" "}
          <span className="t inline-block bg-gradient-to-r bg-clip-text text-[#2563EB]">
            Perfect Resume
          </span>{" "}
          in Minutes
        </h1>
        <p className="mb-24 text-lg text-gray-500">
          Our <span className="font-bold">AI resume builder</span> helps you
          design a professional resume, even if you&apos;re not very smart.
        </p>
        <Button asChild className="bg-[#2563EB] px-24 py-12 text-lg">
          <Link href="/home">Get started</Link>
        </Button>
      </div>
      <div>
        <Image
          src="/frontpage.svg"
          alt="Resume preview"
          width={600}
          height={900}
          className="shadow-md lg:rotate-[1.5deg]"
        />
      </div>
    </main>
  );
}
