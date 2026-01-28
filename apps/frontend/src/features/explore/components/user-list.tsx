import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../api/queries";

export function UserList() {
  const { data } = useSuspenseQuery(queries.explore());

  return (
    <div>
      {data.test}
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>
          Open Sheet
        </SheetTrigger>
        <SheetPopup variant="inset">
          <SheetHeader>
            <SheetTitle>This is a sheet</SheetTitle>
            <SheetDescription>This is a description</SheetDescription>
          </SheetHeader>
          <SheetContent>
            <div>Lots of content</div>
            <div>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
              quod asperiores debitis cumque eaque adipisci! A obcaecati tenetur
              labore neque excepturi optio. Voluptate sit voluptatibus ipsam?
              Atque, reiciendis. Illum, aspernatur!
            </div>
            <div>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
              quod asperiores debitis cumque eaque adipisci! A obcaecati tenetur
              labore neque excepturi optio. Voluptate sit voluptatibus ipsam?
              Atque, reiciendis. Illum, aspernatur!
            </div>
            <div>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
              quod asperiores debitis cumque eaque adipisci! A obcaecati tenetur
              labore neque excepturi optio. Voluptate sit voluptatibus ipsam?
              Atque, reiciendis. Illum, aspernatur!
            </div>
            <div>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
              quod asperiores debitis cumque eaque adipisci! A obcaecati tenetur
              labore neque excepturi optio. Voluptate sit voluptatibus ipsam?
              Atque, reiciendis. Illum, aspernatur!
            </div>
            <div>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
              quod asperiores debitis cumque eaque adipisci! A obcaecati tenetur
              labore neque excepturi optio. Voluptate sit voluptatibus ipsam?
              Atque, reiciendis. Illum, aspernatur!
            </div>
            <div>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
              quod asperiores debitis cumque eaque adipisci! A obcaecati tenetur
              labore neque excepturi optio. Voluptate sit voluptatibus ipsam?
              Atque, reiciendis. Illum, aspernatur!
            </div>
            <div>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
              quod asperiores debitis cumque eaque adipisci! A obcaecati tenetur
              labore neque excepturi optio. Voluptate sit voluptatibus ipsam?
              Atque, reiciendis. Illum, aspernatur!
            </div>
            <div>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
              quod asperiores debitis cumque eaque adipisci! A obcaecati tenetur
              labore neque excepturi optio. Voluptate sit voluptatibus ipsam?
              Atque, reiciendis. Illum, aspernatur!
            </div>
          </SheetContent>
        </SheetPopup>
      </Sheet>
    </div>
  );
}
