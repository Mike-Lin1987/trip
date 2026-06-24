import { HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SeniorFriendlyBadgeProps = {
  friendly: boolean;
  className?: string;
};

export function SeniorFriendlyBadge({
  friendly,
  className,
}: SeniorFriendlyBadgeProps) {
  return (
    <Badge
      className={cn(
        "h-8 rounded-[8px] px-3 text-[15px]",
        friendly
          ? "border-[#607348]/20 bg-[#607348]/12 text-[#445433]"
          : "border-[#a33a2b]/20 bg-[#a33a2b]/10 text-[#8b2f24]",
        className,
      )}
      variant="outline"
    >
      <HeartHandshake className="size-4" />
      {friendly ? "適合長輩" : "需斟酌體力"}
    </Badge>
  );
}
