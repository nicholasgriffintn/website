import type { ReactNode } from "react";

export type Relationship = "team-member" | "external-collaborator" | "mentee";

export interface RelationshipOption {
  value: Relationship;
  label: string;
}

export interface FeedbackQuestion {
  id: string;
  label: string;
}

export interface RelationshipSectionVisibility {
  showOpenFeedback: boolean;
}

export interface RatingQuestionProps {
  id: string;
  name: string;
  label: string;
  required: boolean;
  disabled?: boolean;
}

export interface FormSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}
