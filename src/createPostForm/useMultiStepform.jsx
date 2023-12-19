import React, { useState } from 'react';

export default function useMultiStepform(steps) {
  //steps argument is an array of react elements;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  function next(e) {
    e.preventDefault();
    setCurrentStepIndex(i => {
      if (i >= steps.length - 1) return i;
      return i + 1
    })
  }

  function back(e) {
    e.preventDefault();
    setCurrentStepIndex(i => {
      if (i <= 0) return i;
      return i - 1
    })
  }

  function goTo(index) {
    setCurrentStep(index)
  }

  return {
    currentStepIndex,
    step: steps[currentStepIndex],
    goTo,
    back,
    next,
    steps,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
  }
}
// export function StepForm ()  {
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState({
//     from: 'Citizen of the Globe',
//     to: 'Citizens of the Globe',
//     content: '',
//     signature: '',
//     city: '',
//     state: '',
//     Location: ''
//   });

//   const nextStep = () => {
//     setStep(step + 1);
//   };

//   const handleChange = (input) => (e) => {
//     setFormData({ ...formData, [input]: e.target.value });
//   };

//   const StepDisplay = () => {
//     switch (step) {
//       case 1:
//         return <FromField value={formData.from} onChange={handleChange('from')} />;
//       case 2:
//         return <ToField value={formData.to} onChange={handleChange('to')} />;
//       case 3:
//         return <ContentField value={formData.content} onChange={handleChange('content')} />;
//       case 4:
//         return <SignatureField value={formData.signature} onChange={handleChange('signature')} />;
//       case 5:
//         return <LocationFields city={formData.city} state={formData.state} Location={formData.Location} onChange={handleChange} />;
//       case 6:
//         return <Preview formData={formData} />;
//       default:
//         return <div>Unknown step</div>;
//     }
//   };

//   return (
//     <div>
//       <StepDisplay />
//       {step < 6 && <button onClick={nextStep}>Next</button>}
//     </div>
//   );
// };

// const FromField = ({ value, onChange }) => (
//   <div>
//     <label>From:</label>
//     <input type="text" value={value} onChange={onChange} />
//   </div>
// );

// const ToField = ({ value, onChange }) => (
//   <div>
//     <label>To:</label>
//     <input type="text" value={value} onChange={onChange} />
//   </div>
// );

// const ContentField = ({ value, onChange }) => (
//   <div>
//     <label>Content:</label>
//     <textarea value={value} onChange={onChange} />
//   </div>
// );

// const SignatureField = ({ value, onChange }) => (
//   <div>
//     <label>Signature:</label>
//     <input type="text" value={value} onChange={onChange} />
//   </div>
// );

// const LocationFields = ({ city, state, Location, onChange }) => (
//   <div>
//     <label>City:</label>
//     <input type="text" value={city} onChange={onChange('city')} />
//     <label>State:</label>
//     <input type="text" value={state} onChange={onChange('state')} />
//     <label>Location:</label>
//     <input type="text" value={Location} onChange={onChange('Location')} />
//   </div>
// );

// const Preview = ({ formData }) => (
//   <div>
//     <h2>Preview</h2>
//     <p><strong>From:</strong> {formData.from}</p>
//     <p><strong>To:</strong> {formData.to}</p>
//     <p><strong>Content:</strong> {formData.content}</p>
//     <p><strong>Signature:</strong> {formData.signature}</p>
//     <p><strong>Location:</strong> {formData.city}, {formData.state}, {formData.Location}</p>
//   </div>
// );

