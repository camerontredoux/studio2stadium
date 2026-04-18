import { useState } from "react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { ContentCard } from "@/components/shared/content-card";
import type { Partner } from "@/shared/types";

interface PartnerCardProps {
  partner: Partner
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ContentCard
      image={partner.logo}
      imageAlt={partner.name}
      title={partner.name}
      footer={
        <div className="flex flex-col w-full items-start">
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger
              render={<Button size="xs" />}
            >
              Read More
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{partner.name}</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="flex flex-col gap-5">
                    <p>{partner.longDescription ?? partner.description}</p>
                    {partner.discount && (
                      <p>Discount: {partner.discount}</p>
                    )}
                    {(partner.loginUrl || partner.website) && (
                      <div className="flex flex-wrap gap-2">
                        {partner.loginUrl && (
                          <Button
                            variant="outline"
                            size="xs"
                            render={
                              <a
                                href={partner.loginUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          >
                            Login
                          </Button>
                        )}
                        {partner.website && (
                          <Button
                            variant="outline"
                            size="xs"
                            render={
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          >
                            Visit Partner
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose
                  render={<Button variant="secondary" />}
                >
                  Cancel
                </AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
    >
      <p className="text-muted-foreground line-clamp-2 text-sm">
        {partner.description}
      </p>
    </ContentCard>
  )
}