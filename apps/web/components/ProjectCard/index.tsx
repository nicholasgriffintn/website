import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/Link";
import type { Project } from "@/types/projects";
import { buttonVariants } from "@/components/ui/button";
import { parseMarkdown } from "@/lib/markdown";
import { Image } from "@/components/Image";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card key={project.name} className="overflow-hidden">
      {project.image && (
        <div className="max-h-[190px] min-h-[190px] overflow-hidden h-full">
          <Image
            src={project.image}
            alt={project.imageAlt || project.name}
            className="w-full object-cover"
            loading="lazy"
            width={700}
            height={190}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="leading-7">{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {project.description && (
          <div className="text-sm text-muted-foreground">
            {parseMarkdown(project.description, true)}
          </div>
        )}
        <div className="w-full flex justify-left">
          {project.url && (
            <Link
              href={project.url}
              muted
              target="_blank"
              rel="noopener noreferer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
              underline={false}
            >
              View Project
            </Link>
          )}
          {project.links && (
            <div className="flex flex-wrap gap-2">
              {project.links.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  muted
                  target="_blank"
                  rel="noopener noreferer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  underline={false}
                >
                  {link.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
