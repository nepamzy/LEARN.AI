import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { LinearProgress } from "../../../components/ui/Progress";

export function ContinueCard() {
  return (
    <Card>
      <h3 className="font-bold text-ink text-[17px] mb-3">Continue where you left off</h3>
      <Link to="/assignments/asg-1" className="flex items-center gap-3 group">
        <span className="size-10 rounded-xl bg-amber-surface text-amber flex items-center justify-center shrink-0">
          <PlayCircle className="size-5" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-ink group-hover:text-sage-hover truncate">
            Essay: "The importance of qualitative education…"
          </p>
          <div className="mt-1.5 max-w-xs">
            <LinearProgress value={40} label="40% drafted · about 20 min left" showPercentLabel tone="amber" />
          </div>
        </div>
      </Link>
    </Card>
  );
}
