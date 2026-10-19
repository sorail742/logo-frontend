import { ProjectFrame } from "@/components/projects/project-frame";

export default function ProjectLayout({ children }: LayoutProps<"/[locale]/app/projets/[pid]">) {
  return <ProjectFrame>{children}</ProjectFrame>;
}
