import { achievements } from "../../../lib/mockData";
import { AchievementBadge } from "../../../components/domain/AchievementBadge";

export function AchievementsStrip() {
  if (achievements.length === 0) return null;
  return (
    <div>
      <h3 className="font-bold text-ink text-[17px] mb-3">Recent achievements</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {achievements.map((a) => (
          <AchievementBadge key={a.id} achievement={a} />
        ))}
      </div>
    </div>
  );
}
