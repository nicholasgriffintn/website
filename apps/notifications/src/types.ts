export type NotificationType =
  | "train.listening.started"
  | "train.listening.stopped"
  | "train.time.changed"
  | "train.platform.changed"
  | "train.status.changed";

export type TrainNotification = {
  type: NotificationType;
  occurredAt: string;
  subscription: {
    subscriptionId: string;
    originTpl: string;
    destinationTpl: string;
    serviceDate: string;
    plannedDepartureTime: string;
  };
  train: {
    rid?: string;
    uid?: string;
    field?: "time" | "platform" | "status" | "listening";
    previous?: string;
    current?: string;
  };
};

export type NotificationMessage = TrainNotification;

export type Env = {
  NOTIFICATIONS_TOKEN: string;
  EMAIL_SERVICE_TOKEN: string;
  NOTIFICATION_EMAIL_TO?: string;
  EMAIL_SERVICE: Fetcher;
};

export type EmailRequest = {
  to?: string;
  subject: string;
  text: string;
};
