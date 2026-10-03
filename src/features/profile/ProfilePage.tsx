import { useState } from "react";
import { Download, FileDown, Trash2, UserPlus, HelpCircle, FileText, Sparkles } from "lucide-react";
import { ProfileHeaderCard } from "./components/ProfileHeaderCard";
import { Card } from "../../components/ui/Card";
import { Switch } from "../../components/ui/Switch";
import { Select, TextInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useAppState } from "../../state/AppStateContext";
import { useToast } from "../../components/ui/Toast";
import { loadLocal } from "../../lib/storage";

export function ProfilePage() {
  const { prefs, setPrefs, simulateOffline, setSimulateOffline, setOnboardingComplete } = useAppState();
  const { show } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [guardianInviteOpen, setGuardianInviteOpen] = useState(false);
  const [guardianEmail, setGuardianEmail] = useState("");
  const onboardingSkipped = loadLocal("onboardingSkipped", false);

  return (
    <div className="pb-6 space-y-5 pt-2 max-w-xl">
      <h2 className="text-xl font-bold text-ink">Profile &amp; settings</h2>

      <ProfileHeaderCard />

      {onboardingSkipped && (
        <Card className="bg-amber-surface border-amber/20 flex items-center gap-3">
          <Sparkles className="size-5 text-amber shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-ink text-[15px]">Finish setting up your plan</p>
            <p className="text-sm text-ink-secondary">A couple of steps are still pending.</p>
          </div>
          <Button size="sm" onClick={() => setOnboardingComplete(false)}>
            Resume
          </Button>
        </Card>
      )}

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Study preferences</h3>
        <div className="space-y-3 divide-y divide-border">
          <Switch
            label="Reminders"
            description="We only remind you when something is due for review."
            checked={prefs.notificationsEnabled ?? false}
            onChange={(v) => setPrefs({ notificationsEnabled: v })}
          />
          <div className="pt-3">
            <Switch
              label="Low-data mode"
              description="Reduces images and background syncing to save data."
              checked={prefs.lowDataMode}
              onChange={(v) => setPrefs({ lowDataMode: v })}
            />
          </div>
          <div className="pt-3">
            <Switch
              label="Simulate offline (preview only)"
              description="Toggle to preview how the app behaves without a connection."
              checked={simulateOffline}
              onChange={setSimulateOffline}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Language &amp; accessibility</h3>
        <div className="space-y-4">
          <Select label="Language" value={prefs.language} onChange={(e) => setPrefs({ language: e.target.value as "en" | "pcm" })}>
            <option value="en">English</option>
            <option value="pcm">Pidgin</option>
          </Select>
          <Select label="Text size" value={prefs.fontSize} onChange={(e) => setPrefs({ fontSize: e.target.value as typeof prefs.fontSize })}>
            <option value="default">Default</option>
            <option value="large">Large</option>
            <option value="larger">Larger</option>
          </Select>
          <Switch
            label="Reduce motion"
            description="Minimises animations throughout the app."
            checked={prefs.reducedMotion}
            onChange={(v) => setPrefs({ reducedMotion: v })}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Downloaded content &amp; storage</h3>
        <ul className="space-y-2.5">
          {[
            { name: "Mathematics", size: "24 MB", downloaded: true },
            { name: "English Language", size: "18 MB", downloaded: true },
            { name: "Biology", size: "21 MB", downloaded: false },
            { name: "Chemistry", size: "19 MB", downloaded: false },
          ].map((s) => (
            <li key={s.name} className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-medium text-ink">{s.name}</p>
                <p className="text-xs text-ink-secondary">{s.downloaded ? `Downloaded · ${s.size}` : `Not downloaded · ${s.size}`}</p>
              </div>
              <Button
                size="sm"
                variant={s.downloaded ? "secondary" : "primary"}
                onClick={() => show(s.downloaded ? `Removed ${s.name} from this device.` : `Downloading ${s.name} for offline use…`, "info")}
              >
                {s.downloaded ? "Remove" : <><Download className="size-3.5" aria-hidden="true" /> Download</>}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Parent / guardian</h3>
        <p className="text-[15px] text-ink-secondary mb-3">
          Connect a parent or guardian so they can see a weekly summary of your progress. They won't see your tutor
          conversations.
        </p>
        <Button variant="secondary" onClick={() => setGuardianInviteOpen(true)}>
          <UserPlus className="size-4" aria-hidden="true" /> Invite a parent or guardian
        </Button>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Privacy &amp; data</h3>
        <div className="space-y-2.5">
          <Button variant="secondary" fullWidth onClick={() => show("We've emailed you a copy of your data.", "success")}>
            <FileDown className="size-4" aria-hidden="true" /> Export my data
          </Button>
          <Button variant="destructive" fullWidth onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" aria-hidden="true" /> Delete my account
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Help &amp; legal</h3>
        <ul className="space-y-1">
          <li>
            <button onClick={() => show("Support articles aren't available in this preview.", "info")} className="flex items-center gap-2.5 w-full text-left py-2 text-[15px] text-ink hover:text-sage">
              <HelpCircle className="size-4.5 text-ink-secondary" aria-hidden="true" /> Help &amp; support
            </button>
          </li>
          <li>
            <button onClick={() => show("Terms and AI-feedback disclaimer aren't available in this preview.", "info")} className="flex items-center gap-2.5 w-full text-left py-2 text-[15px] text-ink hover:text-sage">
              <FileText className="size-4.5 text-ink-secondary" aria-hidden="true" /> Terms &amp; AI-feedback disclaimer
            </button>
          </li>
        </ul>
        <p className="text-xs text-ink-secondary mt-3 pt-3 border-t border-border leading-relaxed">
          Astra's AI gives study guidance, not official grades. For school-assessed work, a teacher reviews or
          approves the final mark.
        </p>
      </Card>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                show("Account deletion requested. This isn't wired up in this preview.", "info");
              }}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        This permanently removes your study history, progress, and submissions. This can't be undone.
      </Modal>

      <Modal
        open={guardianInviteOpen}
        onClose={() => setGuardianInviteOpen(false)}
        title="Invite a parent or guardian"
        footer={
          <Button
            fullWidth
            disabled={!guardianEmail.includes("@")}
            onClick={() => {
              setGuardianInviteOpen(false);
              show(`Invitation sent to ${guardianEmail}.`, "success");
              setGuardianEmail("");
            }}
          >
            Send invite
          </Button>
        }
      >
        <TextInput
          label="Guardian's email"
          type="email"
          placeholder="parent@example.com"
          value={guardianEmail}
          onChange={(e) => setGuardianEmail(e.target.value)}
        />
      </Modal>
    </div>
  );
}
