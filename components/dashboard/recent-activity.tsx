interface Activity {
  id: string;
  type: string;
  description: string;
  date: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-background rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-content-emphasis mb-4">
        Actividad Reciente
      </h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 text-sm">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-primary" />
            <div>
              <p className="text-content">{activity.description}</p>
              <p className="text-content-subtle">{activity.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
