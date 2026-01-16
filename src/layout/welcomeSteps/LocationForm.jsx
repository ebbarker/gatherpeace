// LocationForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import countryList from "../../shared/sorted_country_names.json";
import "./LocationForm.css";

/**
 * Small helper: normalize "special" sentinel values
 */
const SENTINELS = {
  SELECT: "--Select a country--",
  PREFER_NOT: "--Prefer not to say--",
  NOT_LISTED: "--Country Not Listed--",
};

function countryDisplayName(item) {
  // Show "Common (Native)" if different, else just Common
  return item.commonName !== item.nativeName
    ? `${item.commonName} (${item.nativeName})`
    : item.commonName;
}

/**
 * Country dropdown + optional write-in
 */
function WelcomeCountryDropdown({
  selectedCountry,
  setSelectedCountry,
  countryWriteIn,
  setCountryWriteIn,
  setHasUnsavedChanges = () => {},
  countries,
  onCountryCommit, // parent decides how to store the final country value
}) {
  const handleSelect = (e) => {
    const next = e.target.value;
    setSelectedCountry(next);
    setHasUnsavedChanges(true);

    if (next === SENTINELS.NOT_LISTED) {
      // parent will wait for write-in before committing
      onCountryCommit(""); // empty for now -> triggers required message until user types
    } else if (next === SENTINELS.SELECT) {
      onCountryCommit("");
    } else {
      onCountryCommit(next);
    }
  };

  return (
    <div className="location-form-fields">
      <div className="location-field-wrapper">
        <label htmlFor="country-dropdown" className="location-field-label">
          Country (Required)
        </label>
        <select
          id="country-dropdown"
          value={selectedCountry}
          onChange={handleSelect}
          className="location-field-select"
        >
          <option value={SENTINELS.SELECT} disabled>
            {SENTINELS.SELECT}
          </option>
          <option value={SENTINELS.PREFER_NOT}>{SENTINELS.PREFER_NOT}</option>
          {countries.map((c, i) => (
            <option key={i} value={c.commonName}>
              {countryDisplayName(c)}
            </option>
          ))}
          <option value={SENTINELS.NOT_LISTED}>{SENTINELS.NOT_LISTED}</option>
        </select>
      </div>

      {selectedCountry === SENTINELS.NOT_LISTED && (
        <div className="location-field-wrapper">
          <label htmlFor="country-write-in" className="location-field-label">
            Write In Country (Required)
          </label>
          <input
            id="country-write-in"
            type="text"
            value={countryWriteIn}
            onChange={(e) => {
              setCountryWriteIn(e.target.value);
              setHasUnsavedChanges(true);
              onCountryCommit(e.target.value); // persist as user types
            }}
            className="location-field-input"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Parent form
 */
export default function LocationForm({
  formData = {},
  updateFields = () => {},
  onValidationChange = () => {},
  showErrors = false,
}) {
  // Selected option shown in the <select>. May be a sentinel or a real country.
  const [selectedCountry, setSelectedCountry] = useState(SENTINELS.SELECT);

  // Write-in text for the "not listed" path
  const [countryWriteIn, setCountryWriteIn] = useState("");

  const [errors, setErrors] = useState({
    country: "",
    stateProvince: "",
    city: "",
  });

  // Keep a fast lookup set of valid country commonNames
  const validCountryNames = useMemo(
    () => new Set(countryList.map((c) => c.commonName)),
    []
  );

  // Basic validators
  const atLeast2 = (label, v) =>
    v && v.trim().length > 0 && v.trim().length < 2
      ? `${label} must be at least 2 characters long`
      : "";

  const validateCountry = (selected, storedCountry, showErrors = false) => {
    if (!showErrors) return "";

    if (selected === SENTINELS.SELECT) {
      return "Country is required";
    }
    if (selected === SENTINELS.NOT_LISTED) {
      if (!storedCountry || storedCountry.trim().length < 2) {
        return "Country is required and must be at least 2 characters long";
      }
      return "";
    }
    // SENTINELS.PREFER_NOT is acceptable; treat as valid selection
    // For real countries, verify it exists
    if (
      selected !== SENTINELS.PREFER_NOT &&
      !validCountryNames.has(selected)
    ) {
      return "Please select a valid country";
    }
    return "";
  };

  const handleTextChange =
    (field, label) =>
    (e) => {
      const value = e.target.value;
      updateFields({ [field]: value });
      setErrors((prev) => ({ ...prev, [field]: atLeast2(label, value) }));
    };


  // Keep selectedCountry in sync if formData.country is prefilled
  useEffect(() => {
    const c = formData.country || "";
    if (!c) {
      setSelectedCountry(SENTINELS.SELECT);
      setCountryWriteIn("");
      return;
    }

    // If it's one of the sentinels, show it as-is
    if (c === SENTINELS.PREFER_NOT) {
      setSelectedCountry(SENTINELS.PREFER_NOT);
      setCountryWriteIn("");
      return;
    }

    // If it's a known country, select it
    if (validCountryNames.has(c)) {
      setSelectedCountry(c);
      setCountryWriteIn("");
      return;
    }

    // Otherwise treat as write-in
    setSelectedCountry(SENTINELS.NOT_LISTED);
    setCountryWriteIn(c);
  }, [formData.country, validCountryNames]);

  // Validate country whenever selection or stored value changes
  useEffect(() => {
    const countryErr = validateCountry(selectedCountry, formData.country || "", showErrors);
    setErrors((prev) => ({ ...prev, country: countryErr }));
  }, [selectedCountry, formData.country, showErrors]);

  // Aggregate validity bubbles up to parent
  useEffect(() => {
    const isValid =
      !errors.country &&
      !errors.stateProvince &&
      !errors.city &&
      !!(formData.country || selectedCountry === SENTINELS.PREFER_NOT);

    onValidationChange(isValid);
  }, [
    errors.country,
    errors.stateProvince,
    errors.city,
    formData.country,
    selectedCountry,
    onValidationChange,
  ]);

  return (
    <div className="location-form-container">
      <h3 className="location-form-title">Where is home?</h3>

      <div className="location-form-fields">
        <WelcomeCountryDropdown
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          countryWriteIn={countryWriteIn}
          setCountryWriteIn={setCountryWriteIn}
          setHasUnsavedChanges={() => {}}
          countries={countryList}
          onCountryCommit={(value) => {
            // This is the single place we persist "country" back to the parent
            updateFields({ country: value });
          }}
        />

        {showErrors && errors.country && (
          <p className="location-error-message" role="alert">
            {errors.country}
          </p>
        )}

        <div className="location-field-wrapper">
          <label htmlFor="state-write-in" className="location-field-label">
            State/Province (Suggested)
          </label>
          <input
            id="state-write-in"
            type="text"
            value={formData.stateProvince || ""}
            onChange={handleTextChange("stateProvince", "State/Province")}
            className="location-field-input"
            aria-invalid={!!errors.stateProvince}
          />
          {errors.stateProvince && (
            <p className="location-error-message" role="alert">
              {errors.stateProvince}
            </p>
          )}
        </div>

        <div className="location-field-wrapper">
          <label htmlFor="city-write-in" className="location-field-label">
            City (Suggested)
          </label>
          <input
            id="city-write-in"
            type="text"
            value={formData.city || ""}
            onChange={handleTextChange("city", "City")}
            className="location-field-input"
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <p className="location-error-message" role="alert">
              {errors.city}
            </p>
          )}
        </div>
      </div>

      <p className="location-form-description">
        This helps us connect you with others in your region.
      </p>
    </div>
  );
}
