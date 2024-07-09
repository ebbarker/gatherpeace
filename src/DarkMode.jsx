import { React, useEffect, useContext } from "react";
import Sun from "./sun.svg?react";
import Moon  from "./moon.svg?react";
import "./DarkMode.css";
import { UserContext } from "./layout/App";

const DarkMode = () => {
    const { session } = useContext(UserContext);

    const setDarkMode = () => {
        document.querySelector("body").setAttribute('data-theme', 'dark');
    }

    const setLightMode = () => {
        document.querySelector("body").setAttribute('data-theme', 'light');
    }

    const changeTheme = e => {
        if (e.target.checked) setDarkMode();
        else setLightMode();
    }

    function setDefaultMode () {
    //   if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    //     setDarkMode();
    //     let checkBox = document.getElementById('darkmode-toggle');
    //     checkBox.checked = true;
    //   }
    setLightMode();
    // checkBox.checked = false;
    };

    useEffect (() => {
        setDefaultMode();

    }, [session]);


    return (
        <>

            <div className='dark_mode'>
                <input
                    className='dark_mode_input'
                    type='checkbox'
                    id='darkmode-toggle'
                    onChange={changeTheme}
                />
                <label className='dark_mode_label' htmlFor='darkmode-toggle' >
                    <Sun />
                    <Moon />
                </label>
            </div>
        </>

    );
};

export default DarkMode;
