import { useListProjects } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, FolderGit2, ArrowRight, Activity, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono text-white">PROJECT_ARCHIVE</h1>
            <p className="text-muted-foreground mt-1">
              All tracked meme coin initiatives and their operational status.
            </p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none border border-primary glow-green">
              <Plus className="mr-2 h-4 w-4" /> Initialize Project
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-24 w-full rounded-none" />
            <Skeleton className="h-24 w-full rounded-none" />
            <Skeleton className="h-24 w-full rounded-none" />
          </div>
        ) : projects?.length === 0 ? (
          <Card className="glass-card border-dashed border-border rounded-none bg-transparent">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <FolderGit2 className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium text-white">Archive Empty</p>
                <p className="text-sm text-muted-foreground mt-1">No active projects found in the database.</p>
              </div>
              <Link href="/projects/new">
                <Button className="rounded-none border border-primary text-primary hover:bg-primary/10">
                  Create First Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects?.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="glass-card rounded-none cursor-pointer hover:border-primary/50 transition-colors group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">
                            {project.name || "UNNAMED_PROJECT"}
                          </h3>
                          {project.ticker && (
                            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-mono rounded-sm border border-border">
                              ${project.ticker}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-3xl">
                          {project.idea}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm font-mono shrink-0">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
