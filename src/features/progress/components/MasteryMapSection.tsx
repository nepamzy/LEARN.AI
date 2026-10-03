import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import type { Subject } from "../../../lib/types";
import { topics, getMasteryForTopic } from "../../../lib/mockData";
import { Card } from "../../../components/ui/Card";
import { MasteryTag } from "../../../components/ui/StatusTag";
import { SkillBar } from "../../../components/ui/Progress";
import { cx } from "../../../lib/utils";

export function MasteryMapSection({ subject }: { subject: Subject }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const topLevel = topics.filter((t) => t.subjectId === subject.id && !t.parentTopicId);

  return (
    <Card padded={false}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between p-4 sm:p-5"
      >
        <h3 className="font-bold text-ink text-[16px]">{subject.name}</h3>
        <ChevronDown className={cx("size-4.5 text-ink-secondary transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <ul className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
          {topLevel.map((topic) => {
            const subtopics = topics.filter((t) => t.parentTopicId === topic.id);
            const mastery = getMasteryForTopic(topic.id);
            return (
              <li key={topic.id}>
                <button
                  onClick={() => navigate(`/progress/topic/${topic.id}`)}
                  className="w-full text-left rounded-xl border border-border hover:border-sage/50 px-3.5 py-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-[15px] text-ink">{topic.name}</span>
                    {mastery && <MasteryTag status={mastery.status} />}
                  </div>
                  {mastery && <SkillBar value={mastery.masteryProbability * 100} tone={subject.color === "amber" ? "amber" : "sage"} />}
                </button>

                {subtopics.length > 0 && (
                  <ul className="mt-2 ml-4 space-y-2 border-l border-border pl-3">
                    {subtopics.map((sub) => {
                      const subMastery = getMasteryForTopic(sub.id);
                      return (
                        <li key={sub.id}>
                          <button
                            onClick={() => navigate(`/progress/topic/${sub.id}`)}
                            className="w-full text-left rounded-lg hover:bg-[#F8F7F2] px-2.5 py-2 transition-colors flex items-center justify-between gap-2"
                          >
                            <span className="text-sm text-ink">{sub.name}</span>
                            {subMastery && <MasteryTag status={subMastery.status} />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
