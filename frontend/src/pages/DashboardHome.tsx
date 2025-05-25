import QuickShorten from "@/components/Dashboard/QuickShorten";
import QuickStatsCard from "@/components/Dashboard/QuickStatsCard";

const DashboardHome = () => {
  return (
    <div className="w-full px-6">
      <div className="flex flex-col gap-5 flex-wrap">
        <QuickStatsCard totalLinks={5} totalClicks={15} />
        <QuickShorten />
      </div>
    </div>
  );
};

export default DashboardHome;
