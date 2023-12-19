import { ReactNode } from "react";

export function FormWrapper ({ title, children }) {
  return (
  <>
    <h2 className="form-title">{title}</h2>
    <div className="form-children-wrapper">{children}</div>
  </>
  )
}