"use client";

import { useState, useCallback, useEffect } from "react";
import { classifyUserIntent } from "@/agent/classifier/classifier";
import { formatSystemPrompt } from "@/agent/rules/defaultRules";
import { getSocket } from "@/agent/lib/socket-client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function useAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<"initializing" | "ready" | "error">("initializing");
  const [isTrainedMode, setIsTrainedMode] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Initialize Session & Lead Tracking
  useEffect(() => {
    let sid = localStorage.getItem("arnold_session_id");
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 12);
      localStorage.setItem("arnold_session_id", sid);
    }
    setSessionId(sid);

    // Check Authorization
    const token = localStorage.getItem("arnold_auth_token");
    setIsAuthorized(!!token);

    // Capture exit as a lead trigger
    const handleUnload = () => {
      if (sid) {
        // Use sendBeacon for reliable exit tracking
        const data = JSON.stringify({ sessionId: sid });
        navigator.sendBeacon("/api/admin/leads/send", data);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Initialize RAG and connection on page load
  useEffect(() => {
    const init = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const response = await fetch("/api/knowledge/init", { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setIsTrainedMode(data.trainedMode || false);
          setStatus("ready");
        } else {
          console.warn("Sentinel: Database init failed, using fallback RAG.");
          setStatus("ready"); // Fallback to hardcoded
        }
      } catch (err) {
        console.warn("Sentinel: Connection timeout/error, using offline mode.");
        setStatus("ready"); // Fallback to hardcoded
      }
    };

    init();

    // Socket Initialization
    const socket = getSocket();
    socket.on("refetch_knowledge", () => {
      console.log("Sentinel: Remote knowledge update detected. Synchronizing...");
      init(); // Re-run init to synchronize state
    });

    return () => {
      socket.off("refetch_knowledge");
    };
  }, []);

  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    console.log(`[useAgent] Adding message: ${role} - ${content.substring(0, 50)}...`);
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role,
      content,
      timestamp: formatTime(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isBusy || status !== "ready") return;

    // --- HANDLE SUDO LOGIN ---
    if (input.toLowerCase().startsWith("sudo login")) {
      const parts = input.split(" ");
      if (parts.length === 3) {
        const password = parts[2];
        addMessage("assistant", "🛡️ Initializing administrative authorization check...");
        
        try {
          const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password })
          });
          const data = await res.json();
          if (data.success) {
            localStorage.setItem("arnold_auth_token", data.token);
            setIsAuthorized(true);
            addMessage("assistant", "✅ Boom! Sentinel Authorization Grade: S. You can now train the AI even if standard mode is locked.");
          } else {
            addMessage("assistant", "❌ Authorization Denied. Unauthorized access attempt logged.");
          }
        } catch (err) {
          addMessage("assistant", "❌ Sentinel core error during login. Authorization failed.");
        }
        return;
      } else {
        addMessage("assistant", "🛡️ Usage: sudo login [password]");
        return;
      }
    }

    const userInput = input.trim();
    addMessage("user", userInput);
    setIsBusy(true);

    try {
      // 1. Classify Intent
      const classification = await classifyUserIntent(userInput, messages);

      // 2. Prepare System Prompt
      const systemPrompt = formatSystemPrompt({
        intent: classification.intent,
        preProcessorInsights: `- Detected: ${classification.intent}\n- Confidence: ${classification.confidence}`,
        dynamicContextualRules: classification.dynamicRules.join("\n- "),
        knowledge: "Retrieving...", // Server will override this
        trainedMode: isTrainedMode,
        isAdmin: isAuthorized
      });

      // 3. Call Chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userInput }
          ],
          sessionId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to AI service");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantReply = "";

      const assistantMessageId = Math.random().toString(36).substring(7);
      
      // Add an empty assistant message to start streaming into
      setMessages((prev) => [...prev, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: formatTime()
      }]);

      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined };
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantReply += chunk;

        // Strip tags during streaming for a clean UI
        const displayContent = assistantReply
          .replace(/\[(SUGGESTIONS|SAVE_KNOWLEDGE):.*?(\]|(?=$))/gi, "")
          .trim();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: displayContent } : msg
          )
        );
      }

      // --- PARSE SUGGESTIONS ---
      const suggestionsMatch = assistantReply.match(/\[SUGGESTIONS:\s*(.*?)\]/i);
      if (suggestionsMatch) {
        const rawSuggestions = suggestionsMatch[1];
        const suggestionsList = rawSuggestions.split(",").map(s => s.trim());
        setSuggestions(suggestionsList);
        
        // Strip the tag from the displayed message
        const finalCleanReply = assistantReply.replace(/\[SUGGESTIONS:.*?\]/gi, "").trim();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: finalCleanReply } : msg
          )
        );
      } else {
        setSuggestions([]);
      }

      // --- SELF-LEARNING & CORRECTION LOGIC ---
      const correctionMatch = assistantReply.match(/\[TRIGGER_SAVE_CORRECTION:([^:]+)(?::([^\]]+))?\]/i);
      const ruleMatch = assistantReply.match(/\[TRIGGER_SAVE_RULE:([^\]]+)\]/i);
      const saveMatch = assistantReply.match(/\[SAVE_KNOWLEDGE:\s*"?(.*?)"?\]/);

        if (correctionMatch || ruleMatch || saveMatch) {
          const isLearningAllowed = isTrainedMode || isAuthorized;

          if (!isLearningAllowed) {
            // IGNORE Learning and suggest products instead
            const cleanReply = assistantReply
              .replace(/\[TRIGGER_SAVE_CORRECTION:.*?\]/gi, "")
              .replace(/\[TRIGGER_SAVE_RULE:.*?\]/gi, "")
              .replace(/\[SAVE_KNOWLEDGE:.*?\]/gi, "")
              .trim();

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, content: cleanReply + "\n\n💡 I apologize, but my learning modules are currently locked. As your Financial Sentinel, I recommend exploring our IMG membership for full wealth optimization!" } : msg
              )
            );
            setSuggestions(["IMG Membership", "Kaiser 3-in-1", "Dental Benefits"]);
            return;
          }

          // 1. Strip technical tags from the display content
          const cleanReply = assistantReply
          .replace(/\[TRIGGER_SAVE_CORRECTION:.*?\]/gi, "")
          .replace(/\[TRIGGER_SAVE_RULE:.*?\]/gi, "")
          .replace(/\[SAVE_KNOWLEDGE:.*?\]/gi, "")
          .trim();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: cleanReply } : msg
          )
        );

        // 2. Prepare Payload
        let payload: any = {};
        let endpoint = "";

        if (correctionMatch) {
          payload = {
            correction: correctionMatch[1]?.trim(),
            originalFact: correctionMatch[2]?.trim(),
            context: `User correction via chat`
          };
          endpoint = "/api/admin/corrections";
        } else if (ruleMatch) {
          payload = {
            rule: ruleMatch[1]?.trim(),
            importance: "high"
          };
          endpoint = "/api/admin/rules";
        } else if (saveMatch) {
          payload = { content: saveMatch[1] };
          endpoint = "/api/knowledge/learn";
        }

        // 3. Synchronize to Database
        try {
          const token = localStorage.getItem("arnold_auth_token");
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(payload),
          });
          
          if (res.ok) {
            console.log(`Sentinel: Knowledge updated via ${endpoint}`);
            // 4. Trigger socket broadcast
            getSocket().emit("knowledge_updated");
          }
        } catch (err) {
          console.error("Sentinel learning failure:", err);
        }
      }
      
      // --- SYNC FINAL STATE TO DB (For Lead Tracking) ---
      try {
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
              { role: "user", content: userInput },
              { role: "assistant", content: assistantReply, timestamp: formatTime() }
            ],
            sessionId,
            syncOnly: true
          }),
        });
      } catch (syncErr) {
        console.warn("Sentinel: Final sync failed:", syncErr);
      }

    } catch (error) {
      console.error("Agent Error:", error);
      addMessage("assistant", "I apologize, but I encountered an error in my processing core.");
    } finally {
      setIsBusy(false);
    }
  }, [messages, isBusy, addMessage, status]);

  return {
    messages,
    sendMessage,
    isBusy,
    setMessages,
    status,
    suggestions,
    setSuggestions,
    sessionId
  };
}
