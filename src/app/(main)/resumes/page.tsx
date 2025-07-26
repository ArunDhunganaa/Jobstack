import { Button } from "@/components/ui/button";
import { PlusSquare } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your resumes",
};

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-7xl px-3 py-6">
      <Button className="text-24 mx-auto flex w-fit gap-2 text-white">
        <Link href="/editor" className="flex">
          <PlusSquare className="size-24" />
          New resume
        </Link>
      </Button>
    </main>
  );
}
