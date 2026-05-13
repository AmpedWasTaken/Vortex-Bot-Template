import Link from 'next/link';
import type { ReactElement } from 'react';
import { LoginForm } from '@/components/login-form';
import { isDashboardPasswordConfigured } from '@/lib/dashboard-password';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage(props: LoginPageProps): Promise<ReactElement> {
  const searchParams = await props.searchParams;
  const next = searchParams.next ?? '/dashboard';
  const configured = isDashboardPasswordConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Badge variant="outline" className="mx-auto">
            Vortex Control Plane
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Password gate for local/staging. Replace with your identity provider before production.
          </p>
        </div>

        <Card className="border-border/80 shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle>Dashboard access</CardTitle>
            <CardDescription>Use the password from `dashboard/.env.local`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!configured ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Set <span className="font-mono">DASHBOARD_PASSWORD</span> (8+ chars) and{' '}
                <span className="font-mono">DASHBOARD_SESSION_SECRET</span> (32+ chars) in{' '}
                <span className="font-mono">dashboard/.env.local</span>, then restart <span className="font-mono">npm run dev</span>.
              </p>
            ) : null}
            <LoginForm nextPath={next} disabled={!configured} />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to marketing page
          </Link>
        </p>
      </div>
    </div>
  );
}
