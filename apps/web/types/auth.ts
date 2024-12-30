export interface GitHubUser {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string;
  location: string | null;
  login: string;
  company: string | null;
  blog: string | null;
  bio: string | null;
  twitter_username: string | null;
}

export type User = {
  email: string;
  name: string | null;
  avatar_url: string | null;
  username: string | null;
}
