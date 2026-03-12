// Fix: Removed unused and deprecated 'Schema' import.
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Framework, TaskStatus, Roadmap } from "../types";
import { getAiConfig } from "./aiConfigService";
import { NIS2_TASKS, ISO27001_TASKS, BSI_TASKS, GDPR_TASKS, CIS_TASKS } from "../data/frameworkTasks";

// Helper to safely get AI instance
export const getGeminiInstance = () => {
    const config = getAiConfig();
    
    // Try multiple sources for the API key
    // 1. User configured key in local storage
    // 2. Environment variable injected by Vite (process.env.API_KEY)
    // 3. Vite specific env var (import.meta.env.VITE_API_KEY)
    let apiKey = config.geminiApiKey;
    
    if (!apiKey) {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            apiKey = process.env.API_KEY;
        } else if (import.meta.env && import.meta.env.VITE_API_KEY) {
            apiKey = import.meta.env.VITE_API_KEY;
        }
    }

    if (!apiKey) {
        console.warn("API_KEY is missing. Gemini features will fail gracefully.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

// --- OLLAMA HELPER FUNCTIONS ---

const callOllama = async (prompt: string, jsonMode: boolean = false): Promise<string> => {
  const config = getAiConfig();
  try {
    const response = await fetch(`${config.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollamaModel,
        prompt: prompt,
        stream: false,
        format: jsonMode ? 'json' : undefined,
        options: {
            temperature: 0.7
        }
      })
    });

    if (!response.ok) throw new Error("Ollama API Error");
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Ollama Error:", error);
    throw new Error("Verbindung zu Ollama fehlgeschlagen. Ist der lokale Server gestartet?");
  }
};

const callOllamaChat = async (history: { role: string; text: string }[], newMessage: string, systemInstruction?: string): Promise<string> => {
    const config = getAiConfig();
    try {
        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        history.forEach(h => messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text }));
        messages.push({ role: 'user', content: newMessage });

        const response = await fetch(`${config.ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollamaModel,
                messages: messages,
                stream: false
            })
        });

        if (!response.ok) throw new Error("Ollama Chat API Error");
        const data = await response.json();
        return data.message.content;
    } catch (error) {
        console.error("Ollama Chat Error:", error);
        throw new Error("Verbindung zu Ollama fehlgeschlagen.");
    }
};

// --- MAIN EXPORTED FUNCTIONS (ROUTING) ---

export const verifyDocumentWithAI = async (task: Task, base64Data: string, mimeType: string): Promise<{ verified: boolean; reason: string }> => {
  const config = getAiConfig();

  // OLLAMA IMPLEMENTATION
  if (config.provider === 'OLLAMA') {
      try {
         const cleanBase64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
         
         const prompt = `
            Du bist ein IT-Auditor. Prüfe das Bild.
            Aufgabe: "${task.title}" - "${task.description}".
            Ist das Bild ein Beweis für diese Aufgabe?
            Antworte NUR im JSON Format: { "verified": boolean, "reason": "string" }
         `;

         const response = await fetch(`${config.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollamaModel,
                prompt: prompt,
                images: [cleanBase64],
                stream: false,
                format: 'json'
            })
         });

         if(!response.ok) throw new Error("Ollama Error");
         const data = await response.json();
         return JSON.parse(data.response);

      } catch (error) {
          console.error("Ollama Vision Error", error);
          return { verified: false, reason: "Lokale KI konnte das Bild nicht verarbeiten (Multimodal-Modell erforderlich)." };
      }
  }

  // GEMINI IMPLEMENTATION
  try {
    const ai = getGeminiInstance();
    if (!ai) throw new Error("API Key fehlt");

    const prompt = `
      Du bist ein strenger IT-Auditor.
      Prüfe das angehängte Bild/Dokument.
      
      Kontext der Aufgabe:
      Titel: "${task.title}"
      Beschreibung: "${task.description}"
      
      Frage: Ist dieses Dokument ein glaubwürdiger Nachweis dafür, dass diese spezifische IT-Sicherheitsmaßnahme umgesetzt wurde?
      
      Antworte im JSON-Format:
      {
        "verified": boolean, // true wenn es ein plausibler Nachweis ist, sonst false
        "reason": string // Kurze Begründung (max 2 Sätze) für den Nutzer
      }
      
      Wenn das Bild nicht lesbar ist oder nichts mit IT-Sicherheit zu tun hat, setze verified auf false.
    `;

    const cleanBase64 = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                verified: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
            },
            required: ["verified", "reason"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"verified": false, "reason": "Fehler bei der Analyse"}');
    return result;

  } catch (error) {
    console.error("Verification Error:", error);
    return { verified: false, reason: "KI-Dienst konnte das Dokument nicht verarbeiten (Kein API Key oder Netzwerkfehler)." };
  }
};

export const explainTask = async (task: Task): Promise<string> => {
  const config = getAiConfig();
  const prompt = `
      Du bist ein IT-Sicherheitsexperte für KMU.
      Erkläre die Maßnahme: "${task.title}" (${task.description}).
      Kategorie: ${task.category}, Framework: ${task.framework}.
      
      Struktur:
      1. Warum wichtig?
      2. Umsetzung (Klein vs. Groß)
      3. Tools (Open Source vs. Kommerziell)
      
      Nutze Markdown.
    `;

  if (config.provider === 'OLLAMA') {
      try {
          return await callOllama(prompt);
      } catch (e: unknown) {
          throw new Error("Fehler bei der lokalen KI-Anfrage: " + (e instanceof Error ? e.message : String(e)));
      }
  }

  try {
    const ai = getGeminiInstance();
    if (!ai) throw new Error("Kein API-Key konfiguriert. Bitte setzen Sie einen in den Einstellungen.");

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    });
    
    if (!response.text) {
        throw new Error("Die KI hat keine Antwort generiert. Versuchen Sie es erneut.");
    }
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Fehler bei der Verbindung zum KI-Assistenten. Bitte prüfen Sie Ihre Internetverbindung und den API-Key.");
  }
};

export const chatWithAssistant = async (history: { role: string; text: string }[], newMessage: string): Promise<string> => {
  const config = getAiConfig();
  const systemInstruction = "Du bist 'CyberGuard', ein freundlicher IT-Sicherheitsberater für deutsche KMUs. Sprechen Sie den Nutzer immer mit der Höflichkeitsform 'Sie' an. Unterscheiden Sie bei Lösungen zwischen Kleinstunternehmen und größeren KMUs.";

  if (config.provider === 'OLLAMA') {
      try {
          return await callOllamaChat(history, newMessage, systemInstruction);
      } catch (e: unknown) {
          throw new Error("Verbindung zur lokalen KI fehlgeschlagen: " + (e instanceof Error ? e.message : String(e)));
      }
  }

  try {
    const ai = getGeminiInstance();
    if (!ai) throw new Error("Kein API-Key konfiguriert. Ich kann leider nicht antworten.");

    const formattedHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-3.1-flash-lite-preview',
      history: formattedHistory,
      config: { systemInstruction },
    });

    const result = await chat.sendMessage({ message: newMessage });
    
    if (!result.text) {
        throw new Error("Die KI konnte keine Antwort formulieren. Bitte versuchen Sie es mit einer anderen Frage.");
    }
    return result.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Entschuldigung, ich habe gerade Verbindungsprobleme. Bitte prüfen Sie den API-Key und Ihre Internetverbindung.");
  }
};

export const continueOnboardingSession = async (history: { role: string; text: string }[], newMessage: string): Promise<string> => {
  const config = getAiConfig();
  const systemInstruction = `
          Du bist 'CyberGuard', der KI-Assistent der App 'KMU CyberGuard'.
          Ihre Aufgabe ist es, als freundlicher Interviewer ein Profil des Unternehmens zu erstellen.
          Sprechen Sie den Nutzer immer mit "Sie" an.
          Regeln:
          1. Stellen Sie IMMER nur EINE Frage gleichzeitig.
          2. Seien Sie professionell, aber zugänglich.
          3. Fragen Sie nacheinander: Branche, Mitarbeiterzahl, IT-Abteilung?, Cloud-Nutzung?, Homeoffice?, Sensible Daten?.
          4. Wenn alle Infos da sind, bitten Sie den Nutzer freundlich, auf 'Analyse abschließen' zu klicken, um die maßgeschneiderten Maßnahmen zu erstellen.
          5. Fassen Sie sich kurz in Ihren Fragen.
        `;

  if (config.provider === 'OLLAMA') {
      try {
          return await callOllamaChat(history, newMessage, systemInstruction);
      } catch {
          return "Verbindungsfehler (Ollama).";
      }
  }

  try {
    const ai = getGeminiInstance();
    if (!ai) return "Demo Modus: Kein API Key. Bitte nutzen Sie Ollama oder setzen Sie einen Key.";

    const formattedHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-3.1-flash-lite-preview',
      history: formattedHistory,
      config: { systemInstruction },
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "";
  } catch (error) {
    console.error("Gemini Onboarding Error:", error);
    return "Ich habe Verbindungsprobleme. Können wir das kurz wiederholen?";
  }
};

export const generateTasksFromChat = async (history: { role: string; text: string }[]): Promise<Partial<Task>[]> => {
  const config = getAiConfig();
  const prompt = `
      Analysiere den Chatverlauf: ${JSON.stringify(history)}
      Erstelle 3-5 IT-Sicherheitsmaßnahmen (Tasks) basierend auf den Schwachstellen/Profil.
      Antworte als JSON Array: [{ "title": "...", "description": "...", "category": "...", "framework": "BASIC|BSI|NIS2", "impact": "LOW|MEDIUM|HIGH" }]
    `;

  if (config.provider === 'OLLAMA') {
      try {
          const jsonStr = await callOllama(prompt, true);
          const rawTasks = JSON.parse(jsonStr.replace(/```json/g, '').replace(/```/g, '').trim());
          return rawTasks.map((t: Partial<Task> & { framework: string }) => ({
            ...t,
            status: TaskStatus.TODO,
            framework: t.framework as Framework,
            source: 'ONBOARDING'
          }));
      } catch {
          console.error("Ollama Task Gen Error");
          return [];
      }
  }

  try {
    const ai = getGeminiInstance();
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              framework: { type: Type.STRING, enum: ["BASIC", "BSI", "NIS2"] },
              impact: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
            },
            required: ["title", "description", "category", "framework", "impact"]
          }
        }
      }
    });

    const rawTasks = JSON.parse(response.text || "[]");
    return rawTasks.map((t: Partial<Task> & { framework: string }) => ({
      ...t,
      status: TaskStatus.TODO,
      framework: t.framework as Framework,
      source: 'ONBOARDING'
    }));
  } catch (error) {
    console.error("Task Extraction Error:", error);
    return [];
  }
};

export const generateChecklist = async (
  industry: string, 
  size: string, 
  existingCompliance: string[]
): Promise<Partial<Task>[]> => {
  const config = getAiConfig();
  const prompt = `
      Du bist ein erfahrener IT-Sicherheitsberater für kleine und mittelständische Unternehmen in Deutschland.
      Deine Aufgabe ist es, eine prägnante und relevante Checkliste mit 5 bis 8 wichtigen IT-Sicherheitsmaßnahmen zu erstellen, basierend auf dem folgenden Unternehmensprofil:

      - **Branche:** "${industry}"
      - **Unternehmensgröße:** "${size}"
      - **Bestehende Compliance-Maßnahmen (falls bekannt):** "${existingCompliance.join(', ') || 'Keine Angabe'}"

      **Anforderungen an die Antwort:**
      1.  **Format:** Antworte ausschließlich mit einem JSON-Array. Kein einleitender Text, keine Kommentare, nur das JSON.
      2.  **Struktur des JSON-Objekts pro Maßnahme:**
          \`\`\`json
          {
            "title": "Kurzer, prägnanter Titel der Maßnahme",
            "description": "Eine ein- bis zweisätzige Beschreibung, was zu tun ist.",
            "category": "Eine passende Kategorie (z.B. 'Zugriffskontrolle', 'Netzwerksicherheit', 'Datensicherung')",
            "framework": "Wähle das passendste Framework: 'BASIC' (grundlegend), 'BSI' (für höhere Anforderungen), oder 'NIS2' (falls die Branche kritisch ist, z.B. Energie, Gesundheit)",
            "impact": "Bewerte die Priorität: 'HIGH', 'MEDIUM', oder 'LOW'"
          }
          \`\`\`
      **Wichtige Hinweise:**
      - Wenn die Branche sehr spezifisch ist (z.B. "Tischlerei"), gib allgemeine, aber für die Unternehmensgröße passende Maßnahmen an (z.B. Schutz vor Ransomware).
      - Leite aus der Unternehmensgröße die Komplexität der Maßnahmen ab. Ein Kleinstunternehmen braucht andere Lösungen als ein mittleres Unternehmen.
      - Wenn keine Compliance angegeben ist, konzentriere dich auf grundlegende 'BASIC' und 'BSI' Maßnahmen.
    `;

  if (config.provider === 'OLLAMA') {
      try {
           const jsonStr = await callOllama(prompt, true);
           const rawTasks = JSON.parse(jsonStr.replace(/```json/g, '').replace(/```/g, '').trim());
           return rawTasks.map((t: Partial<Task> & { framework: string }) => ({
            ...t,
            status: TaskStatus.TODO,
            framework: t.framework as Framework, 
            source: 'GENERATOR'
           }));
      } catch {
          return [];
      }
  }

  try {
    const ai = getGeminiInstance();
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              framework: { type: Type.STRING, enum: ["BASIC", "BSI", "NIS2"] },
              impact: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
            },
            required: ["title", "description", "category", "framework", "impact"]
          }
        }
      }
    });

    const rawTasks = JSON.parse(response.text || "[]");
    return rawTasks.map((t: Partial<Task> & { framework: string }) => ({
      ...t,
      status: TaskStatus.TODO,
      framework: t.framework as Framework, 
      source: 'GENERATOR'
    }));
  } catch (error) {
    console.error("Checklist Generation Error:", error);
    return [];
  }
};

export const importFrameworkModule = async (framework: string, moduleName: string, isFullCatalog: boolean = false): Promise<Partial<Task>[]> => {
  const config = getAiConfig();

  // Check for pre-defined high-quality data first
  const fwUpper = framework.toUpperCase();
  let preDefinedTasks: Partial<Task>[] = [];

  if (fwUpper.includes('NIS2')) {
    preDefinedTasks = NIS2_TASKS;
  } else if (fwUpper.includes('ISO') || fwUpper.includes('27001')) {
    preDefinedTasks = ISO27001_TASKS;
  } else if (fwUpper.includes('BSI') || fwUpper.includes('GRUNDSCHUTZ')) {
    preDefinedTasks = BSI_TASKS;
  } else if (fwUpper.includes('GDPR') || fwUpper.includes('DSGVO')) {
    preDefinedTasks = GDPR_TASKS;
  } else if (fwUpper.includes('CIS')) {
    preDefinedTasks = CIS_TASKS;
  }

  // If we have pre-defined tasks and it's a "full" import or matches the framework name
  if (preDefinedTasks.length > 0 && (isFullCatalog || moduleName.toUpperCase() === fwUpper || moduleName === framework)) {
    return preDefinedTasks.map((t, idx) => ({
      ...t,
      id: `${t.framework?.toLowerCase()}-${Date.now()}-${idx}`,
      status: TaskStatus.TODO,
      source: 'CATALOG'
    }));
  }

  let prompt = "";
  if (isFullCatalog) {
       prompt = `Erstelle 15 kritische Tasks für Framework: ${framework}. JSON Array Format: [{ "title": "...", "description": "...", "category": "...", "impact": "LOW|MEDIUM|HIGH" }]`;
    } else {
       prompt = `Erstelle 5 Tasks für Framework: ${framework}, Modul: ${moduleName}. JSON Array Format: [{ "title": "...", "description": "...", "category": "...", "impact": "LOW|MEDIUM|HIGH" }]`;
    }

  if (config.provider === 'OLLAMA') {
      try {
           const jsonStr = await callOllama(prompt, true);
           const rawTasks = JSON.parse(jsonStr.replace(/```json/g, '').replace(/```/g, '').trim());
    
    let mappedFramework = Framework.BSI;
    if (framework.includes('ISO')) mappedFramework = Framework.ISO27001;
    else if (framework.includes('NIS2')) mappedFramework = Framework.NIS2;
    else if (framework.includes('CIS')) mappedFramework = Framework.CIS;
    else if (framework.includes('DSGVO') || framework.includes('GDPR')) mappedFramework = Framework.GDPR;
    else if (framework.includes('Grundschutz')) mappedFramework = Framework.BSI;
    else mappedFramework = Framework.BASIC;

    return rawTasks.map((t: Partial<Task>) => ({
             ...t,
             status: TaskStatus.TODO,
             framework: mappedFramework,
             source: 'CATALOG'
           }));
      } catch {
          return [];
      }
  }

  try {
    const ai = getGeminiInstance();
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
             },
             required: ["title", "description", "category", "impact"]
          }
        }
      }
    });

    const rawTasks = JSON.parse(response.text || "[]");
    
    let mappedFramework = Framework.BSI;
    if (framework.includes('ISO')) mappedFramework = Framework.ISO27001;
    else if (framework.includes('NIS2')) mappedFramework = Framework.NIS2;
    else if (framework.includes('CIS')) mappedFramework = Framework.CIS;
    else if (framework.includes('DSGVO') || framework.includes('GDPR')) mappedFramework = Framework.GDPR;
    else if (framework.includes('Grundschutz')) mappedFramework = Framework.BSI;
    else mappedFramework = Framework.BASIC;

    return rawTasks.map((t: Partial<Task>) => ({
      ...t,
      status: TaskStatus.TODO,
      framework: mappedFramework,
      source: 'CATALOG'
    }));

  } catch (error) {
    console.error("Framework Import Error:", error);
    return [];
  }
};

export const searchFrameworkModules = async (query: string): Promise<Partial<Task>[]> => {
    const config = getAiConfig();
    const prompt = `
            Suche nach IT-Security Modulen für "${query}".
            Interpretiere Synonyme.
            Antworte als JSON Array:
            [
                {
                    "title": "Titel des Moduls",
                    "description": "Beschreibung",
                    "framework": "Framework Name",
                    "estTasks": 5
                }
            ]
        `;

    if (config.provider === 'OLLAMA') {
        try {
            const jsonStr = await callOllama(prompt, true);
            const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch {
    return [];
  }
    }

    try {
        const ai = getGeminiInstance();
        if (!ai) return [];

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            framework: { type: Type.STRING },
                            estTasks: { type: Type.INTEGER }
                        },
                        required: ["title", "description", "framework", "estTasks"]
                    }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    } catch (error) {
        console.error("Search Modules Error:", error);
        return [];
    }
};

export const importCustomFramework = async (base64Data: string, mimeType: string, fileName: string): Promise<Partial<Task>[]> => {
  const config = getAiConfig();
  const prompt = `
    Analysiere das angehängte Dokument ("${fileName}").
    Es handelt sich um ein Sicherheits-Framework, eine Richtlinie oder eine Checkliste.
    Extrahiere daraus alle konkreten Handlungsanweisungen (Tasks) für ein IT-Sicherheitsaudit.
    
    Antworte ausschließlich als JSON Array.
    Struktur pro Task:
    {
      "title": "Prägnanter Titel",
      "description": "Detaillierte Beschreibung der Anforderung",
      "category": "Passende Kategorie (z.B. Zugriffskontrolle, Netzwerk, Organisation, Physisch)",
      "impact": "HIGH" (kritisch) | "MEDIUM" (wichtig) | "LOW" (optional)
    }
  `;

  // Clean base64
  const cleanBase64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;

  if (config.provider === 'OLLAMA') {
      // Ollama usually doesn't support PDF/Doc analysis well without OCR middleware, 
      // but if it's text/image it might work with llava. 
      // For now, we return a mock or error if it's not text.
      // Assuming text for simplicity if Ollama is forced, or just fail.
      return []; 
  }

  try {
    const ai = getGeminiInstance();
    if (!ai) throw new Error("Kein API Key vorhanden.");

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              impact: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
            },
            required: ["title", "description", "category", "impact"]
          }
        }
      }
    });

    const rawTasks = JSON.parse(response.text || "[]");
    return rawTasks.map((t: Partial<Task>) => ({
      ...t,
      status: TaskStatus.TODO,
      framework: Framework.CUSTOM, // We need to handle CUSTOM framework or map to something
      source: 'UPLOAD'
    }));

  } catch (error) {
    console.error("Custom Framework Import Error:", error);
    throw new Error("Fehler bei der Analyse des Dokuments. Bitte stellen Sie sicher, dass es lesbar ist.");
  }
};
export const generateSecurityRoadmap = async (tasks: Task[]): Promise<Roadmap> => {
  const config = getAiConfig();
  const openTasks = tasks
        .filter(t => t.status === TaskStatus.TODO)
        .map(t => ({ id: t.id, title: t.title, impact: t.impact, category: t.category }));

  if (openTasks.length === 0) {
      return { phases: [], generatedAt: new Date() };
  }

  const prompt = `
      Erstelle eine Roadmap (3 Phasen) für diese Tasks: ${JSON.stringify(openTasks)}.
      Phasen: 1. Quick Wins, 2. Struktur, 3. Governance.
      Antworte als JSON:
      {
        "phases": [
          {
            "title": "...",
            "timeframe": "...",
            "description": "...",
            "taskIds": ["id1"] 
          }
        ]
      }
    `;

  if (config.provider === 'OLLAMA') {
      try {
           const jsonStr = await callOllama(prompt, true);
           const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
           const result = JSON.parse(cleanJson);
           return { phases: result.phases, generatedAt: new Date() };
      } catch {
    return { phases: [], generatedAt: new Date() };
  }
  }

  try {
    const ai = getGeminiInstance();
    if (!ai) return { phases: [], generatedAt: new Date() };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                phases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            timeframe: { type: Type.STRING },
                            description: { type: Type.STRING },
                            taskIds: { 
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["title", "timeframe", "description", "taskIds"]
                    }
                }
            },
            required: ["phases"]
        }
      }
    });

    const result = JSON.parse(response.text || '{ "phases": [] }');
    return {
        phases: result.phases,
        generatedAt: new Date()
    };

  } catch (error) {
    console.error("Roadmap Generation Error:", error);
    return { phases: [], generatedAt: new Date() };
  }
};
