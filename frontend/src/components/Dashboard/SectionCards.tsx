import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { shortenUrl } from "@/api/urlApi";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";

export function SectionCards() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleShorten = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!longUrl.trim()) {
      setError("Please enter a valid URL.");
      return;
    }

    setLoading(true);
    try {
      const result = await shortenUrl(longUrl);
      setShortUrl(result.shortUrl);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      }
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
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card @xl/main:col-span-2">
        <CardHeader className="relative font-semibold tabular-nums">
          <CardDescription>Quick Shorten</CardDescription>
        </CardHeader>
        <CardContent className="@[250px]/card:text-3xl text-2xl">
          <form
            onSubmit={handleShorten}
            className="flex flex-col md:flex-row gap-5"
          >
            <div className="md:w-1/2">
              <Input
                className="w-full text-[16px]"
                type="url"
                placeholder="Enter your loooooong link"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                aria-invalid={!!error}
              />
              {error && (
                <p className="text-red-600 dark:text-red-400 text-sm max-w-[350px]">
                  {error}
                </p>
              )}
              <Button
                className="cursor-pointer w-full text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                type="submit"
              >
                {loading && <Loader2 className="animate-spin h-5 w-5" />}
                {loading ? "Shortening..." : "Shorten URL"}
              </Button>
            </div>
            <div className="md:w-1/2">
              <Input
                value={shortUrl || ""}
                readOnly
                placeholder="You short link appears here"
                className="w-full text-[16px]"
              />
              <Button
                className="cursor-pointer w-full text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                onClick={handleCopy}
                type="button"
                disabled={!shortUrl}
              >
                Copy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Clicks</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            500
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Total number of clicks</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Links</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            19
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            Total number of links created
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
