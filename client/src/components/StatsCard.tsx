import { StatCard } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  card: StatCard;
}

export default function StatsCard({ card }: StatsCardProps) {
  const {
    title,
    value,
    subValue,
    icon,
    status,
    statusText,
    link,
    linkText,
    bgColor,
    iconColor,
  } = card;

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div
            className={cn(
              "flex-shrink-0 rounded-md p-3",
              bgColor || "bg-primary/10"
            )}
          >
            <div
              className={cn(
                "h-5 w-5",
                iconColor || "text-primary"
              )}
              dangerouslySetInnerHTML={{ __html: icon }}
            />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-bold text-gray-900">{value}</div>
                {subValue && (
                  <div className="flex items-center text-sm">
                    {status && (
                      <span
                        className={cn("flex items-center", {
                          "text-green-600": status === "success",
                          "text-yellow-600": status === "warning",
                          "text-red-600": status === "danger",
                        })}
                      >
                        {status === "success" ? (
                          <ArrowUpIcon className="mr-1 h-3 w-3" />
                        ) : status === "danger" ? (
                          <ArrowDownIcon className="mr-1 h-3 w-3" />
                        ) : null}{" "}
                        {statusText}{" "}
                      </span>
                    )}
                    <span className="text-gray-500 ml-2">{subValue}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <a
            href={link}
            className="font-medium text-primary hover:text-primary/90"
          >
            {linkText}
          </a>
        </div>
      </div>
    </Card>
  );
}
