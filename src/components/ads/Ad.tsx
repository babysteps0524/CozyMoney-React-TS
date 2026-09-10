import { useEffect } from "react";
export function Ad({ slot }: { slot?: string }) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  useEffect(() => {
    if (!client) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
        {},
      );
    } catch {}
  }, [client]);
  return (
    <aside
      aria-label="광고"
      className="w-full min-h-22 overflow-hidden rounded-xl border border-cm-line bg-cm-surface2 flex items-center justify-center"
    >
      {client ? (
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={client}
          data-ad-slot={slot || ""}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <span className="text-xs text-cm-muted">광고</span>
      )}
    </aside>
  );
}
