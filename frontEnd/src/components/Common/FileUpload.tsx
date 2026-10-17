import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  acceptedTypes?: string;
  maxSize?: number;
  label: string;
  currentFile?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  acceptedTypes = ".pdf,.doc,.docx",
  maxSize = 5 * 1024 * 1024, // 5MB
  label,
  currentFile,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError("");

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          const errorMsg = "File is too large. Maximum size is 5MB.";
          setError(errorMsg);
          toast.error(errorMsg);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          const errorMsg =
            "Invalid file type. Please upload PDF or Word documents.";
          setError(errorMsg);
          toast.error(errorMsg);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedFile(file);
        onFileUpload(file); // Pass the file to parent component
        toast.success("File selected successfully!");
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize,
    multiple: false,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setError("");
    toast.success("File removed");
  };

  return (
    <div className="file-upload">
      <label className="upload-label">{label}</label>

      {!uploadedFile && !currentFile && (
        <div
          {...getRootProps()}
          className={`upload-zone ${isDragActive ? "drag-active" : ""} ${
            error ? "error" : ""
          }`}
        >
          <input {...getInputProps()} />
          <div className="upload-content">
            <Upload className="upload-icon" />
            <div className="upload-text">
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <>
                  <p>
                    <strong>Click to upload</strong> or drag and drop
                  </p>
                  <p className="upload-hint">PDF, DOC, DOCX up to 5MB</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {(uploadedFile || currentFile) && (
        <div className="uploaded-file">
          <div className="file-info">
            <File className="file-icon" />
            <div className="file-details">
              <span className="file-name">
                {uploadedFile ? uploadedFile.name : currentFile}
              </span>
              <span className="file-size">
                {uploadedFile
                  ? (uploadedFile.size / 1024 / 1024).toFixed(2) + " MB"
                  : "Uploaded"}
              </span>
            </div>
          </div>
          <div className="file-actions">
            <CheckCircle className="success-icon" />
            <button type="button" onClick={removeFile} className="remove-btn">
              <X className="icon" />
            </button>
          </div>
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};

export default FileUpload;
