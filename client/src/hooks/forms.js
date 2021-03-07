import { useState } from "react";

export const useForm = (defaultValues = {}, callback) => {
  const [inputs, setInputs] = useState(defaultValues);

  const handleSubmit = (event) => {
    if (event) {
      event.preventDefault();
    }
    callback();
  };

  const handleChange = (event) => {
    event.persist();

    if (event.target.name.includes(".")) {
      const names = event.target.name.split(".");
      const temp = { ...inputs };

      if (names.length === 2) {
        temp[names[0]][names[1]] = event.target.value;
      } else if (names.length === 3) {
        temp[names[0]][names[1]][names[2]] = event.target.value;
      } else if (names.length === 4) {
        temp[names[0]][names[1]][names[2]][names[3]] = event.target.value;
      } else if (names.length === 5) {
        temp[names[0]][names[1]][names[2]][names[3]][names[4]] = event.target.value;
      } else if (names.length === 6) {
        temp[names[0]][names[1]][names[2]][names[3]][names[4]][names[5]] = event.target.value;
      }

      setInputs(temp);
    } else {
      setInputs(({ ...inputs, [event.target.name]: event.target.value }));
    }
  };

  const handleNestedChange = (event, name) => {
    event.persist();

    // setInputs(({ ...inputs, [event.target.name]: event.target.value }));
    setInputs((
      {
        ...inputs,
        [name]: {
          ...inputs[name],
          [event.target.name]: event.target.value
        }
      }
    ));
  };

  const handleCheckboxChange = (event, inverted) => {
    event.persist();

    const val = inverted ? !event.target.checked : event.target.checked;

    if (event.target.name.includes(".")) {
      const names = event.target.name.split(".");
      const temp = { ...inputs };

      if (names.length === 2) {
        temp[names[0]][names[1]] = val;
      } else if (names.length === 3) {
        temp[names[0]][names[1]][names[2]] = val;
      } else if (names.length === 4) {
        temp[names[0]][names[1]][names[2]][names[3]] = val;
      } else if (names.length === 5) {
        temp[names[0]][names[1]][names[2]][names[3]][names[4]] = val;
      } else if (names.length === 6) {
        temp[names[0]][names[1]][names[2]][names[3]][names[4]][names[5]] = val;
      }

      setInputs(temp);
    } else {
      setInputs(({ ...inputs, [event.target.name]: val }));
    }
  };

  const handleNestedCheckboxChange = (event, name) => {
    event.persist();

    setInputs((
      {
        ...inputs,
        [name]: {
          ...inputs[name],
          [event.target.name]: event.target.checked
        }
      }
    ));
  };

  const handleChangeWithoutEvent = (inputName, inputValue) => {
    if (inputName.includes(".")) {
      const names = inputName.split(".");
      const temp = { ...inputs };
      if (names.length === 2) {
        temp[names[0]][names[1]] = inputValue;
      } else if (names.length === 3) {
        temp[names[0]][names[1]][names[2]] = inputValue;
      } else if (names.length === 4) {
        temp[names[0]][names[1]][names[2]][names[3]] = inputValue;
      } else if (names.length === 5) {
        temp[names[0]][names[1]][names[2]][names[3]][names[4]] = inputValue;
      } else if (names.length === 6) {
        temp[names[0]][names[1]][names[2]][names[3]][names[4]][names[5]] = inputValue;
      }

      setInputs(temp);
    } else {
      setInputs(({ ...inputs, [inputName]: inputValue }));
    }
  };

  return {
    handleSubmit,
    handleChange,
    handleCheckboxChange,
    handleNestedChange,
    handleNestedCheckboxChange,
    handleChangeWithoutEvent,
    inputs,
    setInputs
  };
};

export default useForm;
