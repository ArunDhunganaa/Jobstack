"use client";
import { useState, useEffect } from "react";
import Script from "next/script";
import constants, { buildPresenceChecklist } from "@/lib/constant";
import { loadPdfJs } from "@/lib/utils";
// ----------------------
// Types
// ----------------------
type PDFJSLib = typeof import("pdfjs-dist");

type MetricScore = number;

export type PerformanceMetrics = {
  formatting: MetricScore;
  contentQuality: MetricScore;
  keywordUsage: MetricScore;
  atsCompatibility: MetricScore;
  quantifiableAchievements: MetricScore;
};

export type AnalysisReport = {
  overallScore: string;
  strengths: string[];
  improvements: string[];
  keywords: string[];
  summary: string;
  performanceMetrics: PerformanceMetrics;
  actionItems: string[];
  proTips: string[];
  atsChecklist: string[];
  error?: string;
};

type PresenceChecklistItem = {
  label: string;
  present: boolean;
};

// ----------------------
// Component
// ----------------------
export default function AnalyzerPage() {
  const [aiReady, setAiReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [presenceChecklist, setPresenceChecklist] = useState<
    PresenceChecklistItem[]
  >([]);
  const [pdfjsLib, setPdfjsLib] = useState<PDFJSLib | null>(null);

  // ----------------------
  // Puter AI ready check
  // ----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setAiReady(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // ----------------------
  // Load PDF.js dynamically
  // ----------------------
  useEffect(() => {
    (async () => {
      const lib = await loadPdfJs();
      if (lib) setPdfjsLib(lib);
      console.log("✅ PDF.js Loaded:", lib?.version);
    })();
  }, []);
  const reset = () => {
    setUploadedFile(null);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);
    setIsLoading(false);
  };
  // ----------------------
  // Extract text from PDF
  // ----------------------
  const extractPDFText = async (file: File): Promise<string> => {
    if (!pdfjsLib) throw new Error("PDF.js not loaded yet");

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const texts = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        return content.items.map((item: any) => item.str).join(" ");
      }),
    );

    return texts.join("\n").trim();
  };

  // ----------------------
  // Parse AI JSON response
  // ----------------------
  const parseJsonResponse = (reply: string): AnalysisReport => {
    try {
      const match = reply.match(/{.*}/s);
      const parsed: AnalysisReport = match
        ? JSON.parse(match[0])
        : ({} as AnalysisReport);
      if (!parsed.overallScore && !parsed.error) {
        throw new Error("Invalid AI response");
      }
      return parsed;
    } catch (err: any) {
      throw new Error(`Failed to parse AI response: ${err.message}`);
    }
  };

  // ----------------------
  // Call Puter AI to analyze resume
  // ----------------------
  const analyzeResume = async (text: string): Promise<AnalysisReport> => {
    if (!window.puter?.ai?.chat) throw new Error("Puter AI not ready");

    const prompt = constants.ANALYZE_RESUME_PROMPT.replace(
      "{{DOCUMENT_TEXT}}",
      text,
    );
    const response = await window.puter.ai.chat(
      [
        { role: "system", content: "You are an expert resume reviewer." },
        { role: "user", content: prompt },
      ],
      { model: "gpt-4o" },
    );

    const result = parseJsonResponse(
      typeof response === "string" ? response : response.message?.content || "",
    );

    if (result.error) throw new Error(result.error);
    return result;
  };

  // ----------------------
  // Handle file upload
  // ----------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      return alert("Please upload a PDF file only.");
    }

    setUploadedFile(file);
    setIsLoading(true);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);

    try {
      const text = await extractPDFText(file);
      setResumeText(text);
      setPresenceChecklist(buildPresenceChecklist(text));

      // Run AI analysis
      const aiResult = await analyzeResume(text);
      setAnalysis(aiResult);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------
  // Render
  // ----------------------
  return (
    <>
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
      <div className="bg-main-gradient flex min-h-screen items-center justify-center px-4 pt-[124px] sm:px-6 lg:px-8">
        <div className="max-w 5xl mx-auto w-full">
          <div className="mb-6 text-center">
            <h1 className="mb-2 bg-gradient-to-r from-cyan-300 via-teal-200 to-sky-300 bg-clip-text text-5xl font-light text-transparent sm:text-6xl lg:text-7xl">
              Resume Analyzer
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Upload your pdf resume and get instant feedback
            </p>
            {!uploadedFile && (
              <div className="upload-area">
                <div className="upload-zone">
                  <div className="mb-4 text-2xl">&#128196;</div>
                  <h3 className="mb-2 text-xl text-slate-200 sm:text-2xl">
                    Upload your resume
                  </h3>
                  <p className="text:sm mb-4 text-slate-400 sm:mb-6 sm:text-base">
                    PDF files only . Get instant analysis
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={!aiReady}
                    className="hidden"
                    id="file-upload"
                    title="file-upload"
                  ></input>
                  <label
                    htmlFor="file-upload"
                    className={`btn-primary inline-block ${!aiReady ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    Choose PDF File
                  </label>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="mx-auto max-w-md p-6 sm:p-8">
                <div className="text-center">
                  <div className="loading-spinner"></div>
                  <h3 className="mb-2 text-lg text-slate-200 sm:text-xl">
                    Analyzing your resume
                  </h3>
                  <p className="text-sm text-slate-400 sm:text-base">
                    Please wait, your resume is being analyzed...{" "}
                  </p>
                </div>
              </div>
            )}

            {analysis && uploadedFile && (
              <div className="space-y-6 p-4 sm:px-8 lg:px-16">
                <div className="file-info-card">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="icon-container-xl to cyan-500/20 border-blue-500/30 bg-gradient-to-br from-blue-500/20">
                        <span className="text-3xl">&#128196;</span>
                      </div>
                      <div className="">
                        <h3 className="mb-1 text-xl font-bold text-green-500">
                          Analysis Complete
                        </h3>
                        <p className="break-all text-sm text-slate-300">
                          {uploadedFile.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={reset}
                        className="btn-secondary"
                      >
                        New Analysis
                      </button>
                    </div>
                  </div>
                </div>
                <div className="score-card">
                  <div className="mb-6 text-center">
                    <div className="mb-3 flex items-center justify-center gap-2">
                      
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
