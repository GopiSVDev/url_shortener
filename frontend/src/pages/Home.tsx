import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Copy, QrCode } from "lucide-react";

const Home = () => {
  return (
    <div className="w-full px-6 py-10 flex justify-center items-center bg-white dark:bg-background">
      <div className="flex items-center flex-col gap-10">
        <h1 className="font-bold text-5xl text-center text-gray-900 dark:text-white">
          Build stronger digital connections
        </h1>
        <h2 className="max-w-[900px] text-center md:text-2xl text-gray-700 dark:text-gray-300">
          Quickly turn long, messy links into short, clean ones that are easy to
          share and remember. Customize your links, keep track of how many
          people click them, and manage everything in one place.
        </h2>

        <div className="flex flex-col md:flex-row justify-around bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl gap-5 w-full max-w-[700px]">
          {/* Text Section */}

          <div className="flex flex-col gap-2 justify-evenly">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              SHORTEN A LONG URL!!
            </h2>
            <div className="flex flex-col gap-3 items-center text-gray-700 dark:text-gray-300">
              <h3 className="text-center">Paste your long link here</h3>
              <Input
                className="w-full max-w-[350px] h-[50px] text-[16px] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                type="url"
                placeholder="Enter your loooooong link"
              />
              <div className="w-full max-w-[350px] flex justify-around items-center gap-3">
                <Input
                  readOnly
                  placeholder="You short link appears here"
                  className=" h-[50px] text-[16px] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                />
                <Copy size={40} className="cursor-pointer" />
              </div>
              <Button className="cursor-pointer w-full max-w-[350px] h-[50px] text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
                Shorten URL
              </Button>
            </div>
          </div>

          {/* QR Image Section */}
          <div className="flex justify-center items-center min-w-[200px] md:w-[250px]">
            <div className="max-w-[250px] w-full border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden">
              <AspectRatio ratio={1 / 1} className="w-full">
                <QrCode className="h-full w-full text-gray-900 dark:text-white" />
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
