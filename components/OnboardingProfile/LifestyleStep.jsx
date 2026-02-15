import { View, Text, TouchableOpacity } from "react-native";

function LifestylePill({ label, value, current, setCurrent }) {
  const selected = current === value;
  const borderColor = selected
    ? "rgba(124,58,237,0.40)"
    : "rgba(17,17,17,0.10)";
  const backgroundColor = selected
    ? "rgba(124,58,237,0.10)"
    : "rgba(255,255,255,0.8)";
  const fontWeight = selected ? "900" : "800";

  return (
    <TouchableOpacity
      key={value}
      onPress={() => setCurrent(value)}
      activeOpacity={0.85}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor,
      }}
    >
      <Text style={{ color: "#111", fontWeight }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function LifestyleStep({
  workout,
  setWorkout,
  smoke,
  setSmoke,
  drink,
  setDrink,
  diet,
  setDiet,
  labelStyle,
}) {
  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={labelStyle}>Workout</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Often", value: "often" },
            { label: "Sometimes", value: "sometimes" },
            { label: "Never", value: "never" },
          ].map((o) => (
            <LifestylePill
              key={o.value}
              label={o.label}
              value={o.value}
              current={workout}
              setCurrent={setWorkout}
            />
          ))}
        </View>
      </View>

      <View>
        <Text style={labelStyle}>Smoke</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "No", value: "no" },
            { label: "Sometimes", value: "sometimes" },
            { label: "Yes", value: "yes" },
          ].map((o) => (
            <LifestylePill
              key={o.value}
              label={o.label}
              value={o.value}
              current={smoke}
              setCurrent={setSmoke}
            />
          ))}
        </View>
      </View>

      <View>
        <Text style={labelStyle}>Drink</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "No", value: "no" },
            { label: "Sometimes", value: "sometimes" },
            { label: "Yes", value: "yes" },
          ].map((o) => (
            <LifestylePill
              key={o.value}
              label={o.label}
              value={o.value}
              current={drink}
              setCurrent={setDrink}
            />
          ))}
        </View>
      </View>

      <View>
        <Text style={labelStyle}>Diet</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "No preference", value: "no_preference" },
            { label: "Omnivore", value: "omnivore" },
            { label: "Vegetarian", value: "vegetarian" },
            { label: "Vegan", value: "vegan" },
            { label: "Pescatarian", value: "pescatarian" },
          ].map((o) => (
            <LifestylePill
              key={o.value}
              label={o.label}
              value={o.value}
              current={diet}
              setCurrent={setDiet}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
