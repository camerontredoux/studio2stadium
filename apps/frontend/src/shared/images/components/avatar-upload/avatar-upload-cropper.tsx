import { Button } from "@/components/ui/button";
import {
  Cropper,
  CropperArea,
  CropperImage,
  type CropperAreaData,
  type CropperPoint,
} from "@/components/ui/cropper";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CropIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

async function createCroppedImage(
  imageSrc: string,
  cropData: CropperAreaData,
  fileName: string,
): Promise<File> {
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = cropData.width;
      canvas.height = cropData.height;

      ctx.drawImage(
        image,
        cropData.x,
        cropData.y,
        cropData.width,
        cropData.height,
        0,
        0,
        cropData.width,
        cropData.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }

          const croppedFile = new File([blob], `cropped-${fileName}`, {
            type: "image/jpeg",
          });
          resolve(croppedFile);
        },
        "image/jpeg",
        0.9,
      );
    };

    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}

interface AvatarUploadCropperProps {
  image: File;
  onCrop: (croppedFile: File) => void;
}

const DEFAULT_CROP: CropperPoint = { x: 0, y: 0 };
const DEFAULT_ZOOM = 1;

export function AvatarUploadCropper({
  image,
  onCrop,
}: AvatarUploadCropperProps) {
  const [crop, setCrop] = useState<CropperPoint>(DEFAULT_CROP);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [croppedArea, setCroppedArea] = useState<CropperAreaData | null>(null);
  const [open, setOpen] = useState(false);

  // Keep the original image so re-cropping doesn't shrink it
  const lastCroppedRef = useRef<File | null>(null);
  const originalImageRef = useRef(image);

  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (image !== lastCroppedRef.current) {
      originalImageRef.current = image;
    }
    const url = URL.createObjectURL(originalImageRef.current);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleReset = useCallback(() => {
    setCrop(DEFAULT_CROP);
    setZoom(DEFAULT_ZOOM);
  }, []);

  const handleApply = useCallback(async () => {
    if (!croppedArea) return;
    const croppedFile = await createCroppedImage(
      imageUrl,
      croppedArea,
      originalImageRef.current.name,
    );
    lastCroppedRef.current = croppedFile;
    onCrop(croppedFile);
    setOpen(false);
  }, [croppedArea, imageUrl, onCrop]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <CropIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crop Avatar</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <div className="relative h-64 w-full overflow-hidden rounded-md">
            <Cropper
              crop={crop}
              zoom={zoom}
              aspectRatio={1}
              shape="circle"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropAreaChange={(_pct, pixels) => setCroppedArea(pixels)}
              className="h-full w-full"
            >
              <CropperImage src={imageUrl} alt="Crop preview" />
              <CropperArea />
            </Cropper>
          </div>
          <div className="space-y-2">
            <Label>Zoom</Label>
            <Slider
              value={[zoom]}
              onValueChange={(value) =>
                setZoom(Array.isArray(value) ? value[0] : value)
              }
              min={1}
              max={3}
              step={0.1}
            />
          </div>
        </DialogPanel>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
