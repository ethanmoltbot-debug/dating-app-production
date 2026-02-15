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
const PRIVACY_POLICY_URL =
  "https://www.privacypolicies.com/live/17a4d7a3-f3a2-45f2-94fd-55bb98c8eb3e";

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

export default function PrivacyScreen() {
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
          Privacy
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
            Privacy Policy
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: "#6B7280" }}>
            Last updated: January 28, 2026
          </Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Prefer to read this policy in your browser?{" "}
            <LinkText href={PRIVACY_POLICY_URL}>Open the full policy</LinkText>.
          </Text>

          <Text
            style={{
              marginTop: 14,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            This Privacy Policy describes our policies and procedures on the
            collection, use and disclosure of your information when you use the
            Service and tells you about your privacy rights and how the law
            protects you.
          </Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We use your Personal Data to provide and improve the Service. By
            using the Service, you agree to the collection and use of
            information in accordance with this Privacy Policy.
          </Text>

          {/* 5.1.1 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            5.1.1 App Store Guideline (Data Collection & Storage)
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            To align with Apple App Store Review Guideline 5.1.1, we aim to be
            clear about what we collect, why we collect it, and what control you
            have.
          </Text>
          <Bullet>
            We only ask for personal data we need to run the app (matching,
            safety, support, and account features).
          </Bullet>
          <Bullet>
            Sensitive device access (like location and photos/camera) is
            permission-based and can be turned off anytime in your device
            settings.
          </Bullet>
          <Bullet>We don't sell your personal information.</Bullet>
          <Bullet>
            You can request deletion of your account and associated data in the
            app (Profile → Delete Account) or by emailing{" "}
            <LinkText href="mailto:wifeymobileapp@gmail.com">
              wifeymobileapp@gmail.com
            </LinkText>
            .
          </Bullet>
          <Bullet>
            We use trusted service providers for things like hosting, messaging,
            and payments, and we require them to protect your information.
          </Bullet>

          {/* 1 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            1. Information We Collect
          </Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              fontWeight: "800",
              color: "#111",
            }}
          >
            a. Information You Provide
          </Text>
          <Bullet>First name and last name</Bullet>
          <Bullet>Phone number</Bullet>
          <Bullet>Profile details and preferences</Bullet>
          <Bullet>Quiz and onboarding responses</Bullet>
          <Bullet>Messages and interactions within the app</Bullet>
          <Bullet>
            Payment-related information (processed by third-party payment
            providers)
          </Bullet>

          <Text
            style={{
              marginTop: 14,
              fontSize: 14,
              fontWeight: "800",
              color: "#111",
            }}
          >
            b. Automatically Collected Information
          </Text>
          <Bullet>
            Device information (device type, operating system, app version)
          </Bullet>
          <Bullet>
            Usage data (pages viewed, features used, interactions)
          </Bullet>
          <Bullet>IP address and approximate location</Bullet>

          <Text
            style={{
              marginTop: 14,
              fontSize: 14,
              fontWeight: "800",
              color: "#111",
            }}
          >
            c. Verification Information
          </Text>
          <Bullet>
            Selfie or identity verification data collected through third-party
            verification providers
          </Bullet>
          <Bullet>
            We do not store government-issued ID images unless explicitly
            required for verification purposes
          </Bullet>

          {/* 2 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            2. How We Use Your Information
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We use your information to:
          </Text>
          <Bullet>Provide and operate the Services</Bullet>
          <Bullet>Verify user identity and eligibility</Bullet>
          <Bullet>Match users and facilitate communication</Bullet>
          <Bullet>Improve app performance and user experience</Bullet>
          <Bullet>Enforce our rules, quizzes, and eligibility standards</Bullet>
          <Bullet>Process payments and prevent fraud</Bullet>
          <Bullet>Communicate with you regarding updates or support</Bullet>

          {/* 3 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            3. Sharing of Information
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We may share your information:
          </Text>
          <Bullet>
            With service providers (hosting, analytics, verification, payments)
          </Bullet>
          <Bullet>
            To comply with legal obligations or law enforcement requests
          </Bullet>
          <Bullet>To enforce our Terms & Conditions</Bullet>
          <Bullet>In connection with a business transfer or acquisition</Bullet>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We do not sell your personal information.
          </Text>

          {/* 4 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            4. Data Retention
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We retain your information for as long as your account is active or
            as necessary to provide the Services. We may retain certain
            information to comply with legal obligations, resolve disputes, or
            enforce agreements.
          </Text>

          {/* 5 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            5. Security
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We implement reasonable administrative, technical, and physical
            safeguards to protect your information. However, no system is 100%
            secure, and we cannot guarantee absolute security.
          </Text>

          {/* 6 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            6. Your Rights
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Depending on your location, you may have the right to:
          </Text>
          <Bullet>Access or correct your personal information</Bullet>
          <Bullet>Request deletion of your data</Bullet>
          <Bullet>Opt out of certain communications</Bullet>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            You may exercise these rights by contacting us at{" "}
            <LinkText href="mailto:wifeymobileapp@gmail.com">
              wifeymobileapp@gmail.com
            </LinkText>
            .
          </Text>

          {/* 7 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            7. Children's Privacy
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey is not intended for users under the age of 18. We do not
            knowingly collect personal information from anyone under 18.
          </Text>

          {/* 8 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            8. App Store & Platform Compliance
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey complies with applicable App Store and platform requirements,
            including Apple App Store and Google Play policies. We reserve the
            right to enforce eligibility standards, moderation decisions, and
            account actions necessary to maintain a safe and respectful
            platform. Any suspension or termination decisions are final and
            non-appealable to the extent permitted by law.
          </Text>

          {/* 9 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            9. Your Privacy Rights (GDPR & CCPA)
          </Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              fontWeight: "800",
              color: "#111",
            }}
          >
            a. GDPR (European Economic Area)
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            If you are located in the European Economic Area (EEA), you have the
            right to:
          </Text>
          <Bullet>Access the personal data we hold about you</Bullet>
          <Bullet>Request correction or deletion of your data</Bullet>
          <Bullet>Restrict or object to certain processing</Bullet>
          <Bullet>Request data portability</Bullet>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We process your data based on legitimate interests, contractual
            necessity, legal obligations, and your consent where required.
          </Text>

          <Text
            style={{
              marginTop: 14,
              fontSize: 14,
              fontWeight: "800",
              color: "#111",
            }}
          >
            b. CCPA (California Residents)
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            If you are a California resident, you have the right to:
          </Text>
          <Bullet>
            Know what personal information we collect and how it is used
          </Bullet>
          <Bullet>Request deletion of your personal information</Bullet>
          <Bullet>
            Opt out of the sale of personal information (we do not sell personal
            data)
          </Bullet>
          <Bullet>
            Not be discriminated against for exercising your privacy rights
          </Bullet>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            You may exercise these rights by contacting us at{" "}
            <LinkText href="mailto:wifeymobileapp@gmail.com">
              wifeymobileapp@gmail.com
            </LinkText>
            .
          </Text>

          {/* 10 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            10. Changes to This Policy
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            We may update this Privacy Policy from time to time. We will notify
            you of material changes through the app or other means.
          </Text>

          {/* 11 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            11. Contact Us
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            If you have questions about this Privacy Policy, contact us at:
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
