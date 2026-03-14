import { useState } from "react";

function App() {

  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const generateVoice = async (inputText) => {

    const response = await fetch("http://localhost:5000/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: inputText })
    });

    const data = await response.json();

    setReply(data.reply);
    setAudioUrl(data.audioFile);
  };

  const startListening = () => {

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {

      const speechText = event.results[0][0].transcript;

      setText(speechText);

      await generateVoice(speechText);
    };

    recognition.start();
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>

      <h1>LinguaLive AI Voice Tutor</h1>

      <input
        type="text"
        placeholder="Type or speak..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "300px", padding: "10px" }}
      />

      <br /><br />

      <button onClick={() => generateVoice(text)}>
        Generate Voice
      </button>

      <button onClick={startListening} style={{ marginLeft: "10px" }}>
        🎤 Speak
      </button>

      <br /><br />

      {reply && (
        <div style={{
          background: "#f4f4f4",
          padding: "15px",
          borderRadius: "10px",
          width: "400px"
        }}>
          <strong>AI Tutor:</strong>
          <p>{reply}</p>
        </div>
      )}

      <br />

      {audioUrl && (
        <audio controls autoPlay src={audioUrl}></audio>
      )}

    </div>
  );
}

export default App;
