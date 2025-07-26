"use client";

import logo from "@/assets/logo.png";
import ThemeToggle from "@/components/ThemeToggle";
import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const { theme } = useTheme();

  return (
    <header className="shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 py-24">
        <Link href="/home" className="flex items-center gap-2">
          <Image
            src={logo}
            alt="Logo"
            width={250}
            height={100}
            className="rounded-full"
          />
        </Link>
        <nav className="nav">
          <div className="nav__wrapper">
            <ul className="menu flex items-center gap-x-[30px]">
              <li className="menu__item">
                <Link
                  href="/resumes"
                  className="menu__link"
                  aria-label="Resume builder"
                >
                  Resume Builder
                </Link>
              </li>
              <li className="menu__item">
                <Link
                  href="/analyzer"
                  className="menu__link"
                  aria-label="Resume analyzer"
                >
                  Resume Analyzer
                </Link>
              </li>
              <li className="menu__item">
                <Link
                  href="/recommender"
                  className="menu__link"
                  aria-label="Job recommender"
                >
                  Job recommender
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="hamburger-menu">
          <button
            aria-label="Toggle navigation"
            type="button"
            className="nav-opener"
          >
            <span className="hamburger-icon"></span>
            <span className="hamburger-icon"></span>
            <span className="hamburger-icon"></span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserButton
            appearance={{
              baseTheme: theme === "dark" ? dark : undefined,
              elements: {
                avatarBox: {
                  width: 35,
                  height: 35,
                },
              },
            }}
          >
            <UserButton.MenuItems></UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  );
}
