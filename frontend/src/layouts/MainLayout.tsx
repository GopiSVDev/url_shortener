import NavBar from "@/components/Navbar/NavBar";
import Container from "@/components/ui/Container";
import { Github } from "lucide-react";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <>
      <NavBar />
      <main>
        <Outlet />
      </main>
      <div className="w-full bg-black text-white font-bold py-3 mt-5">
        <Container className="flex justify-center gap-4">
          <p>PROJECT BY GOPI</p>
          <a href="https://github.com/GopiSVDev/url_shortener">
            <Github className="cursor-pointer" />
          </a>
        </Container>
      </div>
    </>
  );
};

export default MainLayout;
