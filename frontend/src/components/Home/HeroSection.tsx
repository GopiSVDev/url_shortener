import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { QrCode } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="w-full px-6 py-10 flex justify-center items-center">
      <div className="flex items-center flex-col gap-10">
        <h1 className="font-bold text-5xl text-center">
          Build stronger digital connections
        </h1>
        <h2 className="max-w-[900px] text-center md:text-2xl">
          Quickly turn long, messy links into short, clean ones that are easy to
          share and remember. Customize your links, keep track of how many
          people click them, and manage everything in one place.
        </h2>

        <div className="flex flex-col md:flex-row justify-around bg-white p-6 md:p-8 rounded-2xl gap-5 w-full max-w-[700px]">
          {/* Text Section */}

          <div className="flex flex-col gap-2 justify-evenly">
            <h2 className="text-2xl font-bold text-center">
              SHORTEN A LONG URL!!
            </h2>
            <div className="flex flex-col gap-3 items-center">
              <h3 className="text-center">Paste your long link here</h3>
              <Input
                className="w-full max-w-[350px] h-[50px] text-[16px]"
                type="url"
                placeholder="Enter your loooooong link"
              />
              <Button className="cursor-pointer w-full max-w-[350px] h-[50px] bg-blue-500 hover:bg-blue-600">
                Shorten URL
              </Button>
            </div>
          </div>

          {/* QR Image Section */}
          <div
            className="flex justify-center items-center 
          min-w-[200px] md:w-[250px]"
          >
            <div className="max-w-[250px] w-full border border-gray-200 rounded-3xl overflow-hidden">
              <AspectRatio ratio={1 / 1} className="w-full">
                <QrCode className="h-full w-full" />
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
