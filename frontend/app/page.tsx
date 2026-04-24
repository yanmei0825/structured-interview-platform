"use client";

import React, { useEffect, useState } from "react";
import LanguageSelect from "../components/LanguageSelect";
import DemographicsForm from "../components/DemographicsForm";
import InterviewChat from "../components/InterviewChat";
import { createSession, setLanguage, submitDemographics, Language, DimensionKey } from "../lib/api";

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID ?? "";

type Step = "lang" | "demo" | "chat" | "error";

interface ChatReady {
  token: string;
  language: Language;
  intro: string;
  initialDimension: DimensionKey;
  initialCoverage: Record<DimensionKey, { covered: boolean; turnCount: number }>;
  demographicsEnabled: boolean;
}

export default function Home() {
  const [step, setStep] = useState<Step>("lang");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [token, setToken] = useState("");
  const [language, setLang] = useState<Language | null>(null);
  const [chatReady, setChatReady] = useState<ChatReady | null>(null);

  useEffect(() => {
    if (!PROJECT_ID) {
      setErrorMsg("NEXT_PUBLIC_PROJECT_ID is not set in .env.local");
      setStep("error");
      return;
    }
    createSession(PROJECT_ID)
      .then((r) => setToken(r.token))
      .catch((e) => {
        setErrorMsg(e.message);
        setStep("error");
      });
  }, []);

  const handleLanguage = async (lang: Language) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await setLanguage(token, lang);
      setLang(lang);

      if (res.intro) {
        setChatReady({
          token,
          language: lang,
          intro: res.intro,
          initialDimension: "D1",
          initialCoverage: buildEmptyCoverage(),
        } as ChatReady);
        setStep("chat");
      } else {
        setStep("demo");
      }
    } catch (e: any) {
      setErrorMsg(e.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemographics = async (data: Record<string, string>) => {
    if (!token || !language) return;
    setLoading(true);
    try {
      const res = await submitDemographics(token, data);
      setChatReady({
        token,
        language,
        intro: res.intro ?? "",
        initialDimension: "D1",
        initialCoverage: buildEmptyCoverage(),
      } as ChatReady);
      setStep("chat");
    } catch (e: any) {
      setErrorMsg(e.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {step !== "chat" && (
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          {step === "lang" && (
            <LanguageSelect onSelect={handleLanguage} loading={loading || !token} />
          )}
          {step === "demo" && language && (
            <DemographicsForm language={language} onSubmit={handleDemographics} loading={loading} />
          )}
          {step === "error" && (
            <div className="text-center">
              <p className="text-red-400 text-sm max-w-sm">{errorMsg}</p>
            </div>
          )}
        </div>
      )}

      {step === "chat" && chatReady && (
        <div className="flex flex-1 min-h-0 p-4 lg:p-6" style={{ height: "100vh" }}>
          <InterviewChat
            token={chatReady.token}
            language={chatReady.language}
            intro={chatReady.intro}
            initialDimension={chatReady.initialDimension}
            initialCoverage={chatReady.initialCoverage}
          />
        </div>
      )}
    </div>
  );
}

function buildEmptyCoverage(): Record<DimensionKey, { covered: boolean; turnCount: number }> {
  const keys: DimensionKey[] = ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10"];
  return Object.fromEntries(keys.map((k) => [k, { covered: false, turnCount: 0 }])) as Record<DimensionKey, { covered: boolean; turnCount: number }>;
}
