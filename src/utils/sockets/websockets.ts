import WebSocket from "ws";
import console from "node:console";

export async function listenOrderbookWebsocket<T>({
  assets: { baseAsset, quoteAsset },
  client,
  message,
  channel,
  wsUri,
  decoder,
  cb,
}: {
  assets: { baseAsset: string; quoteAsset: string };
  message?: Object;
  channel?: string;
  client: string;
  wsUri: string;
  decoder: (data: unknown) => T;
  cb: (entries: T) => void;
}): Promise<void> {
  const wsClient = new WebSocket(wsUri);

  wsClient.on("open", () => {
    console.log(
      `Listening orderbook for ${baseAsset}/${quoteAsset} at ${client}`
    );
    if (message) {
      wsClient.send(JSON.stringify(message));
    }
  });

  wsClient.on("message", async (data: string) => {
    const response = JSON.parse(data);
    if (!channel || response?.channel === channel) {
      const orderbookEntries = decoder(response);
      await cb(orderbookEntries);
    }
  });

  wsClient.on("close", () => {
    console.log(
      "Websocket connection closed for ${baseAsset}/${quoteAsset} at ${client}"
    );
  });

  wsClient.on("error", (error) => {
    console.error(
      "Websocket error for ${baseAsset}/${quoteAsset} at ${client}:",
      error
    );
  });
}


