import DeviceStats from "@/components/Analytics/DeviceStats";
import { ChartAreaInteractive } from "@/components/Dashboard/ChartAreaInteractive";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stats = {
  originalUrl: "https://example.com/very/long/url/path",
  shortUrl: "https://sho.rt/abc123",
  createdAt: "2025-05-29T12:00:00Z",
  totalClicks: 1587,
  lastClickedAt: "2025-05-28T18:45:00Z",
  clicksOverTime: [
    { date: "2025-05-22", clicks: 45 },
    { date: "2025-05-23", clicks: 78 },
    { date: "2025-05-24", clicks: 120 },
    { date: "2025-05-25", clicks: 300 },
    { date: "2025-05-26", clicks: 400 },
    { date: "2025-05-27", clicks: 350 },
    { date: "2025-05-28", clicks: 294 },
  ],
  topLocations: [
    { location: "United States", clicks: 700 },
    { location: "India", clicks: 400 },
    { location: "Germany", clicks: 200 },
    { location: "Brazil", clicks: 150 },
    { location: "Canada", clicks: 137 },
  ],
  clickLogs: [
    {
      id: "log1",
      timestamp: "2025-05-28T18:45:00Z",
      location: "United States",

      device: "Desktop",
    },
    {
      id: "log2",
      timestamp: "2025-05-28T17:30:00Z",
      location: "India",

      device: "Mobile",
    },
    {
      id: "log3",
      timestamp: "2025-05-28T16:00:00Z",
      location: "Germany",
      device: "Tablet",
    },
  ],
};

const AnalyticsPage = () => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
            <Card className="@container/card">
              <CardHeader className="relative">
                <CardDescription>Total Clicks</CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                  500
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="text-muted-foreground">
                  Total number of clicks
                </div>
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
            <Card className="@container/card">
              <CardHeader className="relative">
                <CardDescription>Top Country</CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                  India
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="text-muted-foreground">
                  Most number of clicks
                </div>
              </CardFooter>
            </Card>
            <Card className="@container/card">
              <CardHeader className="relative">
                <CardDescription>Top Device</CardDescription>
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                  Mobile
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="text-muted-foreground">
                  Most number of clicks
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="px-4 lg:px-6 space-y-5">
            <Separator />
            <ChartAreaInteractive />
          </div>
          {/*  */}
          <div className="px-6 space-y-5">
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Visitor countries or cities</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topLocations.length === 0 ? (
                  <p className="text-muted-foreground">No location data.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Clicks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topLocations.map(({ location, clicks }) => (
                        <TableRow key={location}>
                          <TableCell>{location}</TableCell>
                          <TableCell>{clicks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Separator />

            <DeviceStats />

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>Recent Clicks</CardTitle>
                <CardDescription>
                  Latest individual click events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.clickLogs.length === 0 ? (
                  <p className="text-muted-foreground">No recent clicks.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Device</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.clickLogs.map(
                        ({ id, timestamp, location, device }) => (
                          <TableRow key={id}>
                            <TableCell>
                              {new Date(timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{location || "Unknown"}</TableCell>
                            <TableCell>{device || "Unknown"}</TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
