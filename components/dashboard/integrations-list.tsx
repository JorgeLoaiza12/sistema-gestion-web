import { Card } from "@/components/ui/card";

const integrations = [
  {
    name: "Stripe",
    type: "Finance",
    rate: 40,
    profit: "$650.00",
    icon: "💳",
  },
  {
    name: "Zapier",
    type: "CRM",
    rate: 80,
    profit: "$720.50",
    icon: "⚡",
  },
  {
    name: "Shopify",
    type: "Marketplace",
    rate: 20,
    profit: "$432.25",
    icon: "🛍️",
  },
];

export function IntegrationsList() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Lista de integraciones</h3>
        <button className="text-primary text-sm">Ver todo</button>
      </div>
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <h4 className="font-medium">{integration.name}</h4>
                <p className="text-sm text-gray-500">{integration.type}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{integration.profit}</div>
              <div className="text-sm text-gray-500">{integration.rate}%</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
