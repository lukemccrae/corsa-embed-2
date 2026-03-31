import { PrimeReactProvider } from "primereact/api";
import { UserProvider } from "./context/UserContext";
import { StreamPage } from "./components/StreamPage";
import { RoutePage } from "./components/RoutePage";
import ThemeProvider from "./components/ThemeProvider";
import "./embed.css";

interface AppProps {
  username: string;
  /** streamId for stream embed mode */
  streamId?: string;
  /** routeId for route embed mode */
  routeId?: string;
  /** "stream" (default) | "route" */
  view?: "stream" | "route";
}

export default function App({ username, streamId, routeId, view }: AppProps) {
  const resolvedView: "stream" | "route" =
    view === "route" || (!streamId && routeId) ? "route" : "stream";

  return (
    <PrimeReactProvider>
      <ThemeProvider>
        <UserProvider>
          {resolvedView === "route" && routeId ? (
            <RoutePage username={username} routeId={routeId} />
          ) : streamId ? (
            <StreamPage username={username} streamId={streamId} />
          ) : (
            <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
              Missing stream or route configuration.
            </div>
          )}
        </UserProvider>
      </ThemeProvider>
    </PrimeReactProvider>
  );
}
