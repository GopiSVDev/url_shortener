const QuickStatsCard = ({
  totalLinks,
  totalClicks,
}: {
  totalLinks: number;
  totalClicks: number;
}) => {
  return (
    <div className="border border-gray-200 w-fit p-6 flex flex-col gap-5 rounded-lg">
      <div>
        <h3 className="text-2xl font-bold pb-2">Quick Stats</h3>
        <p className="pb-2">Get a quick overview of your links</p>
      </div>
      <div className="flex flex-col gap-5 ">
        <div className="flex justify-between">
          <span className="text-3xl">Total Links</span>
          <span className="text-4xl text-gray-400">{totalLinks}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-3xl">Total Clicks</span>
          <span className="text-4xl text-gray-400">{totalClicks}</span>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;
