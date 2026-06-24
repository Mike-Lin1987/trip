import { Armchair, BriefcaseBusiness, CarTaxiFront, Train } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransportComfort } from "@/types/trip";

const icons = {
  train: Train,
  taxi: CarTaxiFront,
  luggage: BriefcaseBusiness,
  seat: Armchair,
};

type TransportComfortCardProps = {
  item: TransportComfort;
};

export function TransportComfortCard({ item }: TransportComfortCardProps) {
  const Icon = icons[item.icon];

  return (
    <Card className="rounded-[8px] bg-[#fffdf8] shadow-sm">
      <CardHeader>
        <Icon className="mb-3 size-8 text-[#a33a2b]" />
        <CardTitle className="text-[21px] text-[#2f2a24]">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[17px] leading-8 text-[#5f5549]">{item.description}</p>
      </CardContent>
    </Card>
  );
}
