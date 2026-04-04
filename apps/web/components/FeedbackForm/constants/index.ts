import type {
  FeedbackQuestion,
  Relationship,
  RelationshipOption,
  RelationshipSectionVisibility,
} from "@/components/FeedbackForm/types";

export const ANONYMOUS_FROM_EMAIL = "anonymous-feedback@nicholasgriffin.dev";

export const RELATIONSHIP_OPTIONS: readonly RelationshipOption[] = [
  { value: "team-member", label: "Team member" },
  { value: "external-collaborator", label: "External collaborator" },
  { value: "mentee", label: "Mentee" },
];

export const LIKERT_VALUES = [1, 2, 3, 4, 5] as const;

export const CORE_QUESTIONS: readonly FeedbackQuestion[] = [
  { id: "clear", label: "Communicates clearly and concisely" },
  { id: "listens", label: "Actively listens and considers other perspectives" },
  { id: "reliable", label: "Delivers reliable, high-quality work" },
  { id: "teamwork", label: "Collaborates effectively with others" },
  { id: "supportive", label: "Supports others and contributes positively to team working" },
  { id: "responsive", label: "Responds in a timely and helpful way" },
  {
    id: "constructive",
    label: "Handles feedback, challenges, or disagreement constructively",
  },
];

export const MENTORING_QUESTIONS: readonly FeedbackQuestion[] = [
  { id: "guidance", label: "Provides clear, actionable guidance" },
  { id: "unblocks", label: "Helps unblock problems effectively" },
  { id: "safe", label: "Creates a safe environment to ask questions" },
  { id: "impact", label: "The support had a positive impact on my work" },
];

export const RELATIONSHIP_QUESTION_SET: Record<Relationship, "core" | "mentoring"> = {
  "team-member": "core",
  "external-collaborator": "core",
  mentee: "mentoring",
};

export const RELATIONSHIP_SECTION_VISIBILITY: Record<Relationship, RelationshipSectionVisibility> =
  {
    "team-member": {
      showOpenFeedback: true,
    },
    "external-collaborator": {
      showOpenFeedback: true,
    },
    mentee: {
      showOpenFeedback: true,
    },
  };
