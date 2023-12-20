import { FormWrapper } from "./FormWrapper";

export default function FromForm({
  sender,
  senderCountry,
  senderState,
  senderCity,
  updateFields,
  senderName,
  handleKeyDown,
  next
}) {

  // const handleKeyDownForFrom = (e) => {

  //   if (e.key === "Enter") {

  //     console.log('entered');
  //     e.preventDefault();
  //     document.getElementById('recipient-Location').focus();
  //   }
  // };



  const nextPageOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById('next').click();
    }
  };

  return (
    <FormWrapper title="Sender Details">
      <div>
        <label>From</label>
        <input
        required
        autoFocus
        type="text"
        className="form-input"
        onChange={e => updateFields({ sender: e.target.value })}
        onKeyDown={handleKeyDown}
        value={sender}
        />
      </div>
      <div>
        <label>Your Country</label>
        <input
          required
          id="sender-country"
          type="text"
          className="form-input"
          onChange={e => updateFields({ senderCountry: e.target.value })}
          onKeyDown={handleKeyDown}
          value={senderCountry}
        />
      </div>

      <div>
        <label>State or Province</label>
        <input
          required
          id="sender-state"
          type="text"
          className="form-input"
          onChange={e => updateFields({ senderState: e.target.value })}
          onKeyDown={handleKeyDown}
          value={senderState}
        />
      </div>

      <div>
        <label>Your City</label>
        <input
          required
          id="sender-city"
          type="text"
          className="form-input"
          onChange={e => updateFields({ senderCity: e.target.value })}
          onKeyDown={handleKeyDown}
          value={senderCity}
        />
      </div>
      {/* <div>
        <label>Location</label>
        <input
        required
        id="recipient-Location"
        type="text"
        className="form-input"
        onChange={e => updateFields({ senderLocation: e.target.value })}
        onKeyDown={(e) => {nextPageOnEnter(e)}}
        value={senderLocation}/>
      </div> */}
    </FormWrapper>
  )
}