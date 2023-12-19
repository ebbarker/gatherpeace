import { FormWrapper } from "./FormWrapper";

export default function ToForm({
  letterContent,
  updateFields,
  to,
  senderCountry,
  senderState,
  senderCity,
  from,
  recipientCountry,
  recipientState,
  recipientCity,
}) {


  return (
    <FormWrapper title="Letter">
      <div>
        <label>Your Message Here</label>
        <textarea
        required
        autoFocus
        type="text-area"
        onChange={e => updateFields({ letterContent: e.target.value })}
        value={letterContent}
        className="form-input form-content-input"
        ></textarea>
      </div>
    </FormWrapper>
  )
}