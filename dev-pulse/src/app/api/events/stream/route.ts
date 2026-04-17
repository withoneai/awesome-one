import { registerClient, removeClient, getEvents } from "@/lib/event-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      registerClient(controller);

      // Send an immediate comment so the browser triggers onopen
      controller.enqueue(new TextEncoder().encode(": connected\n\n"));

      // Send existing events as initial data
      const existing = getEvents(20);
      for (const event of existing.reverse()) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      }

      // Keep-alive ping every 30s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
          removeClient(controller);
        }
      }, 30000);

      // Cleanup on close
      const originalCancel = controller.close.bind(controller);
      controller.close = () => {
        clearInterval(keepAlive);
        removeClient(controller);
        originalCancel();
      };
    },
    cancel(controller) {
      removeClient(controller as unknown as ReadableStreamDefaultController);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
