import { domainConfig } from "../context/DomainContext";

export type SubscriptionCallback<T> = (data: T) => void;
export type UnsubscribeFn = () => void;

interface AppSyncMessage {
  type: string;
  id?: string;
  payload?: {
    data?: string;
    errors?: Array<{ message: string }>;
  };
}

/**
 * Subscribe to an AppSync real-time subscription using a Firebase ID token
 * for OIDC authorization.
 *
 * Returns an unsubscribe function.
 */
export function appsyncSubscribe<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
  onData: SubscriptionCallback<T>,
  onError?: (err: Error) => void
): UnsubscribeFn {
  const endpoint = domainConfig.appsyncRealtimeEndpoint;
  if (!endpoint) {
    onError?.(new Error("AppSync realtime endpoint not configured"));
    return () => {};
  }

  // AppSync realtime protocol requires base64-encoded auth + payload headers
  const header = btoa(
    JSON.stringify({ Authorization: `Bearer ${token}` })
  );
  const payload = btoa(JSON.stringify({}));
  const url = `${endpoint}?header=${header}&payload=${payload}`;

  const ws = new WebSocket(url, "graphql-ws");
  const subscriptionId = crypto.randomUUID();
  let closed = false;

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "connection_init" }));
  };

  ws.onmessage = (event: MessageEvent) => {
    const msg: AppSyncMessage = JSON.parse(event.data as string) as AppSyncMessage;

    switch (msg.type) {
      case "connection_ack":
        ws.send(
          JSON.stringify({
            id: subscriptionId,
            type: "start",
            payload: {
              data: JSON.stringify({ query, variables }),
              extensions: {
                authorization: {
                  Authorization: `Bearer ${token}`,
                },
              },
            },
          })
        );
        break;

      case "data":
        if (msg.payload?.data) {
          const parsed = JSON.parse(msg.payload.data) as { data: T };
          onData(parsed.data);
        }
        if (msg.payload?.errors) {
          onError?.(
            new Error(msg.payload.errors.map((e) => e.message).join("; "))
          );
        }
        break;

      case "ka":
        // keep-alive — ignore
        break;

      case "connection_error":
        onError?.(new Error("AppSync connection error"));
        break;

      default:
        break;
    }
  };

  ws.onerror = () => {
    if (!closed) {
      onError?.(new Error("WebSocket error"));
    }
  };

  return () => {
    closed = true;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: subscriptionId, type: "stop" }));
      ws.close();
    }
  };
}
