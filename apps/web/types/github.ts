export type GitHubRepositories = {
  nodes: GitHubProjects;
  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
  };
};

export type GitHubProjects = {
  id: number;
  name: string;
  url: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  homepageUrl: string;
  stargazersCount: number;
  primaryLanguage: {
    name: string;
    color: string;
  };
  forkCount: number;
  licenseInfo: {
    name: string;
  };
  repositoryTopics: {
    nodes: {
      topic: {
        name: string;
      };
    }[];
  };
}[];

export type GitHubGists = {
  url: string;
  id: string;
  node_id: string;
  git_pull_url: string;
  git_push_url: string;
  html_url: string;
  files: {
    [key: string]: {
      filename: string;
      type: string;
      language: string;
      raw_url: string;
      size: number;
    };
  };
  public: boolean;
  created_at: string;
  updated_at: string;
  description: string;
  comments: number;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    url: string;
  };
  truncated: boolean;
}[];
