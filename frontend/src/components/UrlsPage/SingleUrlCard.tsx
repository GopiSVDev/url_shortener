import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { CopyIcon, PencilIcon, TrashIcon } from "lucide-react";
import type { ShortUrl } from "./AllUrlsPage";
import { Link } from "react-router-dom";

const SingleUrlCard = ({
  url,
  onEdit,
  onDelete,
}: {
  url: ShortUrl;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <Card>
      <CardContent className="w-full space-y-2">
        <div className="flex gap-3 justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">Original URL:</div>
            <div className="text-sm break-all">
              <Link to={`/dashboard/urls/${url.id}`}>{url.originalUrl}</Link>
            </div>
          </div>
          <div className="flex gap-3 items-center ml-3">
            <Button variant="outline" size="icon" onClick={onEdit}>
              <PencilIcon size={16} />
            </Button>
            <Button variant="outline" size="icon" onClick={onDelete}>
              <TrashIcon size={16} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Input readOnly value={url.shortUrl} className="flex-1" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(url.shortUrl);
              toast("URL copied");
            }}
          >
            <CopyIcon size={16} />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-1">
          Created at: {url.createdAt}
        </div>
      </CardContent>
    </Card>
  );
};

export default SingleUrlCard;
