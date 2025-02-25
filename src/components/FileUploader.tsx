import React, { useState, Dispatch, SetStateAction, useRef } from "react";
import axios from "axios";

interface FileUploaderProps {
  setLogs: Dispatch<SetStateAction<string[]>>;
  setJsonResult: (data: any) => void;
  setElapsedTime: (time: number) => void;
}

export default function FileUploader({ setLogs, setJsonResult, setElapsedTime }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const updateElapsedTime = () => {
    const currentTime = Date.now();
    const elapsed = (currentTime - startTimeRef.current) / 1000;
    setElapsedTime(elapsed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLogs((prev: string[]) => [...prev, `File selezionato: ${selectedFile.name}`]);
      setJsonResult(null);
      setElapsedTime(0);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setLogs((prev: string[]) => [...prev, "Nessun file selezionato"]);
      return;
    }
    setLoading(true);
    setElapsedTime(0);
    setLogs((prev: string[]) => [...prev, "Caricamento e analisi in corso..."]);

    startTimeRef.current = Date.now();
    // Avvia il timer che aggiorna ogni 100ms
    timerRef.current = setInterval(updateElapsedTime, 100);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/full_analyze`,
        formData
      );
      const { data, logs } = response.data;
      const timeElapsed = (Date.now() - startTimeRef.current) / 1000;

      if (Array.isArray(logs)) {
        setLogs((prev: string[]) => [...prev, ...logs]);
      }
      setLogs((prev: string[]) => [
        ...prev, 
        `Analisi completata con successo in ${timeElapsed.toFixed(2)} secondi.`
      ]);

      setJsonResult(data);
    } catch (error: any) {
      const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
      setLogs((prev: string[]) => [...prev, `Errore: ${error.message}`]);
    } finally {
      // Ferma il timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setLogs([]);
    setJsonResult(null);
    setElapsedTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Cleanup quando il componente viene smontato
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="relative group">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange}
            className="w-full file:mr-4 file:py-3 file:px-6 
              file:rounded-lg file:border-0
              file:text-[#101010] file:bg-[#3dcab1]/10
              hover:file:bg-[#3dcab1]/20
              file:cursor-pointer file:font-medium
              file:transition-all file:duration-200
              text-[#101010] rounded-lg
              border-2 border-dashed border-gray-300
              hover:border-[#3dcab1] transition-all duration-200
              focus:outline-none focus:border-[#3dcab1]" 
          />
        </div>
        <div className="flex justify-center gap-4">
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className="w-48 px-6 py-3 bg-[#3dcab1] text-[#fefefe] rounded-lg
              disabled:opacity-50 hover:bg-[#3dcab1]/90 
              transition-all duration-200 font-medium shadow-sm
              hover:shadow-md disabled:hover:shadow-none"
          >
            {loading ? "In corso..." : "Carica & Analizza"}
          </button>
          <button 
            onClick={handleRemove}
            className="w-48 px-6 py-3 bg-[#101010] text-[#fefefe] rounded-lg
              hover:bg-[#101010]/90 transition-all duration-200
              font-medium shadow-sm hover:shadow-md"
          >
            Rimuovi
          </button>
        </div>
      </div>
    </div>
  );
}