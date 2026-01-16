import { FormWrapper } from "./FormWrapper";
import sortedCountryNames from "../shared/sorted_country_names.json";

export default function FromForm({
  senderCountry,
  senderState,
  senderCity,
  updateFields,
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

  const handleCountryChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === '--Country Not Listed--') {
      updateFields({ senderCountry: '' });
    } else {
      updateFields({ senderCountry: selectedValue });
    }
  };

  const selectedCountry = senderCountry || '--Select a country--';

  return (
    <FormWrapper title="Where are you from?">

      <div>
        <label>Your Country</label>
        <select
          required
          id="sender-country"
          className="form-input"
          onChange={handleCountryChange}
          onKeyDown={handleKeyDown}
          value={selectedCountry}
        >
          <option value="--Select a country--" disabled>--Select a country--</option>
          <option value="--Prefer not to say--">--Prefer not to say--</option>
          {sortedCountryNames.map((countryItem, index) => (
            <option key={index} value={countryItem.commonName}>
              {countryItem.commonName}{' '}
              {countryItem.commonName !== countryItem.nativeName
                ? `(${countryItem.nativeName})`
                : null}
            </option>
          ))}
          <option value="--Country Not Listed--">--Country Not Listed--</option>
        </select>
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