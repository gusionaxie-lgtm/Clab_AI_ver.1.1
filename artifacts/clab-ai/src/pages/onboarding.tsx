import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProfile } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  budget: z.string().min(1, "Budget is required"),
  riskLevel: z.enum(["low", "medium", "high"]),
  audience: z.string().min(1, "Target audience is required"),
  timeline: z.string().min(1, "Timeline is required"),
  creatorType: z.enum(["builder", "casual", "agency"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProfile = useCreateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      budget: "",
      riskLevel: "medium",
      audience: "",
      timeline: "",
      creatorType: "builder",
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    createProfile.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Profile Initialized",
            description: "Your strategist profile has been configured successfully.",
          });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Initialization Failed",
            description: "An error occurred while saving your profile. Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card border-border rounded-none shadow-2xl">
        <CardHeader className="space-y-4 border-b border-border/50 pb-6 mb-6">
          <div className="flex items-center gap-3 text-primary">
            <Terminal className="h-6 w-6" />
            <span className="font-mono text-xl font-bold tracking-tighter">CLAB_AI</span>
          </div>
          <div>
            <CardTitle className="text-2xl font-mono">INITIALIZE_PROFILE</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Configure your operational parameters before accessing the terminal.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="creatorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Entity Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-none border-border bg-black/20 font-mono">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-none border-border">
                          <SelectItem value="builder">Builder / Dev Team</SelectItem>
                          <SelectItem value="casual">Casual / Solo Creator</SelectItem>
                          <SelectItem value="agency">Agency / Studio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Risk Tolerance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-none border-border bg-black/20 font-mono">
                            <SelectValue placeholder="Select tolerance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-none border-border">
                          <SelectItem value="low">Low (Conservative)</SelectItem>
                          <SelectItem value="medium">Medium (Balanced)</SelectItem>
                          <SelectItem value="high">High (Degen)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Launch Budget</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 50 BNB" className="rounded-none border-border bg-black/20 font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Expected Timeline</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2 weeks" className="rounded-none border-border bg-black/20 font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Target Audience / Vibe</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tech-savvy traders, anime fans..." className="rounded-none border-border bg-black/20 font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-border/50">
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none border border-primary glow-green font-mono uppercase h-12"
                  disabled={createProfile.isPending}
                >
                  {createProfile.isPending ? "INITIALIZING..." : "ACCESS_TERMINAL"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
