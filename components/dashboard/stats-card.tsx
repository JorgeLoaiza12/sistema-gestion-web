import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
}

export function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="flex items-center mt-1">
          {trend === "up" ? (
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          )}
          <span className={trend === "up" ? "text-green-500" : "text-red-500"}>
            {change}
          </span>
        </div>
      </div>
    </Card>
  );
}
