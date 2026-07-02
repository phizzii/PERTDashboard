import { spawn } from "node:child_process";
import process from "node:process";

const processes = [];
let shuttingDown = false;

function start(name, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });

  processes.push(child);

  const prefix = `[${name}]`;
  child.stdout.on("data", (chunk) => {
    process.stdout.write(`${prefix} ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`${prefix} ${chunk}`);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`${prefix} exited with ${reason}`);
    shutdown(code ?? 1);
  });

  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
  setTimeout(() => process.exit(code), 100);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const pythonCommand = process.env.PERT_PYTHON ?? "python3";
const backendPort = process.env.BACKEND_PORT ?? "8000";

start("backend", pythonCommand, [
  "-m",
  "uvicorn",
  "backend.main:app",
  "--host",
  "127.0.0.1",
  "--port",
  backendPort,
]);

start("frontend", "vite", []);
