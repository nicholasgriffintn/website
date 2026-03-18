import type { GitHubGists } from "@/types/github";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/Link";

export function SnippetsList({ gists }: { gists: GitHubGists | undefined }) {
  return (
    <section>
      {gists && gists.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {gists.map((gist) => {
            return (
              <Card key={gist.id} className="overflow-hidden">
                <CardHeader>
                  {gist.description && (
                    <Link
                      href={gist.html_url}
                      target="_blank"
                      rel="noopener noreferer"
                      underline={false}
                    >
                      <CardTitle>{gist.description}</CardTitle>
                    </Link>
                  )}
                </CardHeader>
                <CardContent>
                  {gist.files && Object.keys(gist.files).length > 0 ? (
                    <div className="pb-5">
                      <span>Files:</span>
                      <ul className="pt-2">
                        {Object.keys(gist.files).map((file, index) => {
                          if (!gist?.files?.[file]) return null;

                          const fileData = gist.files[file];

                          const colour =
                            fileData.language === "JavaScript"
                              ? "#f7df1c"
                              : fileData.language === "PHP"
                                ? "#777bb4"
                                : fileData.language === "HTML"
                                  ? "#e34f25"
                                  : fileData.language === "Vue"
                                    ? "#42b883"
                                    : fileData.language === "Go"
                                      ? "#00ADD8"
                                      : fileData.language === "C++"
                                        ? "#f34b7d"
                                        : fileData.language === "C#"
                                          ? "#178600"
                                          : fileData.language === "Python"
                                            ? "#3572A5"
                                            : fileData.language === "TypeScript"
                                              ? "#2b7489"
                                              : fileData.language === "CSS"
                                                ? "#563d7c"
                                                : fileData.language === "Swift"
                                                  ? "#F05138"
                                                  : fileData.language === "Java"
                                                    ? "#b07219"
                                                    : fileData.language === "C"
                                                      ? "#555555"
                                                      : fileData.language === "Ruby"
                                                        ? "#701516"
                                                        : fileData.language === "CoffeeScript"
                                                          ? "#244776"
                                                          : fileData.language === "Rust"
                                                            ? "#dea584"
                                                            : fileData.language === "Dart"
                                                              ? "#89e051"
                                                              : fileData.language === "PowerShell"
                                                                ? "#012456"
                                                                : fileData.language === "Dockerfile"
                                                                  ? "#384d54"
                                                                  : fileData.language === "YAML"
                                                                    ? "#333"
                                                                    : "#fff";

                          return (
                            <li
                              key={`file-${fileData.filename}-${index}`}
                              className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                            >
                              <span
                                className="flex h-2 w-2 translate-y-1 rounded-full"
                                style={{
                                  backgroundColor: colour,
                                }}
                              />
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                  {fileData.filename}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Type: {fileData.type}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Size: {fileData.size}
                                </p>
                                {fileData.language ? (
                                  <p className="text-sm text-muted-foreground">
                                    Language: {fileData.language}
                                  </p>
                                ) : null}
                                <div className="w-full flex justify-left">
                                  <Link
                                    href={fileData.raw_url}
                                    muted
                                    target="_blank"
                                    rel="noopener noreferer"
                                    className="text-sm text-muted-foreground"
                                  >
                                    View FIle
                                  </Link>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
