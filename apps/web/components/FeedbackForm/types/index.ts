import type { ReactNode } from "react";

export type Relationship =
  | "team-member"
  | "external-collaborator"
  | "mentee"
  | "conference-contact";

export interface RelationshipOption {
  value: Relationship;
  label: string;
}

export interface FeedbackQuestion {
  id: string;
  label: string;
}

export interface FeedbackQuestionSection {
  title: string;
  questions: readonly FeedbackQuestion[];
}

export interface RelationshipSectionVisibility {
  showFrequency: boolean;
  showCore: boolean;
  showTechnical: boolean;
  showMentoring: boolean;
  showCalibration: boolean;
  showOpenFeedback: boolean;
  showOverallNote: boolean;
}

export interface RatingQuestionProps {
  id: string;
  name: string;
  label: string;
  required: boolean;
  disabled?: boolean;
}

export interface OptionLimitCheckboxProps {
  id: string;
  name: string;
  option: string;
  selectedCount: number;
  checked: boolean;
  disabled?: boolean;
  onToggle: (option: string, checked: boolean) => void;
}

export interface FormSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}
