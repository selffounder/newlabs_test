import { spawn } from "child_process";

// Named export for the POST HTTP method (required in App Router)
export async function POST(req: Request) {
  try {
    const { key, query } = await req.json();

    if (!key || !query) {
      return Response.json({ error: "Missing key or query" }, { status: 400 });
    }

    const py = spawn("python", ["rag_runner.py", key, query], {
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    return new Promise<Response>((resolve) => {
      py.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      py.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error("🐍 STDERR:", data.toString());
      });

      py.on("close", () => {
        const lines = stdout.trim().split("\n");
        const logs = lines.filter((line) => line.startsWith("["));
        const jsonLine = lines.find((line) => line.startsWith("{"));

        if (!jsonLine) {
          return resolve(
            Response.json(
              {
                error: "No valid JSON output from Python.",
                logs,
                raw: stdout || "[empty]",
              },
              { status: 500 }
            )
          );
        }

        try {
          const parsed = JSON.parse(jsonLine);
          return resolve(Response.json({ ...parsed, logs }));
        } catch {
          return resolve(
            Response.json(
              {
                error: "Failed to parse JSON output.",
                logs,
                raw: stdout,
              },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (e) {
    console.error("🔥 API Route Error:", e);
    return Response.json({ error: "Server crashed" }, { status: 500 });
  }
}
