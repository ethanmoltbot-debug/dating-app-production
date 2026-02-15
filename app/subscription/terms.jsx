import { View, Text, TouchableOpacity, ScrollView } from "react-native";
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

export default function SubscriptionTermsScreen() {
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
          Subscription Terms
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
            Wifey Subscription Terms
          </Text>

          {/* 1 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            1. Overview
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey offers optional paid subscription tiers that unlock enhanced
            features and visibility within the app. Subscriptions are{" "}
            <Text style={{ fontWeight: "900" }}>not required</Text> to use
            Wifey.
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            All subscriptions{" "}
            <Text style={{ fontWeight: "900" }}>automatically renew</Text>{" "}
            unless canceled at least 24 hours before the end of the current
            billing period.
          </Text>

          {/* 2 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            2. Subscription Tiers & Features
          </Text>

          <Text
            style={{
              marginTop: 12,
              fontSize: 14,
              fontWeight: "900",
              color: "#111",
            }}
          >
            Free Membership
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Free users can:
          </Text>
          <Bullet>Create a profile</Bullet>
          <Bullet>Complete the Wifey vetting process</Bullet>
          <Bullet>Like and match with other users</Bullet>
          <Bullet>
            Message{" "}
            <Text style={{ fontWeight: "900" }}>one person at a time</Text>
          </Bullet>
          <Bullet>Use core discovery and dating features</Bullet>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Free accounts are subject to standard limits and visibility rules.
          </Text>

          <Text
            style={{
              marginTop: 14,
              fontSize: 14,
              fontWeight: "900",
              color: "#111",
            }}
          >
            Serious Tier
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            The <Text style={{ fontWeight: "900" }}>Serious</Text> tier is
            designed for users actively seeking higher-quality matches and
            improved discovery.
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Serious includes:
          </Text>
          <Bullet>
            Access to <Text style={{ fontWeight: "900" }}>Standouts</Text>
          </Bullet>
          <Bullet>Unlimited likes</Bullet>
          <Bullet>Unlimited rewinds</Bullet>
          <Bullet>Priority profile visibility</Bullet>
          <Bullet>Fine-tuned discovery preferences</Bullet>

          <Text
            style={{
              marginTop: 14,
              fontSize: 14,
              fontWeight: "900",
              color: "#111",
            }}
          >
            Committed Tier
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            The <Text style={{ fontWeight: "900" }}>Committed</Text> tier is for
            users who want maximum flexibility and insight while maintaining
            Wifey’s quality standards.
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Committed includes{" "}
            <Text style={{ fontWeight: "900" }}>everything</Text> in Serious,
            plus:
          </Text>
          <Bullet>See who has liked your profile</Bullet>
          <Bullet>
            Up to{" "}
            <Text style={{ fontWeight: "900" }}>
              three active conversations
            </Text>{" "}
            at a time
          </Bullet>
          <Bullet>Increased Standouts exposure</Bullet>
          <Bullet>
            Dating insights (including engagement and interaction metrics)
          </Bullet>
          <Bullet>Passport mode (change location)</Bullet>

          {/* 3 */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              fontWeight: "900",
              color: "#111",
            }}
          >
            3. Conversation Limits
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            To encourage intentional dating and meaningful connections, Wifey
            limits simultaneous conversations:
          </Text>
          <Bullet>Free users: 1 active conversation</Bullet>
          <Bullet>Serious tier users: 1 active conversation</Bullet>
          <Bullet>Committed tier users: Up to 3 active conversations</Bullet>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey may adjust limits to protect platform quality and user
            experience.
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
            4. Payments & Billing
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Subscriptions are billed through{" "}
            <Text style={{ fontWeight: "900" }}>
              Apple App Store or Google Play Store
            </Text>
            , depending on your device.
          </Text>
          <Bullet>Payment is charged at confirmation of purchase</Bullet>
          <Bullet>Subscriptions renew automatically unless canceled</Bullet>
          <Bullet>Pricing may vary by region and platform</Bullet>
          <Bullet>Wifey does not directly process subscription payments</Bullet>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            You can manage or cancel your subscription through your App Store or
            Google Play account settings.
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
            5. Refunds
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            All purchases are <Text style={{ fontWeight: "900" }}>final</Text>{" "}
            unless otherwise required by law.
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Refund requests must be submitted through the Apple App Store or
            Google Play Store. Wifey does not control refund approvals and
            cannot guarantee refunds for unused time, inactivity, or
            dissatisfaction.
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
            6. No Guarantees
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey does not guarantee:
          </Text>
          <Bullet>Matches</Bullet>
          <Bullet>Dates</Bullet>
          <Bullet>Relationships</Bullet>
          <Bullet>Message responses</Bullet>
          <Bullet>Compatibility or outcomes</Bullet>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Subscriptions improve access, visibility, and flexibility only.
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
            7. Account Status & Enforcement
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Subscription benefits may be suspended or revoked if a user:
          </Text>
          <Bullet>
            Violates Wifey’s Terms of Service or Community Guidelines
          </Bullet>
          <Bullet>Engages in harassment, abuse, or deceptive behavior</Bullet>
          <Bullet>Attempts to bypass app rules or limitations</Bullet>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Account restrictions, suspensions, or bans do{" "}
            <Text style={{ fontWeight: "900" }}>not</Text> entitle users to
            refunds.
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
            8. Changes to Subscription Features
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Wifey may modify, add, or remove subscription features at any time
            to improve the platform or comply with legal, safety, or operational
            requirements.
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Material changes will be communicated within the app or through
            official notices.
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
            9. Cancellation
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            You may cancel your subscription at any time through your Apple App
            Store or Google Play Store account settings. Cancellation takes
            effect at the end of the current billing period.
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            Deleting your account does{" "}
            <Text style={{ fontWeight: "900" }}>not</Text> automatically cancel
            your subscription.
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
            10. Contact
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: "#374151",
            }}
          >
            For subscription-related questions, contact support through the app.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
