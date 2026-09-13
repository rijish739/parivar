import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Parivar" },
      { name: "description", content: "Sign in or create your Parivar profile with your phone number." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const sendOtp = async () => {
    if (!/^\+\d{10,15}$/.test(phone)) {
      toast.error("Enter phone in international format, e.g. +919812345678");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      toast.success("Code sent to your phone");
      setStep("otp");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not send code";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  const verifyOtp = async () => {
    if (!/^\d{4,8}$/.test(otp)) {
      toast.error("Enter the code from your SMS");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/dashboard" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not verify code";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-warm">
      <div className="mx-auto max-w-md px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <Card className="border-gold-soft">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl text-primary">Welcome to Parivar</CardTitle>
            <CardDescription>
              {step === "phone"
                ? "Sign in or create your profile with your mobile number"
                : `Enter the code we sent to ${phone}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "phone" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+919812345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendOtp();
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g. +91 for India)
                  </p>
                </div>
                <Button
                  className="w-full bg-primary hover:opacity-90"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") verifyOtp();
                    }}
                  />
                </div>
                <Button
                  className="w-full bg-primary hover:opacity-90"
                  onClick={verifyOtp}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Continue
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                  disabled={loading}
                >
                  Use a different number
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree that your profile will be reviewed by our team before it
          becomes visible to other members.
        </p>
      </div>
    </div>
  );
}
