import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import surveyRouter from "./routes/survey";
import companyRouter from "./routes/company";
import { seedDefaultProject } from "./seed";
dotenv.config();
seedDefaultProject();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.path}`);
  next();
});

app.use('/voice_files', express.static('voice_files'));

app.use('/survey/:token/voice/transcribe', express.raw({ type: 'audio/*', limit: '50mb' }));
app.use('/survey/:token/voice/send', express.raw({ type: 'audio/*', limit: '50mb' }));
app.use('/survey/:token/voice/speak/stream', express.raw({ type: 'audio/*', limit: '50mb' }));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "interview-backend" });
});
app.get("/test", (_req, res) => {
  res.json({ message: "Test route works" });
});

app.get("/usage", (_req, res) => {
  const { getUsageSummary, getUsageLog } = require("./llm");
  const { getEvents } = require("./session");
  const events: any[] = getEvents();
  const eventSummary: Record<string, number> = {};
  for (const e of events) {
    eventSummary[e.event] = (eventSummary[e.event] ?? 0) + 1;
  }

  res.json({
    llm: { summary: getUsageSummary(), log: getUsageLog() },
    events: { summary: eventSummary, total: events.length, log: events.slice(-200) },
  });
});

app.use("/survey", surveyRouter);
app.use("/companies", companyRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
