import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";
import { Menu, X, LogIn } from "lucide-react";
import Container from "../ui/Container";

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <Container>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 shadow">
        {/* Left - Logo */}
        <div className="font-bold text-xl flex gap-2 items-center">
          <img
            src="/assets/icons/link.svg"
            alt="Logo Icon"
            className="w-6 h-6"
          />
          Shortener
        </div>

        {/* Center - Nav Links */}
        <ul className="flex space-x-8">
          {navLinks.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="text-gray-700 hover:text-blue-600 transition"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right - Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src="/default-avatar.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 mt-2">
            <DropdownMenuItem asChild>
              <a href="/login" className="flex items-center gap-2 w-full">
                <LogIn size={16} /> Login
              </a>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a href="/login" className="flex items-center gap-2 w-full">
                <LogIn size={16} /> Sign Up
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Mobile Navbar */}
      <nav className="flex md:hidden items-center justify-between px-6 py-4 shadow">
        <div className="font-bold text-xl flex gap-2 items-center">
          <img
            src="/assets/icons/link.svg"
            alt="Logo Icon"
            className="w-6 h-6"
          />
          Shortener
        </div>
        <button onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </nav>

      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"} z-50`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-bold text-xl">Menu</div>
          <button onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <ul className="flex flex-col mt-4 space-y-4 px-4">
          {navLinks.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setSidebarOpen(false)}
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/login"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
              onClick={() => setSidebarOpen(false)}
            >
              <LogIn size={18} /> Login
            </a>
          </li>
        </ul>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0  bg-opacity-30 z-40"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </Container>
  );
}
