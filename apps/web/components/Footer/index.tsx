import { Link } from "@/components/Link";

export function Footer() {
  return (
    <footer className="w-full">
      <div className="container md:flex items-left justify-left py-4 gap-4">
        <div>
          <span>
            © {new Date().getFullYear()} Nicholas Griffin.{" "}
            <Link
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              showExternalIcon={false}
            >
              CC BY-SA 4.0
            </Link>
          </span>
        </div>
        <div className="hidden md:block">
          <span> | </span>
        </div>
        <div>
          <nav>
            <ul className="flex items-left space-x-4">
              <li>
                <Link
                  href="https://absent.computer"
                  target="_blank"
                  rel="noopener noreferrer"
                  showExternalIcon={false}
                >
                  Absent Computer
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/nicholasgriffintn/NGWebsite2021"
                  target="_blank"
                  rel="noopener noreferrer"
                  showExternalIcon={false}
                >
                  Source Code
                </Link>
              </li>
              <li>
                <Link href="/rss">RSS</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
