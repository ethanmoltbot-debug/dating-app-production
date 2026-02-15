import { useState, useCallback } from "react";
import { Alert } from "react-native";

export function useReportUser(matchInfo, user) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("HARASSMENT");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSending, setReportSending] = useState(false);

  const submitReport = useCallback(async () => {
    if (!user?.id) return;
    const reportedUserId = matchInfo?.otherUser?.id;
    if (!reportedUserId) {
      Alert.alert("Report failed", "Could not find the other user.");
      return;
    }

    const description = reportDesc.trim();
    if (!description) {
      Alert.alert("Add details", "Please add a short description.");
      return;
    }

    try {
      setReportSending(true);
      const resp = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterUserId: user.id,
          reportedUserId,
          reportType,
          description,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `When posting /api/reports, the response was [${resp.status}] ${resp.statusText}. ${text}`,
        );
      }

      setReportOpen(false);
      setReportDesc("");
      Alert.alert(
        "Report sent",
        "Thanks — our team will review it. You can also block this user from the menu.",
      );
    } catch (e) {
      console.error("Could not report user", e);
      Alert.alert("Report failed", "Could not send your report right now.");
    } finally {
      setReportSending(false);
    }
  }, [matchInfo?.otherUser?.id, reportDesc, reportType, user?.id]);

  return {
    reportOpen,
    setReportOpen,
    reportType,
    setReportType,
    reportDesc,
    setReportDesc,
    reportSending,
    submitReport,
  };
}
