import React, { useState, useEffect } from 'react';
import { CountryDropdown } from "../../shared/CountryDropdown";

function WelcomeCountryDropdown({ ...props }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1">
          Country (Required)
        </label>
        <select
          id="country-dropdown"
          value={props.selectedCountry}
          onChange={props.handleCountryChange}
          className="text-2xl font-display rounded border-2 text-color-green-400 border-green-400 p-2 m-4 text-center text-green-400 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)]"
        >
          <option value="--Select a country--" disabled>--Select a country--</option>
          <option value="--Prefer not to say--">--Prefer not to say--</option>
          {props.countries.map((countryItem, index) => (
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
      {props.selectedCountry === '--Country Not Listed--' && (
        <div>
          <label className="block text-sm mb-1">
            Write In Country (Required)
          </label>
          <input
            id="country-write-in"
            type="text"
            value={props.country}
            onChange={(e) => {
              props.setCountry(e.target.value);
              props.setHasUnsavedChanges(true);
            }}
            className="text-2xl font-display rounded border-2 text-color-green-400 border-green-400 p-2 m-4 text-center text-green-400 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)]"
          />
        </div>
      )}
      <div>
        <label className="block text-sm mb-1">
          State/Province (Suggested)
        </label>
        <input
          id="state-write-in"
          type="text"
          value={props.state}
          onChange={(e) => {
            props.setState(e.target.value);
            props.setHasUnsavedChanges(true);
          }}
          className="text-2xl font-display rounded border-2 text-color-green-400 border-green-400 p-2 m-4 text-center text-green-400 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)]"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">
          City (Suggested)
        </label>
        <input
          id="city-write-in"
          type="text"
          value={props.city}
          onChange={(e) => {
            props.setCity(e.target.value);
            props.setHasUnsavedChanges(true);
          }}
          className="text-2xl font-display rounded border-2 text-color-green-400 border-green-400 p-2 m-4 text-center text-green-400 drop-shadow-[0_0_9px_rgba(34,197,94,0.9)]"
        />
      </div>
    </div>
  );
}

export default function LocationForm({ formData = {}, updateFields, onValidationChange }) {
  const [selectedCountry, setSelectedCountry] = useState('--Select a country--');
  const [errors, setErrors] = useState({
    country: "",
    city: "",
    stateProvince: ""
  });

  const validateField = (field, value, isRequired = false) => {
    if (isRequired && !value) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    if (value && value.length < 2) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least 2 characters long`;
    }
    return "";
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    const error = validateField(field, value, field === 'country');
    setErrors(prev => ({ ...prev, [field]: error }));
    updateFields({ [field]: value });
  };

  useEffect(() => {
    const isValid = !errors.country && formData.country;
    onValidationChange(isValid);
  }, [errors, formData.country, onValidationChange]);

  return (
    <div className="step-form">
      <h3 className="text-xl mb-4">Where Are You From?</h3>
      <div className="space-y-4">
        <WelcomeCountryDropdown
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          country={formData.country}
          setCountry={(value) => {
            updateFields({ country: value });
            setErrors(prev => ({ ...prev, country: validateField("country", value, true) }));
          }}
          state={formData.stateProvince}
          setState={(value) => {
            updateFields({ stateProvince: value });
            setErrors(prev => ({ ...prev, stateProvince: validateField("stateProvince", value) }));
          }}
          city={formData.city}
          setCity={(value) => {
            updateFields({ city: value });
            setErrors(prev => ({ ...prev, city: validateField("city", value) }));
          }}
          setHasUnsavedChanges={() => {}}
          countries={require('../../shared/sorted_country_names.json')}
          handleCountryChange={(e) => {
            const selectedValue = e.target.value;
            setSelectedCountry(selectedValue);
            if (selectedValue === '') {
              updateFields({ country: '' });
            } else if (selectedValue === '--Country Not Listed--') {
              updateFields({ country: '' });
            } else {
              updateFields({ country: selectedValue });
            }
            setErrors(prev => ({ ...prev, country: validateField("country", selectedValue, true) }));
          }}
        />
        {errors.country && (
          <p className="text-red-400 validation-feedback text-center">
            {errors.country}
          </p>
        )}
        {errors.stateProvince && (
          <p className="text-red-400 validation-feedback text-center">
            {errors.stateProvince}
          </p>
        )}
        {errors.city && (
          <p className="text-red-400 validation-feedback text-center">
            {errors.city}
          </p>
        )}
      </div>
      <p className="text-center text-sm mt-4">
        This helps us connect you with others in your region.
      </p>
    </div>
  );
}