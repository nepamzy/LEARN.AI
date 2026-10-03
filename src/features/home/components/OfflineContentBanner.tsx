import { DownloadCloud } from "lucide-react";
import { Banner } from "../../../components/ui/Banner";

export function OfflineContentBanner() {
  return (
    <Banner tone="info" icon={<DownloadCloud className="size-4.5 shrink-0" aria-hidden="true" />}>
      Mathematics and English are downloaded for offline use. Chemistry and Biology need Wi-Fi to download.
    </Banner>
  );
}
