"use client";
import { useState, useEffect } from "react";
import Script from "next/script";
import { loadPdfJs } from "@/lib/utils";
import constants, { buildPresenceChecklist } from "@/lib/constant";

type PDFJSLib = typeof import("pdfjs-dist");

interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  apply_link: string;
}

export default function JobRecommenderPage() {
  const [aiReady, setAiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [pdfjsLib, setPdfjsLib] = useState<PDFJSLib | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasStoredResume, setHasStoredResume] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setAiReady(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      const lib = await loadPdfJs();
      if (lib) setPdfjsLib(lib);
      console.log("✅ PDF.js Loaded:", lib?.version);
    })();
  }, []);

  // ----------------------
  // Check for resume text from resumes page
  // ----------------------
  useEffect(() => {
    const storedText = sessionStorage.getItem("resumeText");
    if (storedText) {
      setHasStoredResume(true);
      if (aiReady && !isLoading && jobs.length === 0) {
        // Auto-process the resume text
        setResumeText(storedText);
        setIsLoading(true);

        // Extract keywords and fetch jobs
        extractKeywords(storedText)
          .then((keywords) => {
            console.log("Extracted keywords:", keywords);
            return fetchJobs(keywords);
          })
          .then((fetchedJobs) => {
            const rankedJobs = rankJobs(storedText, fetchedJobs);
            setJobs(rankedJobs);
          })
          .catch((err: any) => {
            console.error(err);
            setErrorMessage(err.message);
          })
          .finally(() => {
            setIsLoading(false);
          });

        // Clean up sessionStorage
        sessionStorage.removeItem("resumeText");
        sessionStorage.removeItem("resumeFileName");
        setHasStoredResume(false);
      }
    }
  }, [aiReady, isLoading, jobs.length]);

  const reset = () => {
    setUploadedFile(null);
    setResumeText("");
    setJobs([]);
    setIsLoading(false);
    setHasStoredResume(false);
    sessionStorage.removeItem("resumeText");
    sessionStorage.removeItem("resumeFileName");
  };

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

  const extractKeywords = async (text: string): Promise<string[]> => {
    if (!window.puter?.ai?.chat) throw new Error("AI not ready");
    const prompt = `
      Extract 5-8 most relevant professional keywords from this resume text.
      Respond only with a JSON array of strings. Text:
      """${text}"""
    `;
    const response = await window.puter.ai.chat(
      [{ role: "user", content: prompt }],
      {
        model: "gpt-4o-mini",
      },
    );
    try {
      const match = response.message?.content.match(/\[.*\]/s);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  };

  const fetchJobs = async (keywords: string[]): Promise<Job[]> => {
    const query = keywords.slice(0, 3).join(" ");
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1`,
      {
        headers: {
          "x-rapidapi-key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "",
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
        },
      },
    );
    const data = await res.json();
    return (
      data.data?.map((job: any) => ({
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city || "Remote",
        description: job.job_description,
        apply_link: job.job_apply_link,
      })) || []
    );
  };

  // Simple TF-IDF–style cosine similarity for basic ranking
  const rankJobs = (resume: string, jobList: Job[]): Job[] => {
    const tokenize = (t: string): string[] => {
      const matches = t.toLowerCase().match(/\b[a-z]{3,}\b/g);
      return matches ? Array.from(matches) : [];
    };

    const resumeWords: string[] = tokenize(resume);

    const scores = jobList.map((job) => {
      const jobWords: string[] = tokenize(job.description);
      const common = jobWords.filter((w: string) =>
        resumeWords.includes(w),
      ).length;
      return { ...job, score: common };
    });

    // Return sorted array
    return scores.sort((a, b) => b.score - a.score);
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }

    setUploadedFile(file);
    setIsLoading(true);
    setJobs([]);
    try {
      const text = await extractPDFText(file);
      setResumeText(text);
      const keywords = await extractKeywords(text);
      console.log("Extracted keywords:", keywords);

      const fetchedJobs = await fetchJobs(keywords);
      const rankedJobs = rankJobs(text, fetchedJobs);
      setJobs(rankedJobs);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
      <div className="dark:bg-main-gradient flex min-h-screen items-center justify-center pb-50 pt-[180px]">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 text-center">
            <h1 className="mb-2 bg-gradient-to-r from-cyan-400 via-teal-500 to-sky-500 bg-clip-text text-5xl font-light text-transparent">
              Job Recommender
            </h1>
            <p className="text-sm text-slate-800 dark:text-slate-300">
              Upload your resume PDF to get instant job recommendations
            </p>
          </div>

          {!uploadedFile &&
            !hasStoredResume &&
            !isLoading &&
            jobs.length === 0 && (
              <div className="upload-area text-center">
                <h3 className="mb-2 text-xl text-slate-700 dark:text-slate-200">
                  Upload your resume
                </h3>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={!aiReady}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`btn-primary inline-block ${!aiReady ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  Choose PDF File
                </label>
              </div>
            )}

          {isLoading && (
            <div className="mt-8 text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-lg text-slate-200">Analyzing your resume...</p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 rounded border border-red-500 bg-red-600/20 p-4 text-red-800">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          {jobs.length > 0 && (
            <>
              <div className="mt-24 grid gap-24 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-700 p-24 shadow-lg dark:bg-slate-900 dark:text-slate-100"
                  >
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <p className="text-sm text-cyan-600 dark:text-slate-400">
                      {job.company}
                    </p>
                    <p className="mb-3 text-xs text-cyan-700 dark:text-slate-500">
                      {job.location}
                    </p>
                    <p className="mb-3 line-clamp-4 text-sm">
                      {job.description.slice(0, 200)}...
                    </p>
                    <a
                      href={job.apply_link}
                      target="_blank"
                      className="text-md text-cyan-800 underline dark:text-cyan-400"
                    >
                      Apply Now
                    </a>
                  </div>
                ))}
              </div>
              <div className="mt-24 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="cursor-pointer; rounded-xl border border-red-500/30 bg-red-500 px-24 py-12 text-lg text-red-100 transition hover:bg-red-500/30 dark:bg-red-500/20 dark:text-red-300"
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
