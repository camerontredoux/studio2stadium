import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CsvUploaderProps = {
  title: string;
  description: string;
  onUpload: (file: File) => void;
  isPending: boolean;
};

export function CsvUploader({ title, description, onUpload, isPending }: CsvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFile(file: File) {
    setSelectedFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleUpload() {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card
      className={`cursor-pointer border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-muted/50" : "border-muted-foreground/30"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !selectedFile && inputRef.current?.click()}
    >
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
        />
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium">{selectedFile.name}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={isPending}
              >
                {isPending ? "Uploading..." : "Upload"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={isPending}
              >
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Drop a CSV here or click to browse</p>
        )}
      </CardContent>
    </Card>
  );
}
