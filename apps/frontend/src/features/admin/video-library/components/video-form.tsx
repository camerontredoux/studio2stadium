import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VIDEO_CATEGORIES } from "@/utils/constants/categories";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { libraryVideoSchema, type LibraryVideoFormData } from "../api/schemas";

interface VideoFormProps {
  onSubmit: (data: LibraryVideoFormData) => void;
  formId: string;
}

const categoryOptions = Object.entries(VIDEO_CATEGORIES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function VideoForm({ onSubmit, formId }: VideoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<LibraryVideoFormData>({
    resolver: zodResolver(libraryVideoSchema),
    defaultValues: {
      title: "",
      category: "",
      youtubeUrl: "",
    },
  });

  const youtubeUrl = watch("youtubeUrl");
  const youtubeId = getYouTubeId(youtubeUrl);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field invalid={!!errors.title}>
          <FieldLabel>Title</FieldLabel>
          <Input {...register("title")} placeholder="Video title" />
          <FieldError error={errors.title} />
        </Field>

        <Field invalid={!!errors.category}>
          <FieldLabel>Category</FieldLabel>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                items={categoryOptions}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError error={errors.category} />
        </Field>

        <Field invalid={!!errors.youtubeUrl}>
          <FieldLabel>YouTube URL</FieldLabel>
          <Input
            {...register("youtubeUrl")}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <FieldError error={errors.youtubeUrl} />
        </Field>

        {youtubeId && (
          <div className="overflow-clip rounded-xl border bg-black/5 dark:bg-white/5">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        )}
      </FieldGroup>
    </form>
  );
}
