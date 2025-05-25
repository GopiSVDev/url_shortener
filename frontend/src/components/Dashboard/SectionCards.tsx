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

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card @xl/main:col-span-2">
        <CardHeader className="relative font-semibold tabular-nums">
          <CardDescription>Quick Shorten</CardDescription>
        </CardHeader>
        <CardContent className="@[250px]/card:text-3xl text-2xl  flex flex-col gap-4">
          <Input
            className="w-full text-[16px]"
            type="url"
            placeholder="Enter your loooooong link"
          />
          <Button className="cursor-pointer w-full bg-blue-500 hover:bg-blue-600">
            Shorten URL
          </Button>
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
