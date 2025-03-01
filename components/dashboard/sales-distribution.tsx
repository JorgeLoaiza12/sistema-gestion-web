import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const salesData = [
  {
    source: "Website",
    amount: "$374.82",
    percentage: 45,
    color: "bg-primary",
  },
  {
    source: "Mobile App",
    amount: "$241.60",
    percentage: 30,
    color: "bg-secondary",
  },
  {
    source: "Other",
    amount: "$213.42",
    percentage: 25,
    color: "bg-accent",
  },
];

export function SalesDistribution() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Distribución de ventas</h3>
        <Select defaultValue="monthly">
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Diario</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {/* Gráfico circular */}
        <div className="relative aspect-square">
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {salesData.map((item, index) => {
                const startAngle = salesData
                  .slice(0, index)
                  .reduce((acc, curr) => acc + curr.percentage, 0);
                const endAngle = startAngle + item.percentage;

                const x1 = 50 + 40 * Math.cos((startAngle / 100) * 2 * Math.PI);
                const y1 = 50 + 40 * Math.sin((startAngle / 100) * 2 * Math.PI);
                const x2 = 50 + 40 * Math.cos((endAngle / 100) * 2 * Math.PI);
                const y2 = 50 + 40 * Math.sin((endAngle / 100) * 2 * Math.PI);

                const largeArcFlag = item.percentage > 50 ? 1 : 0;

                return (
                  <path
                    key={item.source}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    className={item.color}
                    opacity={0.8}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Leyenda y detalles */}
        <div className="space-y-4">
          {salesData.map((item) => (
            <div
              key={item.source}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <div>
                  <p className="font-medium">{item.source}</p>
                  <p className="text-sm text-gray-500">{item.percentage}%</p>
                </div>
              </div>
              <p className="font-medium">{item.amount}</p>
            </div>
          ))}
        </div>

        {/* Barra de progreso total */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Progreso total</span>
            <span className="font-medium">78%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: "78%" }}></div>
          </div>
        </div>
      </div>
    </Card>
  );
}
