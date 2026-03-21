const BASE_URL = "https://images.nicholasgriffin.dev";

const ReturnImageFormattingUrl = (url: string) => {
  if (url.includes("https://cdn.nicholasgriffin.dev/")) {
    const noCDNURL = url.replace("https://cdn.nicholasgriffin.dev/", "");

    return `${BASE_URL}/resize/?image=${noCDNURL}`;
  }

  return url;
};

export default ReturnImageFormattingUrl;
