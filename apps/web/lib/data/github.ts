import type { GitHubRepositories, GitHubGists } from "@/types/github";

export async function getGitHubRepos({
  cursor,
  limit = 8,
}: {
  cursor?: string;
  limit?: number;
}): Promise<GitHubRepositories | undefined> {
  if (!process.env.GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is required");
    return;
  }
  const query = `
    query ($cursor: String) {
      user(login: "nicholasgriffintn") {
        repositories(
          first: ${limit},
          after: $cursor,
          ownerAffiliations: OWNER,
          orderBy: {
            field: UPDATED_AT,
            direction: DESC
          },
          privacy: PUBLIC,
          isArchived: false,
          isFork: false,
          hasIssuesEnabled: true
        ) {
          nodes {
            name
            description
            createdAt
            updatedAt
            pushedAt
            id
            url
            homepageUrl
            stargazerCount
            primaryLanguage {
                name
                color
              }
            forkCount
            licenseInfo {
              name
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "NGWeb",
    },
    body: JSON.stringify({
      query,
      variables: { cursor },
    }),
  });

  if (!res.ok) {
    console.error("Error fetching data from GitHub", res.statusText);
    return;
  }

  const data = (await res.json()) as {
    data: {
      user: {
        repositories: GitHubRepositories;
      };
    };
  };

  if (!data?.data?.user?.repositories) {
    console.error("Error fetching data from GitHub", data);
    return;
  }

  return data.data.user.repositories;
}

export async function getGitHubGists(): Promise<GitHubGists | undefined> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "NGWeb",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch("https://api.github.com/users/nicholasgriffintn/gists", {
    headers,
  });

  if (!res.ok) {
    console.error("Error fetching data from GitHub", res.statusText);
    return;
  }

  const data = await res.json();

  return data as GitHubGists;
}
