import { Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const QuickShorten = () => {
  return (
    <div className="border border-gray-300 flex gap-2 items-center justify-around p-6 w-[300px] rounded-lg">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-2xl font-bold pb-2">Quick Shorten</h3>
          <p className="pb-2">Quickly create a short link</p>
        </div>
        <Input
          className="w-full max-w-[350px] h-[50px] text-[16px]"
          type="url"
          placeholder="Enter your loooooong link"
        />
        <div className="flex items-center gap-2">
          <Input
            className="w-full max-w-[350px] h-[50px] text-[16px]"
            type="url"
            placeholder="Click to copy"
            disabled
          />
          <Copy size={50} className="cursor-pointer" />
        </div>
        <Button className="cursor-pointer w-full max-w-[350px] h-[50px] bg-blue-500 hover:bg-blue-600">
          Shorten URL
        </Button>
      </div>
    </div>
  );
};

export default QuickShorten;
