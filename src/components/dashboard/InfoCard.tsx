import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface InfoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  borderColor?: string;
  textColor?: string;
  iconColor?: string;
}

export function InfoCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  borderColor = "border-l-blue-500",
  textColor = "text-blue-600",
  iconColor = "text-blue-500"
}: InfoCardProps) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
} 