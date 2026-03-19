const ReturnImageFormattingUrl = (url: string) => {
  const baseUrls = {
    development: "https://images.nicholasgriffin.dev",
    production: "https://images.nicholasgriffin.dev",
    test: "https://images.nicholasgriffin.dev",
  } as const;
  const baseUrl = baseUrls[process.env.NODE_ENV as keyof typeof baseUrls] ?? baseUrls.production;

  if (url.includes("https://cdn.nicholasgriffin.dev/")) {
    const noCDNURL = url.replace("https://cdn.nicholasgriffin.dev/", "");

    return `${baseUrl}/resize/?image=${noCDNURL}`;
  }

  return url;
};

export default ReturnImageFormattingUrl;
