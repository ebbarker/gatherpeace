import { React, useState } from "react";
import './SearchBar.css';
import { FaSearch } from "react-icons/fa";

export function SearchBar ({searchFilter, searchKeyword, setSearchFilter, setSearchKeyword, handleSearch, getLetters}) {
  
return (
  <>
  <form className="search-letters" onSubmit={handleSearch}>
    {/* <label className="search-label" htmlFor="searchFilter">Find letters that are </label>
    <select
      id="searchFilter"
      value={searchFilter}
      onChange={(e) => setSearchFilter(e.target.value)}
      className="search-dropdown"
    >
      <option value="both"> TO or FROM</option>
      <option value="from">FROM</option>
      <option value="to">TO</option>
    </select> */}
    <input
      type="text"
      value={searchKeyword}
      onChange={(e) => setSearchKeyword(e.target.value)}
      placeholder="Enter search keyword"
      className="search-input"
    />
    <button type="submit" className="search-button"><FaSearch /></button>
  </form>
</>
)

}

