import { Bell } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { MarkActivitySeen } from "@/components/mark-activity-seen";
import { PushToggle } from "@/components/push-toggle";
import { recentActivity } from "@/lib/activity";
import { describeActivity, timeAgo } from "@/lib/activity-format";
import { avatarUrls } from "@/lib/avatars";

export const metadata = { title: "Aktivität · Foodie" };

export default async function ActivityPage() {
  const items = await recentActivity();
  const avatars = avatarUrls();

  return (
    <div className="space-y-5">
      <h1 className="px-2 font-display text-4xl font-semibold">Aktivität</h1>
      <MarkActivitySeen uptoId={items[0]?.id ?? 0} />
      <PushToggle />

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center text-muted">
          <Bell className="mb-3 size-8" strokeWidth={1.5} />
          <p className="max-w-xs">Noch nichts passiert. Sobald einer von euch etwas einträgt, steht es hier.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-line rounded-3xl">
          {items.map((item) => {
            const body = (
              <>
                <Avatar person={item.actor} url={avatars[item.actor]} className="size-8 text-xs" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{describeActivity(item)}</span>
                  <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {item.restaurantId ? (
                  <Link href={`/restaurants/${item.restaurantId}`} className="flex items-start gap-3 p-3">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 p-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
