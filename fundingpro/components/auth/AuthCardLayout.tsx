import type { ReactNode } from "react";

type AuthCardLayoutProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Centered auth card — matches fundingpro.uz /sign-in reference. */
export function AuthCardLayout({ title, children, footer }: AuthCardLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <h1 className="text-center text-xl font-semibold text-neutral-900">{title}</h1>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
      </div>
    </div>
  );
}
