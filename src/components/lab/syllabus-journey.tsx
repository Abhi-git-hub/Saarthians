"use client";

import { useState } from "react";
import Link from "next/link";
import { COURSES } from "@/lib/site";

// Interactive program discovery from REAL course data — nothing invented.
// Each stage reveals the actual Saarthians tracks for that level.
const STAGES = [
  { id: "c9", label: "Class 9", courses: [0] },
  { id: "c10", label: "Class 10", courses: [1] },
  { id: "c11", label: "Class 11", courses: [2] },
  { id: "c12", label: "Class 12", courses: [3] },
  { id: "neet", label: "NEET", courses: [2, 3, 4] },
  { id: "jee", label: "JEE", courses: [2, 3, 5] },
] as const;

export function SyllabusJourney() {
  const [stage, setStage] = useState<(typeof STAGES)[number]>(STAGES[1]);

  return (
    <div className="lab-journey">
      <div className="lab-journey-rail" role="tablist" aria-label="Choose a stage">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={stage.id === s.id}
            onClick={() => setStage(s)}
            className={`lab-stage${stage.id === s.id ? " is-active" : ""}`}
          >
            <span className="lab-stage-dot" aria-hidden="true">{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>
      <div className="lab-journey-cards">
        {stage.courses.map((courseIndex) => {
          const course = COURSES[courseIndex];
          return (
            <article key={course.tag} className="lab-journey-card">
              <span className="course-tag">{course.tag}</span>
              <h3>{course.title}</h3>
              <p>{course.body}</p>
              <p className="lab-method">{course.method}</p>
              <Link href="/programs" className="text-link-big">See programs →</Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
