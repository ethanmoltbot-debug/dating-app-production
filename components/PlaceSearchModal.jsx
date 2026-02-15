import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MapPin, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

const ACCENT = "#FF1744";

export default function PlaceSearchModal({
  visible,
  initialQuery,
  onClose,
  onSelectPlace,
}) {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setQuery(String(initialQuery || "").trim());
    setResults([]);
    setError(null);
    setLoading(false);
  }, [initialQuery, visible]);

  const canSearch = useMemo(() => {
    const q = String(query || "").trim();
    return q.length >= 2;
  }, [query]);

  const fetchAutocomplete = useCallback(
    async (q) => {
      setLoading(true);
      setError(null);

      try {
        const url = `/api/places/autocomplete?input=${encodeURIComponent(
          q,
        )}&types=establishment`;

        const resp = await fetch(url);
        if (!resp.ok) {
          // try to surface useful Google error messages
          let message = `Places search failed ([${resp.status}] ${resp.statusText})`;
          try {
            const errJson = await resp.json();
            const extra = errJson?.message || errJson?.status || errJson?.error;
            if (extra) {
              message = `${message}: ${extra}`;
            }
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        const json = await resp.json();
        const preds = Array.isArray(json?.predictions) ? json.predictions : [];

        const mapped = preds.map((p) => ({
          placeId: p.placeId,
          primary: p.primary,
          secondary: p.secondary || "",
          description: p.description || "",
        }));

        setResults(mapped);
      } catch (e) {
        console.error(e);
        const msg = String(e?.message || "Could not search places");
        setError(msg);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, setResults],
  );

  useEffect(() => {
    if (!visible) return;
    if (!canSearch) {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchAutocomplete(String(query || "").trim());
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [canSearch, fetchAutocomplete, query, visible]);

  const onPick = useCallback(
    (item) => {
      const pid = String(item?.placeId || "").trim();
      const label = String(item?.primary || item?.description || "").trim();
      const secondary = String(item?.secondary || "").trim();

      if (!pid || !label) {
        return;
      }

      onSelectPlace({
        placeId: pid,
        label,
        secondary,
      });
      onClose();
    },
    [onClose, onSelectPlace],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        {/* Backdrop lives behind the sheet so it doesn't steal scroll/keyboard gestures */}
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

        {/* Use keyboard avoiding so the input + results stay visible above the keyboard */}
        <KeyboardAvoidingAnimatedView
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E5E5",
            paddingBottom: insets.bottom + 14,
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
              Pick a place
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ paddingHorizontal: 10, paddingVertical: 8 }}
            >
              <X size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E5E5",
                borderRadius: 12,
                backgroundColor: "#fff",
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <MapPin size={18} color="#6B7280" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search (e.g. Nickel City)"
                placeholderTextColor="#9CA3AF"
                autoFocus
                returnKeyType="search"
                blurOnSubmit={false}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "#111",
                  fontWeight: "800",
                }}
              />
              {query ? (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  style={{ paddingHorizontal: 6, paddingVertical: 6 }}
                >
                  <Text
                    style={{ fontSize: 12, fontWeight: "900", color: ACCENT }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {error ? (
              <Text style={{ fontSize: 12, color: "#B00020", marginTop: 10 }}>
                {error}
              </Text>
            ) : null}

            {loading ? (
              <View
                style={{
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="small" color={ACCENT} />
              </View>
            ) : null}

            {!loading ? (
              <FlatList
                data={results}
                keyExtractor={(item) => String(item.placeId)}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                style={{ marginTop: 10, maxHeight: 360 }}
                contentContainerStyle={{ paddingBottom: 10 }}
                ItemSeparatorComponent={() => (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#F1F1F1",
                      marginLeft: 40,
                    }}
                  />
                )}
                renderItem={({ item }) => {
                  const primary = String(item?.primary || "").trim();
                  const secondary = String(item?.secondary || "").trim();

                  return (
                    <TouchableOpacity
                      onPress={() => onPick(item)}
                      style={{
                        paddingVertical: 12,
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <View
                        style={{
                          width: 30,
                          paddingTop: 2,
                          alignItems: "center",
                        }}
                      >
                        <MapPin size={16} color="#6B7280" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "900",
                            color: "#111",
                          }}
                          numberOfLines={1}
                        >
                          {primary}
                        </Text>
                        {secondary ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#6B7280",
                              marginTop: 3,
                            }}
                            numberOfLines={1}
                          >
                            {secondary}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => {
                  if (!canSearch) {
                    return (
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          marginTop: 12,
                        }}
                      >
                        Type at least 2 letters to search.
                      </Text>
                    );
                  }
                  return (
                    <Text
                      style={{ fontSize: 12, color: "#6B7280", marginTop: 12 }}
                    >
                      No results.
                    </Text>
                  );
                }}
              />
            ) : null}
          </View>
        </KeyboardAvoidingAnimatedView>
      </View>
    </Modal>
  );
}
