import type {
  FeedbackQuestion,
  FeedbackQuestionSection,
  Relationship,
  RelationshipSectionVisibility,
  RelationshipOption,
} from "@/components/FeedbackForm/types";

export const CONTACT_API_URL =
  import.meta.env.VITE_CONTACT_API_URL || "https://email.nicholasgriffin.dev";
export const ANONYMOUS_FROM_EMAIL = "anonymous-feedback@nicholasgriffin.dev";

export const RELATIONSHIP_OPTIONS: readonly RelationshipOption[] = [
  { value: "conference-contact", label: "Conference/event contact (met in passing)" },
  { value: "mentee", label: "Mentee (received mentoring)" },
  { value: "team-member", label: "Team member (same team at my workplace)" },
  {
    value: "external-collaborator",
    label: "External collaborator (different team / stakeholder at my workplace)",
  },
];

export const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Occasionally", "Rarely"] as const;
export const LIKERT_VALUES = [1, 2, 3, 4, 5] as const;

export const CORE_SECTIONS: readonly FeedbackQuestionSection[] = [
  {
    title: "Delivery & execution",
    questions: [
      { id: "delivery_reliable", label: "Delivers work that is reliable and high quality" },
      { id: "delivery_speed_quality", label: "Balances speed vs quality appropriately" },
      { id: "delivery_risk", label: "Identifies risks and issues early" },
    ],
  },
  {
    title: "Communication",
    questions: [
      { id: "communication_clear", label: "Communicates clearly and concisely" },
      { id: "communication_level", label: "Explains technical concepts at the right level" },
      {
        id: "communication_expectations",
        label: "Sets clear expectations on scope and timelines",
      },
    ],
  },
  {
    title: "Collaboration",
    questions: [
      { id: "collaboration_easy", label: "Easy to work with" },
      { id: "collaboration_responsive", label: "Responds in a timely and helpful way" },
      {
        id: "collaboration_challenges",
        label: "Handles challenges or disagreements constructively",
      },
    ],
  },
];

export const TECHNICAL_QUESTIONS: readonly FeedbackQuestion[] = [
  { id: "technical_decisions", label: "Makes sound technical decisions" },
  { id: "technical_tradeoffs", label: "Communicates trade-offs effectively" },
  {
    id: "technical_design",
    label: "Designs solutions that are maintainable and scalable",
  },
  {
    id: "technical_standards",
    label: "Contributes positively to overall engineering standards",
  },
];

export const MENTORING_SECTIONS: readonly FeedbackQuestionSection[] = [
  {
    title: "Mentoring quality",
    questions: [
      { id: "mentoring_guidance", label: "Provides clear, actionable guidance" },
      {
        id: "mentoring_level",
        label: "Adapts to the right level (not too basic / not too advanced)",
      },
      { id: "mentoring_unblock", label: "Helps unblock problems effectively" },
      {
        id: "mentoring_safety",
        label: "Creates a safe environment to ask questions",
      },
    ],
  },
  {
    title: "Outcome focus",
    questions: [
      {
        id: "mentoring_impact",
        label: "The support I received had a positive impact on my work",
      },
      { id: "mentoring_applied", label: "I've applied what I learned" },
    ],
  },
];

export const IMPACT_QUESTIONS: readonly FeedbackQuestion[] = [
  {
    id: "impact_goals",
    label: "My work positively contributes to your/team goals",
  },
  {
    id: "impact_beyond_tasks",
    label: "Adds value beyond immediate tasks (direction, clarity, support)",
  },
];

export const STRENGTH_OPTIONS = [
  "Technical decision-making",
  "Communication",
  "Delivery reliability",
  "Mentoring/support",
  "Collaboration",
] as const;

export const IMPROVEMENT_OPTIONS = [
  "Technical depth",
  "Clarity of communication",
  "Speed of delivery",
  "Proactiveness",
  "Stakeholder alignment",
  "Mentoring effectiveness",
] as const;

export const RELATIONSHIP_SECTION_VISIBILITY: Record<Relationship, RelationshipSectionVisibility> =
  {
    "team-member": {
      showFrequency: true,
      showCore: true,
      showTechnical: true,
      showMentoring: false,
      showCalibration: true,
      showOpenFeedback: true,
      showOverallNote: false,
    },
    "external-collaborator": {
      showFrequency: true,
      showCore: true,
      showTechnical: false,
      showMentoring: false,
      showCalibration: true,
      showOpenFeedback: true,
      showOverallNote: false,
    },
    mentee: {
      showFrequency: false,
      showCore: false,
      showTechnical: false,
      showMentoring: true,
      showCalibration: false,
      showOpenFeedback: false,
      showOverallNote: false,
    },
    "conference-contact": {
      showFrequency: false,
      showCore: false,
      showTechnical: false,
      showMentoring: false,
      showCalibration: false,
      showOpenFeedback: false,
      showOverallNote: true,
    },
  };
