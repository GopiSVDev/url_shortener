import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CopyIcon, Loader2, QrCode } from "lucide-react";
import { useState } from "react";
import { shortenUrl } from "@/api/urlApi";
import { toast } from "sonner";

const Home = () => {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleShorten = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!longUrl.trim()) {
      toast("Please enter a valid URL.");
      return;
    }

    if (!isValidUrl(longUrl.trim())) {
      toast("Please enter a valid URL (e.g., https://example.com).");
      return;
    }

    setLoading(true);
    try {
      const result = await shortenUrl(longUrl);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setShortUrl(result.shortUrl);
      const url = "http://localhost:8080/qr/" + shortUrl;
      setQrUrl(url);
    } catch (error) {
      console.log("Error shortening URL", error);
      toast("Failed to shorten URL. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shortUrl) {
      try {
        await navigator.clipboard.writeText(shortUrl);
        toast("Copied to clipboard!");
      } catch {
        toast("Failed to copy.");
      }
    }
  };

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

        <div className="flex flex-col items-center lg:flex-row justify-around bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl gap-5 w-full max-w-[800px]">
          {/* Text Section */}

          <div className="flex flex-col gap-2 justify-evenly">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              SHORTEN A LONG URL!!
            </h2>
            <form
              onSubmit={handleShorten}
              className="flex flex-col gap-3 items-center text-gray-700 dark:text-gray-300 lg:w-[400px]"
            >
              <h3 className="text-center">Paste your long link here</h3>

              <Input
                className="w-full max-w-[400px] h-[50px] text-[16px] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                type="url"
                placeholder="Enter your loooooong link"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
              />

              <div className="w-full max-w-[400px] flex justify-around items-center gap-3">
                <Input
                  value={shortUrl || ""}
                  readOnly
                  placeholder="Your short link appears here"
                  className="h-[50px] text-[16px] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                />
                <Button
                  variant="outline"
                  className="h-[50px] cursor-pointer"
                  onClick={handleCopy}
                  type="button"
                  disabled={!shortUrl}
                  aria-label="Copy shortened URL"
                >
                  <CopyIcon size={40} />
                </Button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full max-w-[400px] h-[50px] text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin h-5 w-5" />}
                {loading ? "Shortening..." : "Shorten URL"}
              </Button>
            </form>
          </div>

          {/* QR Image Section */}
          <div className="flex justify-center items-center min-w-[200px] md:w-[250px]">
            <div className="max-w-[250px] w-full border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden">
              <AspectRatio ratio={1 / 1} className="w-full">
                {shortUrl ? (
                  <img
                    src={qrUrl || ""}
                    alt="QR Code"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <QrCode className="h-full w-full text-gray-900 dark:text-white" />
                )}
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
