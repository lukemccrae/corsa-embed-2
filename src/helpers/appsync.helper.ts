import { domainConfig } from "../context/DomainContext";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Execute an AppSync GraphQL request using a Firebase ID token as Bearer auth
 * (OIDC authorization mode).
 */
export async function appsyncRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> {
  const res = await fetch(domainConfig.appsyncEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`AppSync HTTP error: ${res.status} ${res.statusText}`);
  }

  const json: GraphQLResponse<T> = (await res.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  if (json.data === undefined) {
    throw new Error("AppSync returned no data");
  }

  return json.data;
}
