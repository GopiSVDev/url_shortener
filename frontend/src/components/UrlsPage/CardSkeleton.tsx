import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const CardSkeleton = () => {
  return (
    <div className="w-full flex justify-center">
      <div className="space-y-4 w-full max-w-[900px]">
        {[1, 2, 3].map((_, i) => (
          <Card key={i} className="w-full h-[165px]">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CardSkeleton;
