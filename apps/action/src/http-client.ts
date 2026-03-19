import type { HttpClient } from "./upload";

export function createHttpClient(): HttpClient {
  return {
    async post(url, body, headers) {
      const response = await fetch(url, {
        method: "POST",
        body: body as BodyInit,
        headers,
      });

      return { status: response.status };
    },
  };
}
