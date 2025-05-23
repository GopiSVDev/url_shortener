import { Button } from "@/components/ui/button";
import Container from "@/components/ui/Container";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const Home = () => {
  return (
    <div className="w-full bg-blue-100 px-6 py-10">
      <Container className="flex items-center flex-col gap-5">
        <h1 className="font-bold text-4xl text-center">
          Shorten Your Links, Amplify Your Reach
        </h1>
        <h2 className="max-w-[900px] text-center">
          Quickly turn long, messy links into short, clean ones that are easy to
          share and remember. Customize your links, keep track of how many
          people click them, and manage everything in one place.
        </h2>

        <div className="flex flex-col md:flex-row justify-between bg-white p-6 md:p-8 rounded-2xl gap-5 w-full max-w-[650px]">
          {/* Text Section */}

          <div className="flex flex-col gap-2 justify-evenly">
            <h2 className="text-2xl font-semibold">SHORTEN A LONG URL!!</h2>
            <div className="flex flex-col gap-3">
              <h3>Paste your long link here</h3>
              <Input type="url" placeholder="Enter your loooooong link" />
              <Button className="cursor-pointer">Shorten URL</Button>
            </div>
          </div>

          {/* QR Image Section */}
          <div className="flex justify-center bg-red-300 min-w-[240px] max-w-[250px] w-full rounded-2xl">
            <AspectRatio ratio={1 / 1}></AspectRatio>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Home;
