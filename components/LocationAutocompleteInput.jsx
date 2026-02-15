import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { MapPin, X } from "lucide-react-native";

function buildLabel(pred) {
  const desc = String(pred?.description || "").trim();
  if (desc) return desc;
  const primary = String(pred?.primary || "").trim();
  const secondary = String(pred?.secondary || "").trim();
  if (!primary) return "";
  return secondary ? `${primary}, ${secondary}` : primary;
}

export default function LocationAutocompleteInput({
  value,
  onChangeText,
  onSelectSuggestion,
  placeholder,
  placeholderTextColor,
  containerStyle,
  textInputStyle,
  inputStyle, // backwards compat: treat as textInputStyle
  types,
  autoFocus,
  minChars,
  maxHeight,
  accent,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
}) {
  const safeTypes = types ? String(types) : "(cities)";
  const safeMinChars = Number.isFinite(minChars) ? minChars : 2;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);

  const query = useMemo(() => String(value || "").trim(), [value]);

  const canSearch = useMemo(
    () => query.length >= safeMinChars,
    [query, safeMinChars],
  );

  const fetchAutocomplete = useCallback(
    async (q) => {
      setLoading(true);
      setError(null);

      try {
        const url = `/api/places/autocomplete?input=${encodeURIComponent(
          q,
        )}&types=${encodeURIComponent(safeTypes)}`;

        const resp = await fetch(url);
        if (!resp.ok) {
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
        const mapped = preds
          .map((p) => ({
            placeId: p?.placeId,
            primary: p?.primary,
            secondary: p?.secondary || "",
            description: p?.description || "",
          }))
          .filter((p) => !!String(p.placeId || "").trim() && !!buildLabel(p));

        setResults(mapped);
      } catch (e) {
        console.error(e);
        setError(String(e?.message || "Could not search locations"));
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [safeTypes],
  );

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchAutocomplete(query);
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [canSearch, fetchAutocomplete, query]);

  const onPick = useCallback(
    (item) => {
      const label = buildLabel(item);
      if (!label) return;

      onChangeText?.(label);
      setResults([]);

      onSelectSuggestion?.({
        placeId: item?.placeId,
        primary: item?.primary,
        secondary: item?.secondary,
        description: item?.description,
        label,
      });
    },
    [onChangeText, onSelectSuggestion],
  );

  const showList = canSearch && (loading || error || results.length > 0);

  const resolvedPlaceholder = placeholder || "City, State";
  const resolvedPlaceholderColor = placeholderTextColor || "#9CA3AF";
  const resolvedAccent = accent || "#7C3AED";
  const listMaxHeight = Number.isFinite(maxHeight) ? maxHeight : 240;

  const mergedTextStyle = textInputStyle || inputStyle;

  return (
    <View>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.10)",
            borderRadius: 14,
            paddingHorizontal: 12,
          },
          containerStyle,
        ]}
      >
        <MapPin size={18} color="#6B7280" />
        <TextInput
          value={String(value || "")}
          onChangeText={onChangeText}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={resolvedPlaceholderColor}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={!!autoFocus}
          returnKeyType={returnKeyType || "done"}
          blurOnSubmit={blurOnSubmit}
          onSubmitEditing={onSubmitEditing}
          style={[
            {
              flex: 1,
              paddingVertical: 12,
              fontSize: 16,
              color: "#111",
              fontWeight: "700",
            },
            mergedTextStyle,
          ]}
        />
        {query ? (
          <TouchableOpacity
            onPress={() => {
              onChangeText?.("");
              setResults([]);
              setError(null);
              setLoading(false);
            }}
            style={{ paddingHorizontal: 6, paddingVertical: 10 }}
          >
            <X size={16} color={resolvedAccent} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showList ? (
        <View
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.10)",
            borderRadius: 14,
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          {error ? (
            <Text
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 12,
                color: "#B00020",
              }}
            >
              {error}
            </Text>
          ) : null}

          {loading ? (
            <View
              style={{
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="small" color={resolvedAccent} />
            </View>
          ) : null}

          {!loading ? (
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.placeId)}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: listMaxHeight }}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 1,
                    backgroundColor: "rgba(17,17,17,0.06)",
                    marginLeft: 42,
                  }}
                />
              )}
              renderItem={({ item }) => {
                const primary = String(item?.primary || "").trim();
                const secondary = String(item?.secondary || "").trim();
                const label = buildLabel(item);

                return (
                  <TouchableOpacity
                    onPress={() => onPick(item)}
                    activeOpacity={0.85}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 12,
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
                        {primary || label}
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
                if (!canSearch) return null;
                if (error) return null;
                return (
                  <Text
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      fontSize: 12,
                      color: "#6B7280",
                    }}
                  >
                    No results.
                  </Text>
                );
              }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
