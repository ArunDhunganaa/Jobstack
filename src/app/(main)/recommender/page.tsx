"use client";
import { useState, useEffect } from "react";
import Script from "next/script";
import { loadPdfJs } from "@/lib/utils";
import constants, { buildPresenceChecklist } from "@/lib/constant";

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat?: any;
      };
    };
  }
}

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
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

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
    const storedFileName = sessionStorage.getItem("resumeFileName");
    if (storedText) {
      setHasStoredResume(true);
      if (storedFileName) {
        setResumeFileName(storedFileName);
      }
      if (aiReady && !isLoading && jobs.length === 0) {
        // Auto-process the resume text
        setResumeText(storedText);
        setIsLoading(true);
        setErrorMessage(null);

        // Trigger job recommendation asynchronously
        (async () => {
          try {
            if (!window.puter?.ai?.chat) {
              throw new Error(
                "AI service is not ready. Please wait a moment and try again.",
              );
            }

            if (!storedText || storedText.trim().length < 50) {
              throw new Error(
                "Resume text is too short or empty. Please ensure your resume has sufficient content.",
              );
            }

            // Validate if it's a proper resume
            await validateResume(storedText);

            // Extract keywords and fetch jobs
            const keywords = await extractKeywords(storedText);
            console.log("Extracted keywords:", keywords);

            if (!keywords || keywords.length === 0) {
              throw new Error(
                "Failed to extract keywords from resume. Please try again.",
              );
            }

            const fetchedJobs = await fetchJobs(keywords);
            const rankedJobs = rankJobs(storedText, fetchedJobs);
            setJobs(rankedJobs);
            setErrorMessage(null);

            // Clean up sessionStorage
            sessionStorage.removeItem("resumeText");
            sessionStorage.removeItem("resumeFileName");
            setHasStoredResume(false);
          } catch (err: any) {
            console.error("Job recommendation error:", err);
            const errorMessage =
              err instanceof Error
                ? err.message
                : "An unexpected error occurred during job recommendation. Please try again.";
            setErrorMessage(errorMessage);
            sessionStorage.removeItem("resumeText");
            sessionStorage.removeItem("resumeFileName");
            setHasStoredResume(false);
          } finally {
            setIsLoading(false);
          }
        })();
      }
    }
  }, [aiReady, isLoading, jobs.length]);

  const reset = () => {
    setUploadedFile(null);
    setResumeText("");
    setJobs([]);
    setIsLoading(false);
    setHasStoredResume(false);
    setResumeFileName(null);
    setErrorMessage(null);
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

  // ----------------------
  // Validate if PDF is a proper resume
  // ----------------------
  const validateResume = async (text: string): Promise<void> => {
    if (!window.puter?.ai?.chat) {
      throw new Error(
        "AI service is not ready. Please wait a moment and try again.",
      );
    }

    if (!text || text.trim().length < 50) {
      throw new Error(
        "Resume text is too short or empty. Please ensure your resume has sufficient content.",
      );
    }

    // Quick validation check for resume-like content
    const resumeKeywords = [
      "experience",
      "education",
      "skills",
      "summary",
      "work",
      "employment",
      "position",
      "company",
      "degree",
      "university",
      "college",
      "email",
      "phone",
      "contact",
    ];

    const lowerText = text.toLowerCase();
    const foundKeywords = resumeKeywords.filter((keyword) =>
      lowerText.includes(keyword),
    );

    if (foundKeywords.length < 3) {
      throw new Error(
        "This document does not appear to be a resume. Please upload a proper resume containing professional experience, education, and skills sections.",
      );
    }

    // Use AI to validate more thoroughly
    const validationPrompt = `Analyze this document and determine if it is a resume/CV. Look for:
- Professional experience, work history, or employment information
- Education background, degrees, or academic information
- Skills, qualifications, or professional competencies
- Contact information and personal details

Respond with ONLY a JSON object in this format:
{
  "isResume": true or false,
  "reason": "brief explanation"
}

Document text:
"""${text.substring(0, 2000)}"""`;

    try {
      const response = await window.puter.ai.chat(
        [{ role: "user", content: validationPrompt }],
        { model: "gpt-4o-mini" },
      );

      const responseContent =
        typeof response === "string"
          ? response
          : response.message?.content || "";

      const jsonMatch = responseContent.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const validation = JSON.parse(jsonMatch[0]);
        if (!validation.isResume) {
          throw new Error(
            validation.reason ||
              "This document does not appear to be a resume. Please upload a proper resume containing professional experience, education, and skills sections.",
          );
        }
      }
    } catch (err: any) {
      // If it's an error about not being a resume, throw it
      if (err.message && err.message.includes("not appear to be a resume")) {
        throw err;
      }
      // For other validation errors, log warning but allow to proceed
      // The full extraction will catch non-resume documents anyway
      console.warn("Resume validation warning:", err);
    }
  };

  // ----------------------
  // Extract keywords from resume
  // ----------------------
  const extractKeywords = async (text: string): Promise<string[]> => {
    try {
      if (!window.puter?.ai?.chat) {
        throw new Error(
          "AI service is not ready. Please wait a moment and try again.",
        );
      }

      if (!text || text.trim().length < 50) {
        throw new Error(
          "Resume text is too short. Please upload a complete resume with sufficient content.",
        );
      }

      const prompt = constants.JOB_RECOMMENDER_PROMPT.replace(
        "{{DOCUMENT_TEXT}}",
        text.substring(0, 10000), // Limit text length to prevent token limits
      );

      const response = await window.puter.ai.chat(
        [
          {
            role: "system",
            content:
              "You are an expert career advisor and job matching specialist with extensive experience in resume analysis and job recommendations. Extract relevant keywords accurately and efficiently.",
          },
          { role: "user", content: prompt },
        ],
        {
          model: "gpt-4o",
          temperature: 0.3, // Lower temperature for more consistent results
        },
      );

      if (!response) {
        throw new Error(
          "No response received from AI service. Please try again.",
        );
      }

      const responseContent =
        typeof response === "string"
          ? response
          : response.message?.content || "";

      if (!responseContent || responseContent.trim().length === 0) {
        throw new Error("Empty response from AI service. Please try again.");
      }

      // Check for error in response
      const errorMatch = responseContent.match(/{"error"\s*:\s*"([^"]+)"/);
      if (errorMatch) {
        throw new Error(errorMatch[1]);
      }

      // Try to find JSON array in the response
      const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error(
          "No valid keyword array found in AI response. Please try again.",
        );
      }

      const keywords = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(keywords) || keywords.length === 0) {
        throw new Error("Invalid keyword extraction result. Please try again.");
      }

      return keywords;
    } catch (err: any) {
      console.error("Keyword extraction error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during keyword extraction. Please try again.";
      throw new Error(errorMessage);
    }
  };

  const fetchJobs = async (keywords: string[]): Promise<Job[]> => {
    try {
      if (!keywords || keywords.length === 0) {
        throw new Error("No keywords provided for job search.");
      }

      const query = keywords.slice(0, 3).join(" ");
      if (!query || query.trim().length === 0) {
        throw new Error("Invalid search query generated from keywords.");
      }

      const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
      if (!apiKey) {
        throw new Error(
          "Job search API key is not configured. Please contact support.",
        );
      }

      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1`,
        {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
          },
        },
      );

      if (!res.ok) {
        throw new Error(
          `Failed to fetch jobs: ${res.status} ${res.statusText}. Please try again.`,
        );
      }

      const data = await res.json();

      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error(
          "Invalid response from job search API. Please try again.",
        );
      }

      const jobs = data.data.map((job: any) => ({
        title: job.job_title || "Job Title Not Available",
        company: job.employer_name || "Company Not Available",
        location: job.job_city || "Remote",
        description: job.job_description || "No description available",
        apply_link: job.job_apply_link || "#",
      }));

      if (jobs.length === 0) {
        throw new Error(
          "No jobs found matching your resume. Try updating your resume with more relevant skills or experience.",
        );
      }

      return jobs;
    } catch (err: any) {
      console.error("Job fetching error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while fetching jobs. Please try again.";
      throw new Error(errorMessage);
    }
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
  // ----------------------
  // Handle file upload
  // ----------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }

    setUploadedFile(file);
    setIsLoading(true);
    setJobs([]);
    setResumeText("");
    setErrorMessage(null);

    try {
      const text = await extractPDFText(file);

      // Validate if it's a proper resume
      await validateResume(text);

      setResumeText(text);

      // Extract keywords
      const keywords = await extractKeywords(text);
      console.log("Extracted keywords:", keywords);

      if (!keywords || keywords.length === 0) {
        throw new Error(
          "Failed to extract keywords from resume. Please try again.",
        );
      }

      // Fetch jobs
      const fetchedJobs = await fetchJobs(keywords);
      const rankedJobs = rankJobs(text, fetchedJobs);
      setJobs(rankedJobs);
      setErrorMessage(null);
    } catch (err: any) {
      console.error("File upload error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
      <div className="dark:bg-main-gradient flex min-h-screen items-center justify-center pb-50 pt-[180px]">
        <div className="container max-w-5xl">
          <div className="mb-6 text-center">
            <h1 className="mb-2 bg-gradient-to-r from-cyan-400 via-teal-500 to-sky-500 bg-clip-text text-3xl font-light text-transparent lg:text-5xl">
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
              <p className="text-lg text-slate-200">
                Analyzing your resume and finding job recommendations...
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 rounded border border-red-500 bg-red-600/20 p-4 text-red-800">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          {jobs.length > 0 && (uploadedFile || resumeText) && (
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
                      rel="noopener noreferrer"
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
                  className="cursor-pointer rounded-xl border border-red-500/30 bg-red-500 px-24 py-12 text-lg text-red-100 transition hover:bg-red-500/30 dark:bg-red-500/20 dark:text-red-300"
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
