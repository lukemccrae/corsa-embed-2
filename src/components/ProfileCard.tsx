import { useMemo } from "react";
import { Button } from "primereact/button";
import { ElapsedTime } from "./ElapsedTime";
import { useTheme } from "./ThemeProvider";

type LiveProfileCardProps = {
  username: string;
  profilePicture?: string;
  streamTitle?: string;
  startTime?: Date;
  finishTime?: string | null;
  timezone?: string | null;
  isLive?: boolean;
  routeId?: string | null;
  routeName?: string | null;
  onFollowClick?: () => void;
  showSettings?: boolean;
  onSettingsClick?: () => void;
};

export default function LiveProfileCard({
  username,
  profilePicture,
  streamTitle,
  startTime,
  finishTime,
  timezone,
  // isLive,
  routeId,
  routeName,
  showSettings,
  onSettingsClick,
}: LiveProfileCardProps) {
  const { theme } = useTheme();

  const cardBg =
    theme === "dark"
      ? "bg-gray-900/95 border-gray-700"
      : "bg-white/95 border-gray-200";

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const mutedColor = theme === "dark" ? "text-gray-400" : "text-gray-600";

  // const tzAbbr = useMemo(() => {
  //   if (!timezone) return null;
  //   try {
  //     return (
  //       new Intl.DateTimeFormat("en-US", {
  //         timeZone: timezone,
  //         timeZoneName: "short",
  //       })
  //         .formatToParts(new Date())
  //         .find((p) => p.type === "timeZoneName")?.value ?? null
  //     );
  //   } catch {
  //     return null;
  //   }
  // }, [timezone]);

  // Derive the effective display status:
  // - "upcoming" when startTime is still in the future
  // - "live" when isLive is true and start has passed
  // - "finished" when isLive is false
  // - undefined when isLive is not provided (no badge)
  // const effectiveStatus = useMemo(():
  //   | "live"
  //   | "upcoming"
  //   | "finished"
  //   | undefined => {
  //   if (isLive === undefined) return undefined;
  //   if (startTime && startTime > new Date()) return "upcoming";
  //   return isLive ? "live" : "finished";
  // }, [isLive, startTime]);

  const formattedStart = useMemo(() => {
    if (!startTime) return null;
    try {
      return startTime.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone ?? undefined,
      });
    } catch {
      return startTime.toLocaleString();
    }
  }, [startTime, timezone]);

  const formattedFinish = useMemo(() => {
    if (!finishTime) return null;
    try {
      return new Date(finishTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone ?? undefined,
      });
    } catch {
      return null;
    }
  }, [finishTime, timezone]);

  return (
    <div
      className={`relative ${cardBg} border rounded-lg shadow-lg backdrop-blur-sm p-4`}
    >
      {showSettings && (
        <Button
          icon="pi pi-cog"
          rounded
          text
          severity="secondary"
          size="small"
          className="!absolute !top-2 !right-2"
          onClick={onSettingsClick}
          aria-label="Stream settings"
        />
      )}
      <div className="flex items-start gap-3">
        {/* Profile Picture with LIVE badge */}
        <div className="relative flex-shrink-0 block">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={username}
              className="w-16 h-16 rounded-full object-cover overflow-hidden ring-2 ring-white dark:ring-gray-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-800 text-xl font-bold">
              {username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Stream Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className={`text-lg font-bold ${textColor} truncate`}
                >
                  {username}
                </h2>
                {/* {effectiveStatus !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      effectiveStatus === "live"
                        ? "bg-red-500/10 text-red-500 border border-red-500/30"
                        : effectiveStatus === "upcoming"
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {effectiveStatus === "live" && <LiveDot />}
                    {effectiveStatus === "live"
                      ? "LIVE"
                      : "UPCOMING"
                      }
                  </span>
                )} */}
              </div>
              <p className={`text-sm ${mutedColor} truncate`}>
                {streamTitle || "Live Stream"}
              </p>
              {routeId && (
                <div className="inline-flex items-center gap-1 mt-1 text-sm text-blue-500">
                  <i className="pi pi-map text-xs" />
                  <span>{routeName || "View Route"}</span>
                </div>
              )}
            </div>

            {/* Follow Button */}
            {/* <Button
              label="Follow"
              icon="pi pi-heart"
              className="p-button-rounded p-button-outlined flex-shrink-0"
              size="small"
              onClick={() => {}}
            /> */}
          </div>

          {/* Stats row */}
          {startTime && (
            <div
              className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm ${mutedColor}`}
            >
              <div className="flex items-center gap-1">
                <i className="pi pi-clock text-xs" />
                <span className="inline-block tabular-nums min-w-[8ch] text-right">
                  <ElapsedTime startTime={startTime} finishTime={finishTime} />
                </span>
              </div>

              {formattedStart && (
                <div className="flex items-center gap-1">
                  <i className="pi pi-calendar text-xs" />
                  <span>{formattedStart}</span>
                </div>
              )}

              {formattedFinish && (
                <div className="flex items-center gap-1">
                  <i className="pi pi-flag text-xs" />
                  <span>{formattedFinish}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
