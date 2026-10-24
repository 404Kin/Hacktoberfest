import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});

  const generateQuiz = async () => {
    if (!text) return;
    setLoading(true);
    setQuiz(null);
    setSelectedOptions({});

    try {
  
      const res = await fetch("http://localhost:5000/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setQuiz(data.quiz);
      }
    } catch (error) {
      alert("Error generating quiz.");
    }
    setLoading(false);
  };

  const handleOptionClick = (qIndex, oIndex) => {
    if (selectedOptions[qIndex] !== undefined) return;
    setSelectedOptions({ ...selectedOptions, [qIndex]: oIndex });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Grasp 
        </h1>
        <p className="text-center text-gray-400 mb-8">Paste your study notes and let AI generate a quiz for you.</p>

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 mb-8">
          <textarea
            className="w-full h-40 bg-gray-950 text-gray-200 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-800 mb-4"
            placeholder="Paste your lecture notes here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={generateQuiz}
            disabled={loading || !text}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? "Generating Questions..." : "Generate Quiz ✨"}
          </button>
        </div>

        {quiz && (
          <div className="space-y-6">
            {quiz.map((q, qIndex) => (
              <div key={qIndex} className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  {qIndex + 1}. {q.question}
                </h3>
                <div className="space-y-2">
                  {q.options.map((option, oIndex) => {
                    const isSelected = selectedOptions[qIndex] === oIndex;
                    const isCorrect = q.correctAnswerIndex === oIndex;
                    const hasAnswered = selectedOptions[qIndex] !== undefined;

                    let bgClass = "bg-gray-800 hover:bg-gray-700";
                    if (hasAnswered) {
                      if (isCorrect) bgClass = "bg-green-600 border-green-500";
                      else if (isSelected) bgClass = "bg-red-600 border-red-500";
                      else bgClass = "bg-gray-800 opacity-50";
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleOptionClick(qIndex, oIndex)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${bgClass} text-white border-gray-700`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}