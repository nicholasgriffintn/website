import type { GitHubRepositories, GitHubGists } from "@/types/github";
import { getEnvValue } from "@/lib/env";
import { CacheManager } from "@/lib/cache";
import type { CacheRequestContext } from "@/lib/cache";
import { parsePositiveIntegerInRange } from "@/lib/numbers";

const githubToken = getEnvValue("GITHUB_TOKEN");
const githubCache = new CacheManager<unknown>({
  duration: 5 * 60 * 1000,
  maxEntries: 256,
  namespace: "github-api",
});

export async function getGitHubRepos({
  cursor,
  limit = 8,
  cacheContext,
}: {
  cursor?: string;
  limit?: number;
  cacheContext?: CacheRequestContext;
}): Promise<GitHubRepositories | undefined> {
  if (!githubToken) {
    console.error("GITHUB_TOKEN is required");
    return;
  }
  const safeLimit = parsePositiveIntegerInRange(limit, {
    min: 1,
    max: 20,
    fallback: 8,
  });
  const cacheKey = `repos_${safeLimit}_${cursor ?? "first"}`;

  const query = `
    query ($cursor: String, $limit: Int!) {
      user(login: "nicholasgriffintn") {
        repositories(
          first: $limit,
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

  return githubCache.upsert(
    cacheKey,
    async () => {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "NGWeb",
        },
        body: JSON.stringify({
          query,
          variables: { cursor, limit: safeLimit },
        }),
      });

      if (!res.ok) {
        console.error("Error fetching data from GitHub", res.statusText);
        return undefined;
      }

      const data = (await res.json()) as {
        data?: {
          user?: {
            repositories?: GitHubRepositories;
          };
        };
        errors?: unknown[];
      };

      if (!data?.data?.user?.repositories || data.errors?.length) {
        console.error("Error fetching data from GitHub", data.errors ?? data);
        return undefined;
      }

      return data.data.user.repositories;
    },
    cacheContext,
  );
}

export async function getGitHubGists(
  cacheContext?: CacheRequestContext,
): Promise<GitHubGists | undefined> {
  const cacheKey = "gists_latest";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "NGWeb",
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return githubCache.upsert(
    cacheKey,
    async () => {
      const res = await fetch("https://api.github.com/users/nicholasgriffintn/gists", {
        headers,
      });

      if (!res.ok) {
        console.error("Error fetching data from GitHub", res.statusText);
        return undefined;
      }

      const data = await res.json();
      return data as GitHubGists;
    },
    cacheContext,
  );
}
