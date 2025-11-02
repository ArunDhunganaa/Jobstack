"use client";

import { Button } from "@/components/ui/button";
import {
  PlusSquare,
  Edit,
  Trash2,
  Download,
  FileSearch,
  Briefcase,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserResumes, deleteResume } from "./actions";
import { ResumeServerData } from "@/lib/types";
import { mapToResumeValues } from "@/lib/utils";
import ResumePreview from "@/components/ResumePreview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";

export default function Page() {
  const [resumes, setResumes] = useState<ResumeServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const data = await getUserResumes();
      setResumes(data);
    } catch (error) {
      console.error("Error loading resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    setDeletingId(id);
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (resume: ResumeServerData) => {
    try {
      const resumeValues = mapToResumeValues(resume);

      // Create a temporary container
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "794px";
      document.body.appendChild(tempDiv);

      // Render resume preview in temp div
      const { createRoot } = await import("react-dom/client");
      const root = createRoot(tempDiv);

      const previewContainer = document.createElement("div");
      previewContainer.style.width = "794px";
      previewContainer.style.background = "white";
      tempDiv.appendChild(previewContainer);

      root.render(
        <ResumePreview resumeData={resumeValues} className="w-full" />,
      );

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const canvas = await html2canvas(previewContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          0,
          heightLeft - imgHeight,
          imgWidth,
          imgHeight,
        );
        heightLeft -= pageHeight;
      }

      const fileName =
        `${resume.firstName || "resume"}_${resume.lastName || ""}_${Date.now()}.pdf`.trim();
      pdf.save(fileName);

      // Cleanup
      root.unmount();
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  const generateResumeText = (resume: ResumeServerData): string => {
    const parts: string[] = [];

    if (resume.firstName || resume.lastName) {
      parts.push(`Name: ${resume.firstName || ""} ${resume.lastName || ""}`);
    }
    if (resume.jobTitle) parts.push(`Job Title: ${resume.jobTitle}`);
    if (resume.email) parts.push(`Email: ${resume.email}`);
    if (resume.phone) parts.push(`Phone: ${resume.phone}`);
    if (resume.city || resume.country) {
      parts.push(`Location: ${resume.city || ""} ${resume.country || ""}`);
    }

    if (resume.summary) {
      parts.push(`\nSummary:\n${resume.summary}`);
    }

    if (resume.workExperiences && resume.workExperiences.length > 0) {
      parts.push("\nWork Experience:");
      resume.workExperiences.forEach((exp) => {
        if (exp.position) parts.push(`Position: ${exp.position}`);
        if (exp.company) parts.push(`Company: ${exp.company}`);
        if (exp.description) parts.push(`Description: ${exp.description}`);
        parts.push("");
      });
    }

    if (resume.educations && resume.educations.length > 0) {
      parts.push("\nEducation:");
      resume.educations.forEach((edu) => {
        if (edu.degree) parts.push(`Degree: ${edu.degree}`);
        if (edu.school) parts.push(`School: ${edu.school}`);
        parts.push("");
      });
    }

    if (resume.skills && resume.skills.length > 0) {
      parts.push(`\nSkills: ${resume.skills.join(", ")}`);
    }

    return parts.join("\n");
  };

  const handleAnalyze = async (resume: ResumeServerData) => {
    const resumeText = generateResumeText(resume);

    // Store resume text in sessionStorage and navigate
    sessionStorage.setItem("resumeText", resumeText);
    sessionStorage.setItem(
      "resumeFileName",
      `${resume.firstName || "resume"}_${resume.lastName || ""}.pdf`,
    );
    router.push("/analyzer");
  };

  const handleRecommend = async (resume: ResumeServerData) => {
    const resumeText = generateResumeText(resume);

    // Store resume text in sessionStorage and navigate
    sessionStorage.setItem("resumeText", resumeText);
    sessionStorage.setItem(
      "resumeFileName",
      `${resume.firstName || "resume"}_${resume.lastName || ""}.pdf`,
    );
    router.push("/recommender");
  };

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-7xl items-center justify-center pb-50 pt-[180px]">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading resumes...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl pb-50 pt-[180px]">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Resumes</h1>
        <Button className="flex gap-2 bg-black p-3 text-white hover:bg-black/80">
          <Link href="/editor" className="flex items-center gap-2">
            <PlusSquare className="size-5" />
            New Resume
          </Link>
        </Button>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="text-gray-400 mb-4 size-16" />
          <p className="text-gray-600 mb-4 text-lg">No resumes yet</p>
          <Button className="flex gap-2 bg-black p-3 text-white hover:bg-black/80">
            <Link href="/editor" className="flex items-center gap-2">
              <PlusSquare className="size-5" />
              Create Your First Resume
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => {
            const resumeValues = mapToResumeValues(resume);
            const resumeName =
              `${resume.firstName || ""} ${resume.lastName || ""}`.trim() ||
              "Untitled Resume";

            return (
              <div
                key={resume.id}
                className="group relative overflow-hidden rounded-lg border bg-white shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="bg-gray-50 aspect-[210/297] overflow-hidden">
                  <ResumePreview
                    resumeData={resumeValues}
                    className="h-full w-full"
                  />
                </div>
                <div className="border-t bg-white p-4">
                  <h3 className="mb-2 truncate text-lg font-semibold">
                    {resumeName}
                  </h3>
                  <p className="text-gray-500 mb-3 text-sm">
                    Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="flex-1"
                    >
                      <Link href={`/editor?resumeId=${resume.id}`}>
                        <Edit className="mr-1 size-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(resume)}
                      className="flex-1"
                    >
                      <Download className="mr-1 size-4" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAnalyze(resume)}
                      className="flex-1"
                    >
                      <FileSearch className="mr-1 size-4" />
                      Analyze
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecommend(resume)}
                      className="flex-1"
                    >
                      <Briefcase className="mr-1 size-4" />
                      Jobs
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(resume.id)}
                      disabled={deletingId === resume.id}
                      className="w-full"
                    >
                      <Trash2 className="mr-1 size-4" />
                      {deletingId === resume.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
