import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProject } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Terminal } from "lucide-react";

const projectSchema = z.object({
  idea: z.string().min(10, "Please provide more detail about your idea"),
  name: z.string().optional(),
  ticker: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProject = useCreateProject();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      idea: "",
      name: "",
      ticker: "",
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    createProject.mutate(
      { data },
      {
        onSuccess: (project) => {
          toast({
            title: "Project Initialized",
            description: "Your new meme coin project has been created.",
          });
          setLocation(`/projects/${project.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Initialization Failed",
            description: "An error occurred while creating the project.",
          });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono text-white">NEW_PROJECT</h1>
          <p className="text-muted-foreground mt-1">
            Initialize a new tracking workspace for your meme coin concept.
          </p>
        </div>

        <Card className="glass-card border-border rounded-none">
          <CardHeader className="border-b border-border/50 pb-6 mb-6">
            <CardTitle className="flex items-center gap-2 text-xl font-mono">
              <Terminal className="h-5 w-5 text-primary" />
              PROJECT_PARAMETERS
            </CardTitle>
            <CardDescription>
              Provide the core concept. The AI strategist will help generate the rest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Project Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., DogeCoin" className="rounded-none border-border bg-black/20 font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ticker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Ticker (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., DOGE" className="rounded-none border-border bg-black/20 font-mono uppercase" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="idea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Core Concept / Idea *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the meme, the target audience, the vibe, and the unique hook..." 
                          className="min-h-[150px] rounded-none border-border bg-black/20 font-mono" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-border/50 flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none border border-primary glow-green font-mono uppercase"
                    disabled={createProject.isPending}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {createProject.isPending ? "INITIALIZING..." : "COMPILE_PROJECT"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
