import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

const BG_GRADIENT = ["#F7EEFF", "#F2F7FF", "#FFF1F7"];

function SoftBlobsBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -80,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: "rgba(255, 79, 216, 0.16)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 120,
          right: -110,
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: "rgba(124, 58, 237, 0.14)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -120,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: "rgba(99, 179, 237, 0.16)",
        }}
      />
    </View>
  );
}

function LinkText({ href, children }) {
  const onPress = () => {
    const url = String(href || "").trim();
    if (!url) return;
    Linking.openURL(url);
  };

  return (
    <Text onPress={onPress} style={{ color: "#7C3AED", fontWeight: "900" }}>
      {children}
    </Text>
  );
}

function Bullet({ children }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 8 }}>
      <Text style={{ width: 18, color: "#374151", fontSize: 14 }}>•</Text>
      <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: "#374151" }}>
        {children}
      </Text>
    </View>
  );
}

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={BG_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SoftBlobsBackground />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.78)",
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.08)",
          }}
        >
          <ArrowLeft size={20} color="#111" />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
          Terms
        </Text>

        <View style={{ width: 40, height: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(17,17,17,0.06)",
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>
            Terms and Conditions
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
            Effective Date: January 19th, 2026
          </Text>

          <Text
            style={{
              marginTop: 14,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            These Terms and Conditions ("Terms") govern your use of the Wifey
            application and Services. By accessing or using Wifey, you agree to
            be bound by these Terms.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            1. Eligibility
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            You must be at least 18 years old to use Wifey. By using the
            Services, you represent that you meet this requirement.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            2. Account Registration
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            You agree to provide accurate and truthful information during
            registration and onboarding. Wifey reserves the right to suspend or
            terminate accounts that provide false or misleading information.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            3. Vetting, Quizzes, and Access
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey uses quizzes, behavioral questions, and verification methods
            to determine eligibility. Passing a quiz does not guarantee
            continued access. We reserve the right to revoke access, impose
            cooldowns, or permanently ban users at our sole discretion.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            4. User Conduct
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            You agree not to:
          </Text>
          <Bullet>Harass, abuse, or harm other users</Bullet>
          <Bullet>Provide false information to bypass vetting</Bullet>
          <Bullet>
            Use the app for illegal, exploitative, or deceptive purposes
          </Bullet>
          <Bullet>Circumvent app restrictions or safeguards</Bullet>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            5. Dating Disclaimer
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey does not guarantee matches, dates, or relationship outcomes.
            You are solely responsible for your interactions and decisions made
            through the app.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            6. Payments and Fees
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Certain features may require payment, including per-date fees or
            premium features. All payments are non-refundable unless required by
            law.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            7. Account Suspension and Termination
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey may suspend or terminate your account at any time, with or
            without notice, for violations of these Terms, platform safety
            concerns, App Store policy requirements, or behavior inconsistent
            with the app’s standards. Certain actions, including attempts to
            bypass vetting or misrepresentation, may result in permanent
            removal.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            8. Intellectual Property
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            All content, branding, and software associated with Wifey are owned
            by or licensed to Wifey. You may not copy, modify, or distribute any
            part without permission.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            9. Limitation of Liability
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            To the fullest extent permitted by law, Wifey shall not be liable
            for any indirect, incidental, or consequential damages arising from
            your use of the Services.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            10. Indemnification
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            You agree to indemnify and hold harmless Wifey from any claims
            arising from your use of the Services or violation of these Terms.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            11. Governing Law
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            These Terms are governed by the laws of the State of Texas, without
            regard to conflict of law principles.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            12. Changes to Terms
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We may update these Terms from time to time. Continued use of the
            Services constitutes acceptance of the updated Terms.
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            13. Contact
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            For questions about these Terms, contact us at:
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Email:{" "}
            <LinkText href="mailto:wifeymobileapp@gmail.com">
              wifeymobileapp@gmail.com
            </LinkText>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
