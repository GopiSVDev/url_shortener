import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ShortUrl {
  id: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
}

export default function AllUrlsPage() {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShortUrl | null>(null);
  const [deleting, setDeleting] = useState<ShortUrl | null>(null);
  const [editInput, setEditInput] = useState("");

  useEffect(() => {
    async function fetchUrls() {
      setLoading(true);
      setTimeout(() => {
        setUrls([
          {
            id: "1",
            originalUrl: "https://example.com/long/url/1",
            shortUrl: "https://sho.rt/a1b2c3",
            createdAt: "2025-05-29",
          },
          {
            id: "2",
            originalUrl: "https://example.com/long/url/2",
            shortUrl: "https://sho.rt/d4e5f6",
            createdAt: "2025-05-28",
          },
        ]);
        setLoading(false);
      }, 500);
    }

    fetchUrls();
  }, []);

  const handleUpdate = () => {
    if (!editing) return;
    setUrls((prev) =>
      prev.map((url) =>
        url.id === editing.id ? { ...url, originalUrl: editInput } : url
      )
    );
    setEditing(null);
    toast("URL updated");
  };

  const handleDelete = () => {
    if (!deleting) return;
    setUrls((prev) => prev.filter((url) => url.id !== deleting.id));
    setDeleting(null);
    toast("URL deleted");
  };

  if (loading) {
    return (
      <div className="space-y-4 w-full">
        {[1, 2, 3].map((_, i) => (
          <Card key={i} className="w-full h-[180px] max-w-[350px]">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {urls.map((url) => (
          <Card key={url.id}>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm text-muted-foreground">Original URL:</div>
              <div className="text-sm break-all">{url.originalUrl}</div>

              <div className="flex items-center gap-2 mt-2">
                <Input readOnly value={url.shortUrl} className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(url.shortUrl)}
                >
                  <CopyIcon size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditing(url);
                    setEditInput(url.originalUrl);
                  }}
                >
                  <PencilIcon size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleting(url)}
                >
                  <TrashIcon size={16} />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                Created at: {url.createdAt}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Original URL</DialogTitle>
          </DialogHeader>
          <Input
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this URL?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
