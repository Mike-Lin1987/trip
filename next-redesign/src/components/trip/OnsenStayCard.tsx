import { Bath, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OnsenStay } from "@/types/trip";

type OnsenStayCardProps = {
  stay: OnsenStay;
};

export function OnsenStayCard({ stay }: OnsenStayCardProps) {
  return (
    <Card className="rounded-[8px] bg-[#fffdf8] shadow-sm">
      <CardHeader>
        <Bath className="mb-3 size-8 text-[#a33a2b]" />
        <CardTitle className="font-serif text-[30px] leading-tight text-[#2f2a24]">
          {stay.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-[18px] leading-8 text-[#5f5549]">
          {stay.comfortPoints.map((point) => (
            <li className="flex gap-3" key={point}>
              <Check className="mt-1 size-5 shrink-0 text-[#607348]" />
              {point}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
