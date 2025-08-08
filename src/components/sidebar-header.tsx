'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/app/actions/auth';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function SidebarHeader() {
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await logoutAction();
      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
  });

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 w-full">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">
                Building Your Application
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Button
        variant="outline"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
      >
        {logoutMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging out...
          </>
        ) : (
          'Logout'
        )}
      </Button>
    </header>
  );
}
