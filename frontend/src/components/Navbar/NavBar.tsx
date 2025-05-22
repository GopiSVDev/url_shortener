import { Link } from "react-router-dom";
import Container from "../ui/Container";
import { Link as LinkIcon } from "lucide-react";

const NavBar = () => {
  return (
    <header className="w-full bg-[hsl(210,100%,96%)]">
      <Container>
        <div className="py-3 flex items-center justify-between">
          <div className="text-xl font-bold flex items-center gap-2 ">
            <LinkIcon size={20} />
            <Link to="/">MyLogo</Link>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-blue-600 transition">
              Home
            </Link>
            <Link to="/features" className="hover:text-blue-600 transition">
              Features
            </Link>
            <Link to="/dashboard" className="hover:text-blue-600 transition">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/auth+" className="hover:text-blue-600 transition">
              Login
            </Link>
            <Link
              to="/auth"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
};

export default NavBar;
