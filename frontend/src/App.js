// src/App.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const App = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/hello/") // Make sure this matches your Django server URL
      .then(response => setMessage(response.data.message))
      .catch(error => console.error(error));
  }, []);

  return <h1>{message}</h1>;
};

export default App;
