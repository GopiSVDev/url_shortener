import type { LucideIcon } from "lucide-react";

const FeatureCard = ({
  title,
  details,
  icon: Icon,
}: {
  title: string;
  details: string;
  icon: LucideIcon;
}) => {
  return (
    <div className="card flex flex-col gap-5 border border-gray-400 rounded-2xl p-6 max-w-[300px]">
      <h3 className="flex gap-2 items-center">
        <Icon /> {title}
      </h3>
      <p className="leading-7">{details}</p>
    </div>
  );
};

export default FeatureCard;
