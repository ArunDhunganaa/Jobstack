"use client";
import { useState, useEffect } from "react";
import Script from "next/script";
import constants, {
  buildPresenceChecklist,
  METRIC_CONFIG,
} from "@/lib/constant";
import { loadPdfJs } from "@/lib/utils";
declare global {
  interface Window {
    puter?: {
      ai?: {
        chat?: any;
      };
    };
  }
}
// ----------------------
// Types
// ----------------------
type PDFJSLib = typeof import("pdfjs-dist");

type MetricScore = number;

export type PerformanceMetrics = {
  [key: string]: number | undefined;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message);
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
      <div className="dark:bg-main-gradient flex min-h-screen items-center justify-center pb-50 pt-[180px]">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 text-center">
            <h1 className="mb-2 bg-gradient-to-r from-cyan-400 via-teal-500 to-sky-500 bg-clip-text text-5xl font-light text-transparent sm:text-6xl lg:text-7xl">
              Resume Analyzer
            </h1>
            <p className="text-sm text-slate-800 dark:text-slate-300 sm:text-base">
              Upload your pdf resume and get instant feedback
            </p>
          </div>
          {!uploadedFile && (
            <div className="upload-area">
              <div className="upload-zone">
                <div className="mb-4 text-2xl">&#128196;</div>
                <h3 className="mb-2 text-xl text-slate-700 dark:text-slate-200 sm:text-2xl">
                  Upload your resume
                </h3>
                <p className="text:sm mb-4 text-slate-600 dark:text-slate-400 sm:mb-6 sm:text-base">
                  PDF files only . Get instant analysis
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    setErrorMessage(null);
                    handleFileUpload(e);
                  }}
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
                <h3 className="mb-2 text-lg text-slate-800 dark:text-slate-200 sm:text-xl">
                  Analyzing your resume
                </h3>
                <p className="text-sm text-slate-400 sm:text-base">
                  Please wait, your resume is being analyzed...{" "}
                </p>
              </div>
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 rounded border border-red-500 bg-red-600/20 p-3 text-red-800 dark:text-red-100">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
          {analysis && uploadedFile && (
            <div className="space-y-16 p-4 sm:px-8 lg:px-16">
              <div className="file-info-card">
                <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-12">
                    <div className="icon-container-xl to cyan-500/20 border-blue-500/30 bg-gradient-to-br from-blue-500/20">
                      <span className="text-2xl">&#128196;</span>
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
                <div className="mb-16 text-center">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <span className="text-2xl">&#127942;</span>
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                      Overall Score
                    </h2>
                  </div>
                  <div className="relative">
                    <p className="drop-show-lg mb-16 text-6xl font-extrabold text-cyan-400 sm:text-8xl">
                      {analysis.overallScore || "7"}
                    </p>
                  </div>
                  <div
                    className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 ${parseInt(analysis.overallScore) >= 8 ? "score-status-excellent" : parseInt(analysis.overallScore) >= 6 ? "score-status-good" : "score-status-improvement"}`}
                  >
                    <span className="text-lg">
                      {parseInt(analysis.overallScore) >= 8
                        ? "✨"
                        : parseInt(analysis.overallScore) >= 6
                          ? "⭐"
                          : "📈"}
                    </span>
                    <span className="text-lg font-semibold">
                      {parseInt(analysis.overallScore) >= 8
                        ? "Excellent"
                        : parseInt(analysis.overallScore) >= 6
                          ? "Good"
                          : "Needs improvement"}
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className={`h-full rounded-full shadow-sm transition-all duration-1000 ease-out ${
                      parseInt(analysis.overallScore) >= 8
                        ? "progress-excellent"
                        : parseInt(analysis.overallScore) >= 6
                          ? "progress-good"
                          : "progress-improvement"
                    } `}
                    style={{
                      width: `${(parseInt(analysis.overallScore) / 10) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="mt-3 text-center text-sm font-medium text-slate-800 dark:text-slate-400">
                  Score based on content quality , formatting, and keyword usage
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="feature-card-green group">
                  <div className="icon-container-lg mx-auto mb-3 bg-green-500/20 transition-colors group-hover:bg-green-400/30">
                    <span className="text-xl text-green-300">&#10003;</span>
                  </div>
                  <h4 className="mb-16 text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-300">
                    Top Strengths
                  </h4>
                  <div className="space-y-12 text-left">
                    {analysis.strengths.slice(0, 3).map((strength, index) => (
                      <div key={index} className="list-item-green">
                        <span className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-200">
                          {strength}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="feature-card-orange group">
                  <div className="icon-container-lg mx-auto mb-3 bg-orange-500/20 transition-colors group-hover:bg-orange-400/30">
                    <span className="text-xl text-orange-300">&#9889;</span>
                  </div>
                  <h4 className="mb-16 text-sm font-semibold uppercase tracking-wide text-orange-500 dark:text-orange-300">
                    Main improvements
                  </h4>
                  <div className="space-y-12 text-left">
                    {analysis.improvements
                      .slice(0, 3)
                      .map((improvement, index) => (
                        <div key={index} className="list-item-orange">
                          <span className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-200">
                            {improvement}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="section-card group">
                <div className="mb-4 flex items-center gap-3">
                  <div className="icon-container bg-purple-500/20">
                    <span className="text-lg text-purple-300">&#128218;</span>
                  </div>
                  <h4 className="text-white">Executive summary</h4>
                </div>
                <div className="summary-box">
                  <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
                    {analysis.summary}
                  </p>
                </div>
              </div>
              <div className="section-card group">
                <div className="mb-6 flex items-center gap-3">
                  <div className="icon-container bg-cyan-500/20">
                    <span className="text-lg text-cyan-300">&#128202;</span>
                  </div>
                  <h4 className="text-xl font-bold text-white">
                    Performance metrics
                  </h4>
                </div>
                <div className="space-y-4">
                  {METRIC_CONFIG.map((cfg, i) => {
                    const value =
                      analysis.performanceMetrics?.[cfg.key] ??
                      cfg.defaultValue;
                    return (
                      <div key={i} className="group/item">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cfg.icon}</span>
                            <p className="font-medium text-slate-200">
                              {cfg.label}
                            </p>
                          </div>
                          <span className="font-bold text-slate-300">
                            {value}/10
                          </span>
                        </div>
                        <div className="progress-bar-small">
                          <div
                            className={`h-full bg-gradient-to-r ${cfg.colorClass} rounded transition-all duration-1000 ease-out group-hover/item:shadow-lg ${cfg.shadowClass}`}
                            style={{ width: `${(value / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="section-card group">
                <div className="mb-6 flex items-center gap-3">
                  <div className="icon-container bg-purple-500/20">
                    <span className="text-lg text-purple-300">&#128270;</span>
                  </div>
                  <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    Resume Insights
                  </h2>
                </div>
                <div className="grid gap-4">
                  <div className="info-box-cyan group/item">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-lg text-cyan-400">&#127919;</span>
                      <h3 className="font-semibold text-cyan-300">
                        Action items
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {(
                        analysis.actionItems || [
                          "Optimize keyword placement for better ATS scoring",
                          "Enhance content with quatifiable achievements",
                          "Consider industry-specific terminology",
                        ]
                      ).map((item, index) => (
                        <div className="list-item-cyan" key={index}>
                          <span className="text-cyan-400">.</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="info-box-emerald group/item">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-lg">&#128161;</span>
                      <h3 className="font-semibold text-emerald-300">
                        Pro Tips
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {(
                        analysis.proTips || [
                          "Use action verbs to start bullet points",
                          "Keep descriptions concise and impactful",
                          "Tailor keywords to specific job descriptions",
                        ]
                      ).map((tip, index) => (
                        <div key={index} className="list-item-emerald">
                          <span className="text-emerald-400">.</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="section-card group">
                <div className="mb-6 flex items-center gap-3">
                  <div className="icon-container dark:bg-violet-500/20">
                    <span className="text-lg">&#129302;</span>
                  </div>
                  <h2 className="text-xl font-bold text-violet-600 dark:text-violet-400">
                    ATS Optimization
                  </h2>
                </div>
                <div className="info-box-violet">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="">
                      <h3 className="mb-2 font-semibold text-violet-600 dark:text-violet-300">
                        What is ATS?
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-200">
                        <strong className="text-violet-600 dark:text-violet-300">
                          Applicant Tracking System (ATS)
                        </strong>{" "}
                        are software tools used by more than 75% of employers to
                        automatically screen resumes before human review. These
                        systems scan for keywords, proper formatting, and
                        relevant qualifications to rank candidates. If your
                        resume isn't ATS-friendly, it may never reach a human
                        recruiter.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="info-box-violet">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-lg text-violet-600 dark:text-violet-400">
                      &#129302;
                    </span>
                    <h3 className="text-lg font-semibold text-violet-600 dark:text-violet-300">
                      ATS Compatibility Checklist
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {(presenceChecklist || []).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-slate-200"
                      >
                        <span
                          className={`${item.present ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {item.present ? "✅;" : "❌"}
                        </span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section-card group">
                <div className="mb-6 flex items-center gap-3">
                  <div className="icon-container bg-blue-500/20">
                    <span className="text-lg">&#128273;</span>
                  </div>
                  <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    Recommended keywords
                  </h2>
                </div>
                <div className="mb-4 flex flex-wrap gap-3">
                  {analysis.keywords.map((k, i) => (
                    <span key={i} className="keyword-tag group/item">
                      {k}
                    </span>
                  ))}
                </div>
                <div className="info-box-blue">
                  <p className="items-start-start flex gap-2 text-sm leading-relaxed text-slate-300">
                    <span className="mt-0.5 text-lg">&#128161;</span>
                    Consider incorporating these keywords naturally into your
                    resume to improve ATS compatibility and increase your
                    chances of getting noticed by recruiters.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
