import { PrimeReactProvider } from "primereact/api";
import { UserProvider } from "./context/UserContext";
import { StreamPage } from "./components/StreamPage";
import ThemeProvider from "./components/ThemeProvider";
import "./embed.css";

interface AppProps {
  username: string;
  streamId: string;
}

export default function App({ username, streamId }: AppProps) {
  return (
    <PrimeReactProvider>
      <ThemeProvider>
        <UserProvider>
          <StreamPage username={username} streamId={streamId} />
        </UserProvider>
      </ThemeProvider>
    </PrimeReactProvider>
  );
}
