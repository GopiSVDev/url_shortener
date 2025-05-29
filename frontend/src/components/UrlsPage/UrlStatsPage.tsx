import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import DeviceStats from "../Analytics/DeviceStats";
import LineChartStats from "../Analytics/LineChartStats";

type UrlStats = {
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
  totalClicks: number;
  lastClickedAt: string | null;
  topLocations: { location: string; clicks: number }[];
  clickLogs: {
    id: string;
    timestamp: string;
    location: string;
    referrer: string;
    device: string;
    browser: string;
  }[];
};

const dummyStats = {
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
      referrer: "facebook.com",
      device: "Desktop",
      browser: "Chrome",
    },
    {
      id: "log2",
      timestamp: "2025-05-28T17:30:00Z",
      location: "India",
      referrer: "twitter.com",
      device: "Mobile",
      browser: "Safari",
    },
    {
      id: "log3",
      timestamp: "2025-05-28T16:00:00Z",
      location: "Germany",
      referrer: "",
      device: "Tablet",
      browser: "Firefox",
    },
  ],
};

export default function UrlStatsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<UrlStats | null>(dummyStats);
  const [loading, setLoading] = useState(false);

  if (loading) return <Skeleton className="h-96 w-full" />;

  if (!stats)
    return (
      <p className="text-center mt-10 text-muted-foreground">No data found.</p>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      <Card>
        <CardHeader>
          <div>
            <h3 className="font-semibold">Short URL</h3>
            <p className="text-blue-600 hover:underline cursor-pointer truncate">
              {stats.shortUrl}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">
            <h3 className="font-semibold">Original URL</h3>
            <p className="truncate">{stats.originalUrl}</p>
          </div>
          <div>
            <h3 className="font-semibold">Created At</h3>
            <p>{new Date(stats.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Total Clicks</h3>
            <p>{stats.totalClicks}</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <LineChartStats />

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
          <CardDescription>Latest individual click events</CardDescription>
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
                {stats.clickLogs.map(({ id, timestamp, location, device }) => (
                  <TableRow key={id}>
                    <TableCell>
                      {new Date(timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{location || "Unknown"}</TableCell>
                    <TableCell>{device || "Unknown"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
