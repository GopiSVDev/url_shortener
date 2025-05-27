import { BarChartIcon, Link, QrCode } from "lucide-react";
import FeatureCard from "@/components/ui/FeatureCard";

const Features = () => {
  const features = [
    {
      title: "Fast Link Shortening",
      details:
        "Transform lengthy URLs into short, memorable links in just seconds. Our service is built for speed and reliability, ensuring your links work flawlessly across social media and anywhere else you need to share. ",
      icon: Link,
    },
    {
      title: "Powerful Analytics",
      details:
        "See detailed metrics on your shortened URLs. Track links by how much traffic comes from specific regions or device types. Better understand your users' journeys when they click on your URLs. Then, optimize your campaigns to get your URLs in front of more of the right people.",
      icon: BarChartIcon,
    },
    {
      title: "QR Code Generator",
      details:
        "Bridge the gap between the physical and digital world effortlessly. Generate customizable QR codes for any shortened link, perfect for print materials, product packaging, events, or driving traffic from offline sources.",
      icon: QrCode,
    },
  ];

  return (
    <div className="w-full px-6 py-10 flex justify-center items-center">
      <div className="flex items-center flex-col gap-10">
        <h1 className="font-bold text-5xl text-center">
          One short link, infinite possibilities
        </h1>
        <h3 className="max-w-[900px] text-center md:text-2xl">
          A short link is a powerful marketing tool when you use it carefully.
          it is not just a link but a medium between you and your customer and
          their destination.
        </h3>
        <div className="flex justify-center gap-5 flex-wrap">
          {features.map(({ title, details, icon }) => (
            <FeatureCard
              key={title}
              title={title}
              details={details}
              icon={icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
