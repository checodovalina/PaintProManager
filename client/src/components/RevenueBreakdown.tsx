import { RevenueBreakdownItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RevenueBreakdownProps {
  data: RevenueBreakdownItem[];
}

export default function RevenueBreakdown({ data }: RevenueBreakdownProps) {
  // If there's no data, get default values
  const defaultData: RevenueBreakdownItem[] = data.length
    ? data
    : [
        {
          title: "Total Revenue",
          value: 98500,
          percentage: 100,
          color: "bg-primary",
        },
        {
          title: "Materials Cost",
          value: 27250,
          percentage: 28,
          color: "bg-secondary",
        },
        {
          title: "Labor Cost",
          value: 28750,
          percentage: 29,
          color: "bg-accent",
        },
        {
          title: "Net Profit",
          value: 42500,
          percentage: 43,
          color: "bg-success",
        },
      ];

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-900">
          Revenue Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {defaultData.slice(0, 3).map((item, index) => (
            <div key={index}>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {item.title}
              </h3>
              <p className="text-xl font-bold text-gray-900">
                ${item.value.toLocaleString()}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${item.color} h-2.5 rounded-full`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {defaultData[3].title}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            ${defaultData[3].value.toLocaleString()}
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`${defaultData[3].color} h-2.5 rounded-full`}
              style={{ width: `${defaultData[3].percentage}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
