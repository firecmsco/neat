import * as React from "react";

export interface TextareaAutosizeProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function TextareaAutosize(props: TextareaAutosizeProps) {
  return <textarea {...props} />;
}

