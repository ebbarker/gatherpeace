import './Monument.css';
import peaceTranslations from './PeaceTranslations.js';
import { useEffect, useState } from 'react';
import QuoteSlider from './QuoteSlider';

export function Monument() {

  const [peace, setPeace] = useState('Peace');
  const [language, setLanguage] = useState('English');
  const [phoenetic, setPhoenetic] = useState('English');
  const [numberNames, setNumberNames] = useState('2');
  const [numberCountries, setNumberCountries] = useState('2');



  const getRandomTranslation = () => {
      const randomIndex = Math.floor(Math.random() * peaceTranslations.length);
      setPeace(peaceTranslations[randomIndex].peace);
      setLanguage(peaceTranslations[randomIndex].language);
      setPhoenetic(peaceTranslations[randomIndex].phoenetic);
  };

  const startRandomTranslations = () => {
      getRandomTranslation();
      setTimeout(()=> startRandomTranslations(), 2000);
  };


useEffect(() => {

  setTimeout(()=>startRandomTranslations(0), 2500);
// Add location.search to the dependency array to re-run the effect when the search parameters change
}, []);



  return (
    <>

      <div className="monument-container">
        <div className="mlk-quote-container">
          <div className="mlk-quote">“Those who love peace must learn to organize as effectively as those who love war.”</div>
          <div className="mlk-name">-Martin Luther King Jr.</div>
        </div>
        <div className="monument-peace-container">
          <h2 className="text-center monument-header">Peace.</h2>
          <div className="translation-container">
          {/* <div className="peace-translation peace">{peace}.</div> */}

            <div className="translation-details-container">
              <div className="peace-translation peace">"{peace}."</div>
              <div className="peace-translation language">{`(${language})`}</div>
            </div>
          </div>
        </div>
        <div className="monument-details-container">
          <div className="monument-statistics container">
            {numberNames} people from {numberCountries} countries have gathered here.
          </div>
          <button className="add-your-name action-button">Add Your Name</button>
        </div>
      </div>
      {/* <QuoteSlider /> */}



    </>

  );
}

