import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import { motion } from "framer-motion";

export function UploadCard({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    maxFiles: 1,
    multiple: false,
    onDrop: (files) => {
      if (files[0]) onFile(files[0]);
    },
  });

  if (file) {
    return (
      <div className="card-surface p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {(file.size / 1024).toFixed(1)} KB · CSV
              </div>
            </div>
          </div>
          <button
            onClick={() => onFile(null)}
            className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-surface-2"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      {...getRootProps()}
      whileHover={{ scale: 1.005 }}
      className={`card-surface border-dashed cursor-pointer transition-colors ${
        isDragActive ? "border-primary/60 bg-primary/5" : "hover:border-border-strong"
      }`}
    >
      <input {...getInputProps()} />
      <div className="p-10 flex flex-col items-center text-center">
        <div className="size-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center mb-4">
          <UploadCloud className="size-6 text-primary" />
        </div>
        <div className="text-sm font-medium">Drop your portfolio CSV here</div>
        <div className="text-[12px] text-muted-foreground mt-1">
          or click to browse. Columns: <span className="font-mono">ticker, quantity</span>
        </div>
      </div>
    </motion.div>
  );
}
