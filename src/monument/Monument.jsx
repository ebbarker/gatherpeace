import './Monument.css';
import peaceTranslations from './PeaceTranslations.js';
import { useEffect, useState } from 'react';
import QuoteSlider from './QuoteSlider';
import { supaClient } from "../layout/supa-client";

export function Monument() {

  const [peace, setPeace] = useState('Peace');
  const [language, setLanguage] = useState('English');
  const [phoenetic, setPhoenetic] = useState('English');
  const [numberNames, setNumberNames] = useState('1');
  const [numberCountries, setNumberCountries] = useState('1');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supaClient.rpc('get_signatures_and_countries');

      if (error) {
        console.error('Error fetching signatures and countries:', error.message);
        return;
      } else {

        const { signature_count, unique_countries } = data[0];
        setNumberNames(signature_count);
        setNumberCountries(unique_countries);
      }

      // The function returns an array with one row by default:
      // [{ signature_count: number, unique_countries: number }]



    }
    fetchData();
  }, []);

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

      <div className="art-container">
        <div className="image-wrapper">
          <img src="../peace..png" alt="Peace Art" className="main-image"/>
          <a href="/@gatherpeace" className="bottom-left-link">Art by: Ethan Barker</a>
          <a href="/submit-art" className="bottom-right-link">Your Art Here</a>
        </div>
      </div>

      {/* <div className="monument-container">

        <div className="monument-details-container">
          <div className="mlk-quote-container">
            <div className="mlk-quote">“Those who love peace must learn to organize as effectively as those who love war.”</div>
            <div className="mlk-name">-Martin Luther King Jr.</div>
          </div>
          <div className="monument-statistics container">
            In the past, it was necessary for heads of state to negotiate peace.
            But now, with the availability of the internet,
            it is possible for the common man to extend their hand across the oceans,
            across borders, and make peace, human to human, with another.
            <br />
            <br />

            The goal of Gather Peace is to create the First Digital Monument to Peace,
            a place where all citizens of the globe can gather in one place and speak to eachother.
            And with the whole world gathered in one spot to have a grand conversation, what would be the first thing that should be said?
            <br />
            <br />
            "Peace."
            <div className="peace-translation">
              <em>"{peace}"</em> <span>({language})</span>
            </div>
            <br />
            Peace is not something that we can pay someone else to do on our behalf, or that can be
            negotiated by an elected official.
            All people, regardless of race, nationality, gender, political belief, or religion, are invited
            not only to recieve the peaceful intentions of others, but to offer their own.

                        <br />
            <br />
            {numberNames} people from {numberCountries} countries have gathered here.
            <br />
            <br />

            Join us. Add a message, a prayer, or just your name to Gather Peace.
            <br />
            <br />



          </div>
        </div>
      </div> */}
      {/* <QuoteSlider /> */}
      <div class="monument-container">
  <div class="mlk-quote-container">
    <div class="mlk-quote">“Those who love peace must learn to organize as effectively as those who love war.”</div>
    <div class="mlk-name">- Martin Luther King Jr.</div>
  </div>

  <div class="monument-details-container">
    <div class="monument-statistics container">
      <p class="monument-header">Gather Peace is the First Digital Monument to Peace</p>

      <p class="monument-text">
        Peace is no longer just a matter for our leaders to decide.
        Thanks to the Internet, any one of us can reach across oceans and borders and make peace, one to one, with another.

        <br />
        <br />
        And if the whole world gathered in one spot to have a grand conversation, what should we say first?
      </p>
      <div class="highlight-box">
        <p><strong>"Peace."</strong></p>
        <p class="peace-translation"><em>"{peace}"</em> <span>({language})</span></p>
      </div>

We can’t get peace by paying someone or voting for someone else to do peace for us.
Whoever you are--your race, nationality, gender, politics or religion—I invite you to receive the peaceful intentions of others, and more importantly, to offer your own.

      <p className="highlight-box bigger-box">
        {numberNames} people from {numberCountries} countries have gathered here. Join Us.
        <br />
        <br />
         Add a message, a prayer, a hope, or just your name to Gather Peace.
      </p>

    </div>
  </div>
</div>



    </>

  );
}

