import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Menu, X, LogInIcon, UserPlus2 } from "lucide-react";
import { Link } from "react-router-dom";
import Container from "../ui/Container";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className={`sticky top-0 z-50 transition-colors duration-300 w-full shadow ${
          scrolled ? "bg-white" : "bg-blue-100"
        } `}
      >
        <Container className="hidden md:flex items-center justify-between px-6 py-4">
          {/* Left - Logo */}
          <Link to="/">
            <div className="font-bold text-xl flex gap-2 items-center">
              <img
                src="/assets/icons/link.svg"
                alt="Logo Icon"
                className="w-6 h-6"
              />
              Shortener
            </div>
          </Link>

          {/* Center - Nav Links */}
          <ul className="flex space-x-8">
            {navLinks.map(({ label, href }) => (
              <li key={label}>
                <Link
                  to={href}
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  {label}
                </Link>
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
                <Link to="/auth" className="flex items-center gap-2 w-full">
                  <LogInIcon size={16} /> Login
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/auth" className="flex items-center gap-2 w-full">
                  <UserPlus2 size={16} /> Sign Up
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Container>
      </nav>

      {/* Mobile Navbar */}
      <nav
        className={`flex md:hidden sticky top-0 z-50 transition-colors duration-300 items-center justify-between px-6 py-4 shadow ${
          scrolled ? "bg-white" : "bg-blue-100"
        } `}
      >
        <Link to="/">
          <div className="font-bold text-xl flex gap-2 items-center">
            <img
              src="/assets/icons/link.svg"
              alt="Logo Icon"
              className="w-6 h-6"
            />
            Shortener
          </div>
        </Link>
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
              href="/auth"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
              onClick={() => setSidebarOpen(false)}
            >
              <LogInIcon size={16} />
              Login
            </a>
          </li>
          <li>
            <a
              href="/auth"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
              onClick={() => setSidebarOpen(false)}
            >
              <UserPlus2 size={16} />
              Sign Up
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
    </>
  );
}
