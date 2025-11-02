import { BorderStyles } from "@/app/(main)/editor/BorderStyleButton";
import { Templates } from "@/app/(main)/editor/TemplateSelector";
import useDimensions from "@/hooks/useDimensions";
import { cn } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import { formatDate } from "date-fns";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";

interface ResumePreviewProps {
  resumeData: ResumeValues;
  contentRef?: React.Ref<HTMLDivElement>;
  className?: string;
}

export default function ResumePreview({
  resumeData,
  contentRef,
  className,
}: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { width } = useDimensions(containerRef);
  const template = resumeData.template || Templates.MODERN;

  return (
    <div
      className={cn(
        "aspect-[210/297] h-fit w-full bg-white text-black",
        className,
      )}
      ref={containerRef}
    >
      <div
        className={cn("space-y-6 p-6", !width && "invisible")}
        style={{
          zoom: (1 / 794) * width,
        }}
        ref={contentRef as React.RefObject<HTMLDivElement>}
        id="resumePreviewContent"
      >
        {template === Templates.MODERN && (
          <ModernTemplate resumeData={resumeData} />
        )}
        {template === Templates.CLASSIC && (
          <ClassicTemplate resumeData={resumeData} />
        )}
        {template === Templates.MINIMAL && (
          <MinimalTemplate resumeData={resumeData} />
        )}
      </div>
    </div>
  );
}

interface ResumeSectionProps {
  resumeData: ResumeValues;
}

// Modern Template (Original Layout)
function ModernTemplate({ resumeData }: ResumeSectionProps) {
  return (
    <>
      <PersonalInfoHeader resumeData={resumeData} />
      <SummarySection resumeData={resumeData} />
      <WorkExperienceSection resumeData={resumeData} />
      <EducationSection resumeData={resumeData} />
      <SkillsSection resumeData={resumeData} />
    </>
  );
}

// Classic Template (Two-column layout)
function ClassicTemplate({ resumeData }: ResumeSectionProps) {
  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="w-1/3 space-y-4">
        <PersonalInfoHeaderClassic resumeData={resumeData} />
        <SkillsSection resumeData={resumeData} />
      </div>
      {/* Right Content */}
      <div className="flex-1 space-y-4">
        <SummarySection resumeData={resumeData} />
        <WorkExperienceSection resumeData={resumeData} />
        <EducationSection resumeData={resumeData} />
      </div>
    </div>
  );
}

// Minimal Template (Clean and minimal)
function MinimalTemplate({ resumeData }: ResumeSectionProps) {
  return (
    <div className="space-y-4">
      <PersonalInfoHeaderMinimal resumeData={resumeData} />
      <SummarySectionMinimal resumeData={resumeData} />
      <WorkExperienceSectionMinimal resumeData={resumeData} />
      <EducationSectionMinimal resumeData={resumeData} />
      <SkillsSectionMinimal resumeData={resumeData} />
    </div>
  );
}

function PersonalInfoHeader({ resumeData }: ResumeSectionProps) {
  const {
    photo,
    firstName,
    lastName,
    jobTitle,
    city,
    country,
    phone,
    email,
    colorHex,
    borderStyle,
  } = resumeData;

  const [photoSrc, setPhotoSrc] = useState(photo instanceof File ? "" : photo);

  useEffect(() => {
    const objectUrl = photo instanceof File ? URL.createObjectURL(photo) : "";
    if (objectUrl) setPhotoSrc(objectUrl);
    if (photo === null) setPhotoSrc("");
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  return (
    <div className="flex items-center gap-6">
      {photoSrc && (
        <Image
          src={photoSrc}
          width={100}
          height={100}
          alt="Author photo"
          className="aspect-square object-cover"
          style={{
            borderRadius:
              borderStyle === BorderStyles.SQUARE
                ? "0px"
                : borderStyle === BorderStyles.CIRCLE
                  ? "9999px"
                  : "10%",
          }}
        />
      )}
      <div className="space-y-2.5">
        <div className="space-y-1">
          <p
            className="text-3xl font-bold"
            style={{
              color: colorHex,
            }}
          >
            {firstName} {lastName}
          </p>
          <p
            className="font-medium"
            style={{
              color: colorHex,
            }}
          >
            {jobTitle}
          </p>
        </div>
        <p className="text-gray-500 text-xs">
          {city}
          {city && country ? ", " : ""}
          {country}
          {(city || country) && (phone || email) ? " • " : ""}
          {[phone, email].filter(Boolean).join(" • ")}
        </p>
      </div>
    </div>
  );
}

function SummarySection({ resumeData }: ResumeSectionProps) {
  const { summary, colorHex } = resumeData;

  if (!summary) return null;

  return (
    <>
      <hr
        className="border-2"
        style={{
          borderColor: colorHex,
        }}
      />
      <div className="break-inside-avoid space-y-3">
        <p
          className="text-lg font-semibold"
          style={{
            color: colorHex,
          }}
        >
          Professional profile
        </p>
        <div className="whitespace-pre-line text-sm">{summary}</div>
      </div>
    </>
  );
}

function WorkExperienceSection({ resumeData }: ResumeSectionProps) {
  const { workExperiences, colorHex } = resumeData;

  const workExperiencesNotEmpty = workExperiences?.filter(
    (exp) => Object.values(exp).filter(Boolean).length > 0,
  );

  if (!workExperiencesNotEmpty?.length) return null;

  return (
    <>
      <hr
        className="border-2"
        style={{
          borderColor: colorHex,
        }}
      />
      <div className="space-y-3">
        <p
          className="text-lg font-semibold"
          style={{
            color: colorHex,
          }}
        >
          Work experience
        </p>
        {workExperiencesNotEmpty.map((exp, index) => (
          <div key={index} className="break-inside-avoid space-y-1">
            <div
              className="flex items-center justify-between text-sm font-semibold"
              style={{
                color: colorHex,
              }}
            >
              <span>{exp.position}</span>
              {exp.startDate && (
                <span>
                  {formatDate(exp.startDate, "MM/yyyy")} -{" "}
                  {exp.endDate ? formatDate(exp.endDate, "MM/yyyy") : "Present"}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold">{exp.company}</p>
            <div className="whitespace-pre-line text-xs">{exp.description}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function EducationSection({ resumeData }: ResumeSectionProps) {
  const { educations, colorHex } = resumeData;

  const educationsNotEmpty = educations?.filter(
    (edu) => Object.values(edu).filter(Boolean).length > 0,
  );

  if (!educationsNotEmpty?.length) return null;

  return (
    <>
      <hr
        className="border-2"
        style={{
          borderColor: colorHex,
        }}
      />
      <div className="space-y-3">
        <p
          className="text-lg font-semibold"
          style={{
            color: colorHex,
          }}
        >
          Education
        </p>
        {educationsNotEmpty.map((edu, index) => (
          <div key={index} className="break-inside-avoid space-y-1">
            <div
              className="flex items-center justify-between text-sm font-semibold"
              style={{
                color: colorHex,
              }}
            >
              <span>{edu.degree}</span>
              {edu.startDate && (
                <span>
                  {edu.startDate &&
                    `${formatDate(edu.startDate, "MM/yyyy")} ${edu.endDate ? `- ${formatDate(edu.endDate, "MM/yyyy")}` : ""}`}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold">{edu.school}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function SkillsSection({ resumeData }: ResumeSectionProps) {
  const { skills, colorHex, borderStyle } = resumeData;

  if (!skills?.length) return null;

  return (
    <>
      <hr
        className="border-2"
        style={{
          borderColor: colorHex,
        }}
      />
      <div className="break-inside-avoid space-y-3">
        <p
          className="text-lg font-semibold"
          style={{
            color: colorHex,
          }}
        >
          Skills
        </p>
        <div className="flex break-inside-avoid flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge
              key={index}
              className="rounded-md bg-black text-white hover:bg-black"
              style={{
                backgroundColor: colorHex,
                borderRadius:
                  borderStyle === BorderStyles.SQUARE
                    ? "0px"
                    : borderStyle === BorderStyles.CIRCLE
                      ? "9999px"
                      : "8px",
              }}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}

// Classic Template Variants
function PersonalInfoHeaderClassic({ resumeData }: ResumeSectionProps) {
  const {
    photo,
    firstName,
    lastName,
    jobTitle,
    city,
    country,
    phone,
    email,
    colorHex,
    borderStyle,
  } = resumeData;

  const [photoSrc, setPhotoSrc] = useState(photo instanceof File ? "" : photo);

  useEffect(() => {
    const objectUrl = photo instanceof File ? URL.createObjectURL(photo) : "";
    if (objectUrl) setPhotoSrc(objectUrl);
    if (photo === null) setPhotoSrc("");
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  return (
    <div className="space-y-3">
      {photoSrc && (
        <Image
          src={photoSrc}
          width={120}
          height={120}
          alt="Author photo"
          className="aspect-square object-cover"
          style={{
            borderRadius:
              borderStyle === BorderStyles.SQUARE
                ? "0px"
                : borderStyle === BorderStyles.CIRCLE
                  ? "9999px"
                  : "10%",
          }}
        />
      )}
      <div className="space-y-2">
        <div className="space-y-1">
          <p
            className="text-2xl font-bold"
            style={{
              color: colorHex,
            }}
          >
            {firstName} {lastName}
          </p>
          <p
            className="text-sm font-medium"
            style={{
              color: colorHex,
            }}
          >
            {jobTitle}
          </p>
        </div>
        <div className="text-gray-600 space-y-1 text-xs">
          {city && country && (
            <p>
              {city}, {country}
            </p>
          )}
          {phone && <p>{phone}</p>}
          {email && <p>{email}</p>}
        </div>
      </div>
    </div>
  );
}

// Minimal Template Variants
function PersonalInfoHeaderMinimal({ resumeData }: ResumeSectionProps) {
  const {
    photo,
    firstName,
    lastName,
    jobTitle,
    city,
    country,
    phone,
    email,
    colorHex,
  } = resumeData;

  const [photoSrc, setPhotoSrc] = useState(photo instanceof File ? "" : photo);

  useEffect(() => {
    const objectUrl = photo instanceof File ? URL.createObjectURL(photo) : "";
    if (objectUrl) setPhotoSrc(objectUrl);
    if (photo === null) setPhotoSrc("");
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  return (
    <div className="flex flex-col items-center space-y-2 text-center">
      {photoSrc && (
        <Image
          src={photoSrc}
          width={80}
          height={80}
          alt="Author photo"
          className="aspect-square rounded-full object-cover"
        />
      )}
      <div>
        <p
          className="text-2xl font-bold"
          style={{
            color: colorHex,
          }}
        >
          {firstName} {lastName}
        </p>
        <p className="text-gray-600 text-sm">{jobTitle}</p>
        <p className="text-gray-500 text-xs">
          {city}
          {city && country ? ", " : ""}
          {country}
          {(city || country) && (phone || email) ? " • " : ""}
          {[phone, email].filter(Boolean).join(" • ")}
        </p>
      </div>
    </div>
  );
}

function SummarySectionMinimal({ resumeData }: ResumeSectionProps) {
  const { summary, colorHex } = resumeData;

  if (!summary) return null;

  return (
    <div className="space-y-2">
      <p
        className="text-sm font-semibold uppercase tracking-wider"
        style={{
          color: colorHex,
          borderBottom: `2px solid ${colorHex}`,
          paddingBottom: "4px",
        }}
      >
        Summary
      </p>
      <div className="whitespace-pre-line text-xs">{summary}</div>
    </div>
  );
}

function WorkExperienceSectionMinimal({ resumeData }: ResumeSectionProps) {
  const { workExperiences, colorHex } = resumeData;

  const workExperiencesNotEmpty = workExperiences?.filter(
    (exp) => Object.values(exp).filter(Boolean).length > 0,
  );

  if (!workExperiencesNotEmpty?.length) return null;

  return (
    <div className="space-y-3">
      <p
        className="text-sm font-semibold uppercase tracking-wider"
        style={{
          color: colorHex,
          borderBottom: `2px solid ${colorHex}`,
          paddingBottom: "4px",
        }}
      >
        Work Experience
      </p>
      {workExperiencesNotEmpty.map((exp, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">{exp.position}</p>
            {exp.startDate && (
              <span className="text-gray-600 text-xs">
                {formatDate(exp.startDate, "MM/yyyy")} -{" "}
                {exp.endDate ? formatDate(exp.endDate, "MM/yyyy") : "Present"}
              </span>
            )}
          </div>
          <p className="text-gray-700 text-xs font-medium">{exp.company}</p>
          <div className="text-gray-600 whitespace-pre-line text-xs">
            {exp.description}
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationSectionMinimal({ resumeData }: ResumeSectionProps) {
  const { educations, colorHex } = resumeData;

  const educationsNotEmpty = educations?.filter(
    (edu) => Object.values(edu).filter(Boolean).length > 0,
  );

  if (!educationsNotEmpty?.length) return null;

  return (
    <div className="space-y-3">
      <p
        className="text-sm font-semibold uppercase tracking-wider"
        style={{
          color: colorHex,
          borderBottom: `2px solid ${colorHex}`,
          paddingBottom: "4px",
        }}
      >
        Education
      </p>
      {educationsNotEmpty.map((edu, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">{edu.degree}</p>
            {edu.startDate && (
              <span className="text-gray-600 text-xs">
                {formatDate(edu.startDate, "MM/yyyy")}{" "}
                {edu.endDate ? `- ${formatDate(edu.endDate, "MM/yyyy")}` : ""}
              </span>
            )}
          </div>
          <p className="text-gray-700 text-xs">{edu.school}</p>
        </div>
      ))}
    </div>
  );
}

function SkillsSectionMinimal({ resumeData }: ResumeSectionProps) {
  const { skills, colorHex } = resumeData;

  if (!skills?.length) return null;

  return (
    <div className="space-y-2">
      <p
        className="text-sm font-semibold uppercase tracking-wider"
        style={{
          color: colorHex,
          borderBottom: `2px solid ${colorHex}`,
          paddingBottom: "4px",
        }}
      >
        Skills
      </p>
      <div className="flex flex-wrap gap-1">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="rounded border px-2 py-0.5 text-xs"
            style={{
              borderColor: colorHex,
              color: colorHex,
            }}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
