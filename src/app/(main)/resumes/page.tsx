import { Button } from "@/components/ui/button";
import { PlusSquare } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your resumes",
};

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-7xl pb-50 pt-[180px]">
      <Button className="mx-auto flex w-fit gap-2 bg-black p-12 text-24 text-white hover:bg-black/80">
        <Link href="/editor" className="flex">
          <PlusSquare className="size-24" />
          New resume
        </Link>
      </Button>
    </main>
  );
}
