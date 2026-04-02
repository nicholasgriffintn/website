const BASE_URL = "https://images.nicholasgriffin.dev";

const ReturnImageFormattingUrl = (url: string) => {
  if (url.startsWith("https://cdn.nicholasgriffin.dev/")) {
    const noCDNURL = url.replace("https://cdn.nicholasgriffin.dev/", "");

    return `${BASE_URL}/resize/?image=${noCDNURL}`;
  }

  return url;
};

export default ReturnImageFormattingUrl;
