import React, { useEffect } from 'react';
import sortedCountryNames from './sorted_country_names.json';

export function CountryDropdown({
  selectedCountry,
  setSelectedCountry,
  city,
  setCity,
  state,
  setState,
  country,
  setCountry,
  setHasUnsavedChanges,
  selectClassName,
}) {
  useEffect(() => {


    if (country === '' || country === undefined || country === null || country === '--Select a country--') {

      setSelectedCountry('--Select a country--');
    }  else if  (country === '--Prefer not to say--') {
      setSelectedCountry('--Prefer not to say--');
    }  else if (!sortedCountryNames.some((c) => c.commonName === country)) {

      setSelectedCountry('--Country Not Listed--');
    } else {
      setSelectedCountry(country);
    }
  }, [country]);

  const handleCountryChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedCountry(selectedValue);

    if (selectedValue === '') {
      setCountry('');
    } else if (selectedValue === '--Country Not Listed--') {
      setCountry('');
    } else {
      setCountry(selectedValue);
    }
    setHasUnsavedChanges(true);
  };

  return (
    <div>
      <div className="input-container">
        <label htmlFor="country-dropdown">Select a country:</label>
        <select
          id="country-dropdown"
          value={selectedCountry}
          onChange={handleCountryChange}
          className={selectClassName}
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
      {selectedCountry === '--Country Not Listed--' && (
        <div className="input-container">
          <label htmlFor="country-write-in">Write In Country:</label>
          <input
            id="country-write-in"
            type="text"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setHasUnsavedChanges(true);
            }}
          />
        </div>
      )}
      <div className="input-container">
        <label htmlFor="state-write-in">State/Province</label>
        <input
          id="state-write-in"
          type="text"
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setHasUnsavedChanges(true);
          }}
        />
      </div>
      <div className="input-container">
        <label htmlFor="city-write-in">City</label>
        <input
          id="city-write-in"
          type="text"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setHasUnsavedChanges(true);
          }}
        />
      </div>
    </div>
  );
}
