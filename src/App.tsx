import React, { useState, ChangeEvent } from "react";
import Swal from "sweetalert2";

interface Label {
  Name: string;
  Confidence: number;
}

interface Text {
  DetectedText: string;
  Confidence: number;
  Type: string;
}

const Loader = Swal.mixin({
  showConfirmButton: false,
  allowOutsideClick: false,
  allowEscapeKey: false,
  allowEnterKey: false,
  didOpen: () => {
    Swal.showLoading();
  },
});

const App: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [texts, setTexts] = useState<Text[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
      setImageUrl("");
      setLabels([]);
      setTexts([]);
    }
  };

  const handleSetImageUrl = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setImageUrl(e.target.value);
    setLabels([]);
    setTexts([]);
  };

  const uploadImage = async () => {
    try {
      if (!image) return;

      const formData = new FormData();
      formData.append("image", image);

      Loader.fire({
        title: "Uploading Image",
      });
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.dir({ data }, { depth: null });
        setImageUrl(data.imageUrl);
      } else {
        console.error("Error uploading image");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      Loader.close();
    }
  };

  const analyzeImage = async () => {
    try {
      if (!imageUrl) return;

      Loader.fire({
        title: "Analyzing Image",
      });
      const response = await fetch(
        `http://localhost:3000/analyze?imageUrl=${encodeURIComponent(
          imageUrl
        )}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.dir({ data }, { depth: null });
        setLabels(data.labels || []);
        setTexts((data.texts || []).filter((t: Text) => t.Type === "WORD"));
      } else {
        console.error("Error analyzing image");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      Loader.close();
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="lg:w-1/3 h-screen w-full mb-4 lg:mb-0 pr-0 lg:pr-4 bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4">1. Upload Image</h1>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mb-4"
        />
        <button
          onClick={uploadImage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload Image
        </button>
      </div>
      <div className="lg:w-1/3 h-screen w-full mb-4 lg:mb-0 pr-0 lg:pr-4 bg-sky-100 p-4">
        <h1 className="text-3xl font-bold mb-4">2. Preview & Analyze</h1>
        <label className="text-lg">
          Upload or Paste Image URL from S3 Bucket
        </label>
        <textarea
          placeholder="Image URL in the bucket"
          value={imageUrl}
          cols={30}
          rows={3}
          onChange={handleSetImageUrl}
          className="mb-4 w-full"
        />
        <button
          disabled={!imageUrl}
          onClick={analyzeImage}
          className={`bg-sky-500 text-white px-4 py-2 mb-4 rounded hover:bg-green-700 w-full ${
            imageUrl ? "" : "hidden"
          }`}
        >
          Analyze Image
        </button>
        {imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt="Uploaded"
              className="mb-2 max-w-full h-auto"
            />
          </div>
        )}
      </div>
      <div className="lg:w-1/3  h-screen w-full overflow-y-auto bg-emerald-100 p-4 border border-gray-300 p-4">
        <h1 className="text-3xl font-bold mb-4">3. Analyze Results</h1>
        {labels.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold">Detected Labels:</h2>
            <ul className="list-disc pl-5 mt-2">
              {labels.map((label, index) => (
                <li key={index} className="text-lg">
                  {label.Name}: {label.Confidence.toFixed(2)}%
                </li>
              ))}
            </ul>
          </div>
        )}
        {texts.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl font-semibold">Detected Texts:</h2>
            <ul className="list-disc pl-5 mt-2">
              {texts.map((text, index) => (
                <li key={index} className="text-lg">
                  {text.DetectedText}: {text.Confidence.toFixed(2)}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
