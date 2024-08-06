import React, { useState, useEffect } from 'react';

// Assuming you have the sorted country names JSON as an importable file
import sortedCountryNames from './sorted_country_names.json';

export function CountryDropdown ({selectedCountry, setSelectedCountry, city, setCity, state, setState, country, setCountry}) {

  useEffect(() => {
    if (!sortedCountryNames.some(c => c.commonName === country)) {
      setSelectedCountry('--Country Not Listed--');
    } else {
      setSelectedCountry(country);
    }
  }, [country]);

  const handleCountryChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedCountry(selectedValue);
    if (selectedValue === '--Country Not Listed--') {
      setCountry('');
    } else {
      setCountry(selectedValue);
    }
  };

  return (
    <div>
      <div className="input-container">
        <label htmlFor="country-dropdown">Select a country:</label>
        <select
          id="country-dropdown"
          value={selectedCountry}
          onChange={handleCountryChange}
        >
          <option value="">--Select a country--</option>
          {sortedCountryNames.map((country, index) => (
            <option key={index} value={country.commonName}>
              {country.commonName} {country.commonName !== country.nativeName ? `(${country.nativeName})` : null}
            </option>
          ))}
          <option value="--Country Not Listed--">--Country Not Listed--</option>
        </select>
      </div>
      {selectedCountry === "--Country Not Listed--" &&
        <div className="input-container">
          <label htmlFor="country-write-in">Write In Country:</label>
          <input
            id="country-write-in"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      }
      <div className="input-container">
        <label htmlFor="state-write-in">State/Province</label>
        <input
          id="state-write-in"
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
      </div>
      <div className="input-container">
        <label htmlFor="city-write-in">City</label>
        <input
          id="city-write-in"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
    </div>
  );
};
