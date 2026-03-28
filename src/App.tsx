import { UserProvider } from "./context/UserContext";
import { StreamPage } from "./components/StreamPage";
import "./embed.css";

interface AppProps {
  username: string;
  streamId: string;
}

export default function App({ username, streamId }: AppProps) {
  return (
    <UserProvider>
      <StreamPage username={username} streamId={streamId} />
    </UserProvider>
  );
}
