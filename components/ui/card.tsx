import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-pad", className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card-header">
      <div>
        <h2 className="card-title">{title}</h2>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="card-action">{action}</div>}
    </div>
  );
}

/** A titled card. `howToRead` renders a short reading guide under the content. */
export function SectionCard({
  title,
  subtitle,
  action,
  howToRead,
  className,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  howToRead?: ReactNode;
  className?: string;
}>) {
  return (
    <Card className={className}>
      <CardContent>
        <CardHeader title={title} subtitle={subtitle} action={action} />
        {children}
        {howToRead && (
          <p className="how-to-read">
            <strong>How to read this:</strong> {howToRead}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
