import { FormWrapper } from "./FormWrapper";

export default function YourNameForm({
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
  signOff,
  senderName,
  handleKeyDown,
}) {


  return (
    <FormWrapper title="Signature">
      <div>
        <label>Sign-off</label>
        <input
        required
        autoFocus
        type="text"
        onChange={e => updateFields({ signOff: e.target.value })}
        value={signOff}
        className="form-input"
        onKeyDown={handleKeyDown}
        ></input>
      </div>
      <div>
        <label>Your Name</label>
        <input
        required
        autoFocus
        type="text"
        onChange={e => updateFields({ senderName: e.target.value })}
        value={senderName}
        className="form-input"
        onKeyDown={handleKeyDown}
        ></input>
      </div>

    </FormWrapper>
  )
}