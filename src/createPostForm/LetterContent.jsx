import { FormWrapper } from "./FormWrapper";

export default function LetterContent({
  letterContent,
  updateFields,
  signOff,
  handleKeyDown,
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
      <div>
        <label>Sign-off</label>
        <input
        required
        type="text"
        onChange={e => updateFields({ signOff: e.target.value })}
        value={signOff}
        className="form-input"
        onKeyDown={handleKeyDown}
        ></input>
      </div>
    </FormWrapper>
  )
}