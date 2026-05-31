import { getMusicKitToken } from "@/lib/apple-music/getMusicKitToken";

export async function loader() {
  const musicKitToken = await getMusicKitToken();

  if (!musicKitToken) {
    return new Response("Error generating MusicKit token. Check server logs for details.", {
      status: 500,
    });
  }

  const musicKitTokenJson = JSON.stringify(musicKitToken);

  return new Response(
    `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Apple Music authorization</title>
    <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js" async></script>
    <style>
      :root {
        color-scheme: dark;
        --background: #09090b;
        --panel: #121216;
        --panel-strong: #18181d;
        --border: #2b2b32;
        --foreground: #fafafa;
        --muted: #a1a1aa;
        --accent: #fa233b;
        --accent-strong: #ff5a6d;
        --danger: #ff6b7a;
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
        background: var(--background);
        color: var(--foreground);
        font-family:
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      main {
        display: grid;
        min-height: 100vh;
        place-items: center;
        padding: 2rem;
      }

      .panel {
        width: min(100%, 720px);
        padding: clamp(1.5rem, 4vw, 3rem);
        border: 1px solid var(--border);
        border-radius: 8px;
        background: rgba(18, 18, 22, 0.92);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
      }

      h1 {
        margin: 0;
        font-size: 2.25rem;
        line-height: 0.92;
        letter-spacing: 0;
      }

      .lede {
        max-width: 58ch;
        margin: 1.25rem 0 0;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
        margin-top: 2rem;
      }

      #status {
        margin-top: 1rem;
      }

      button {
        min-height: 2.75rem;
        border: 0;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        background: var(--accent);
        color: white;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        transition:
          background 160ms ease,
          opacity 160ms ease,
          transform 160ms ease;
      }

      button:hover:not(:disabled) {
        background: var(--accent-strong);
        transform: translateY(-1px);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .secondary-button {
        border: 1px solid var(--border);
        background: var(--panel-strong);
        color: var(--foreground);
      }

      .secondary-button:hover:not(:disabled) {
        background: #202027;
      }

      .status {
        margin: 0;
        color: var(--muted);
        font-size: 0.92rem;
      }

      .alert {
        margin-top: 1.5rem;
        border-left: 3px solid var(--danger);
        padding: 0.875rem 1rem;
        background: rgba(255, 107, 122, 0.1);
        color: #ffd7dc;
      }

      .alert strong,
      .alert span {
        display: block;
      }

      .alert span {
        margin-top: 0.25rem;
        color: var(--muted);
      }

      .token-panel {
        margin-top: 2rem;
      }

      .token-heading {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .token-heading h2 {
        margin: 0;
        font-size: 1rem;
      }

      pre {
        max-height: 260px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1rem;
        background: #050507;
        color: #f4f4f5;
        font-size: 0.82rem;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .hidden {
        display: none;
      }

      @media (max-width: 560px) {
        main {
          padding: 1rem;
        }

        .panel {
          padding: 1.25rem;
        }

        .actions,
        .actions button,
        .token-heading,
        .token-heading button {
          width: 100%;
        }
      }
    </style>
  </head>

  <body>
    <main>
      <section class="panel" aria-labelledby="page-title">
        <h1 id="page-title">Generate a MusicKit user token</h1>
        <p class="lede">
          Connect with Apple Music, then copy the generated Music-User-Token into the
          APPLE_MUSIC_USER_TOKEN environment variable.
        </p>

        <div class="actions">
          <button id="authorize-button" type="button" disabled>Loading MusicKit...</button>
        </div>

        <p id="status" class="status" role="status">Preparing Apple Music authorization.</p>

        <div id="error-alert" class="alert hidden" role="alert">
          <strong>Authorization failed</strong>
          <span id="error-content"></span>
        </div>

        <section id="token-panel" class="token-panel hidden" aria-labelledby="token-title">
          <div class="token-heading">
            <h2 id="token-title">Music-User-Token</h2>
            <button id="copy-token-button" class="secondary-button" type="button">Copy token</button>
          </div>
          <pre><code id="user-token-display"></code></pre>
        </section>
      </section>
    </main>

    <script>
      (function () {
        const developerToken = ${musicKitTokenJson};
        const buttonElement = document.getElementById("authorize-button");
        const copyButtonElement = document.getElementById("copy-token-button");
        const statusElement = document.getElementById("status");
        const errorAlertElement = document.getElementById("error-alert");
        const errorContentElement = document.getElementById("error-content");
        const tokenPanelElement = document.getElementById("token-panel");
        const userTokenDisplayElement = document.getElementById("user-token-display");

        let musicKit;
        let userToken = "";

        function setStatus(message) {
          statusElement.textContent = message;
        }

        function showError(message) {
          errorContentElement.textContent = message;
          errorAlertElement.classList.remove("hidden");
        }

        function clearError() {
          errorContentElement.textContent = "";
          errorAlertElement.classList.add("hidden");
        }

        async function configureMusicKit() {
          clearError();
          musicKit = await MusicKit.configure({ 
            developerToken
          });

          buttonElement.removeAttribute("disabled");
          buttonElement.textContent = "Connect with Apple Music";
          setStatus("Ready to request a Music-User-Token.");
        }

        buttonElement.addEventListener("click", async function () {
          clearError();

          buttonElement.setAttribute("disabled", "true");
          buttonElement.textContent = "Opening Apple Music...";
          setStatus("Waiting for Apple Music authorization.");

          try {
            const userToken = await musicKit.authorize();

            userTokenDisplayElement.textContent = userToken;
            tokenPanelElement.classList.remove("hidden");
            setStatus("Token generated. Copy it into APPLE_MUSIC_USER_TOKEN.");
          } catch (error) {
            console.error(error);
            setStatus("Authorization failed.");
            showError("Unable to authorize access to Apple Music.");
          } finally {
            buttonElement.removeAttribute("disabled");
            buttonElement.textContent = "Connect with Apple Music";
          }
        });

        copyButtonElement.addEventListener("click", async function () {
          if (!userToken) {
            return;
          }

          try {
            await navigator.clipboard.writeText(userToken);
            copyButtonElement.textContent = "Copied";
            window.setTimeout(function () {
              copyButtonElement.textContent = "Copy token";
            }, 1600);
          } catch (error) {
            console.error(error);
            showError("Copy failed. Select the token manually.");
          }
        });

        if (window.MusicKit) {
          configureMusicKit();
        } else {
          document.addEventListener("musickitloaded", configureMusicKit, { once: true });
        }

        window.setTimeout(function () {
          if (!musicKit) {
            showError("MusicKit is taking longer than expected to load.");
            setStatus("Still waiting for Apple Music.");
          }
        }, 10000);
      })();
    </script>
  </body>
</html>
`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}
