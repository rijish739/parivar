export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      community_details: {
        Row: {
          bari: string | null
          family_background:
            | Database["public"]["Enums"]["family_bg_type"]
            | null
          family_deity: string | null
          gotra: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bari?: string | null
          family_background?:
            | Database["public"]["Enums"]["family_bg_type"]
            | null
          family_deity?: string | null
          gotra?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bari?: string | null
          family_background?:
            | Database["public"]["Enums"]["family_bg_type"]
            | null
          family_deity?: string | null
          gotra?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      education_career: {
        Row: {
          annual_income: Database["public"]["Enums"]["income_range"] | null
          company: string | null
          field_of_study: string | null
          highest_qualification: string | null
          occupation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_income?: Database["public"]["Enums"]["income_range"] | null
          company?: string | null
          field_of_study?: string | null
          highest_qualification?: string | null
          occupation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_income?: Database["public"]["Enums"]["income_range"] | null
          company?: string | null
          field_of_study?: string | null
          highest_qualification?: string | null
          occupation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_details: {
        Row: {
          family_type: Database["public"]["Enums"]["family_type"] | null
          family_values: Database["public"]["Enums"]["family_values"] | null
          father_occupation: string | null
          mother_occupation: string | null
          siblings_married: number | null
          siblings_unmarried: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          family_type?: Database["public"]["Enums"]["family_type"] | null
          family_values?: Database["public"]["Enums"]["family_values"] | null
          father_occupation?: string | null
          mother_occupation?: string | null
          siblings_married?: number | null
          siblings_unmarried?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          family_type?: Database["public"]["Enums"]["family_type"] | null
          family_values?: Database["public"]["Enums"]["family_values"] | null
          father_occupation?: string | null
          mother_occupation?: string | null
          siblings_married?: number | null
          siblings_unmarried?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      horoscope: {
        Row: {
          birth_date: string | null
          birth_place: string | null
          birth_time: string | null
          manglik: Database["public"]["Enums"]["manglik_type"] | null
          matching_required: boolean | null
          nakshatra: string | null
          provided: boolean
          rashi: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          manglik?: Database["public"]["Enums"]["manglik_type"] | null
          matching_required?: boolean | null
          nakshatra?: string | null
          provided?: boolean
          rashi?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          manglik?: Database["public"]["Enums"]["manglik_type"] | null
          matching_required?: boolean | null
          nakshatra?: string | null
          provided?: boolean
          rashi?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["interest_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Relationships: []
      }
      lifestyle: {
        Row: {
          diet: Database["public"]["Enums"]["diet_type"] | null
          drinking: boolean | null
          hobbies: string[] | null
          smoking: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          diet?: Database["public"]["Enums"]["diet_type"] | null
          drinking?: boolean | null
          hobbies?: string[] | null
          smoking?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          diet?: Database["public"]["Enums"]["diet_type"] | null
          drinking?: boolean | null
          hobbies?: string[] | null
          smoking?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      partner_preferences: {
        Row: {
          age_max: number | null
          age_min: number | null
          bari_pref: string | null
          deal_breakers: string[] | null
          diet_pref: Database["public"]["Enums"]["diet_type"] | null
          education_pref: string | null
          height_max_cm: number | null
          height_min_cm: number | null
          income_pref: Database["public"]["Enums"]["income_range"] | null
          location_pref: Database["public"]["Enums"]["location_pref"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          bari_pref?: string | null
          deal_breakers?: string[] | null
          diet_pref?: Database["public"]["Enums"]["diet_type"] | null
          education_pref?: string | null
          height_max_cm?: number | null
          height_min_cm?: number | null
          income_pref?: Database["public"]["Enums"]["income_range"] | null
          location_pref?: Database["public"]["Enums"]["location_pref"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          bari_pref?: string | null
          deal_breakers?: string[] | null
          diet_pref?: Database["public"]["Enums"]["diet_type"] | null
          education_pref?: string | null
          height_max_cm?: number | null
          height_min_cm?: number | null
          income_pref?: Database["public"]["Enums"]["income_range"] | null
          location_pref?: Database["public"]["Enums"]["location_pref"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          photo_visibility: Database["public"]["Enums"]["photo_visibility"]
          profile_visibility: Database["public"]["Enums"]["profile_visibility"]
          updated_at: string
          user_id: string
        }
        Insert: {
          photo_visibility?: Database["public"]["Enums"]["photo_visibility"]
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"]
          updated_at?: string
          user_id: string
        }
        Update: {
          photo_visibility?: Database["public"]["Enums"]["photo_visibility"]
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          position: number
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles_basic: {
        Row: {
          created_at: string
          current_city: string | null
          date_of_birth: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height_cm: number | null
          is_verified: boolean
          marital_status: Database["public"]["Enums"]["marital_status_type"]
          mother_tongue: string | null
          native_place: string | null
          onboarding_complete: boolean
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          current_city?: string | null
          date_of_birth: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height_cm?: number | null
          is_verified?: boolean
          marital_status?: Database["public"]["Enums"]["marital_status_type"]
          mother_tongue?: string | null
          native_place?: string | null
          onboarding_complete?: boolean
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          current_city?: string | null
          date_of_birth?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          height_cm?: number | null
          is_verified?: boolean
          marital_status?: Database["public"]["Enums"]["marital_status_type"]
          mother_tongue?: string | null
          native_place?: string | null
          onboarding_complete?: boolean
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_matched: { Args: { _a: string; _b: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_photo_public: { Args: { _user_id: string }; Returns: boolean }
      is_profile_public: { Args: { _user_id: string }; Returns: boolean }
      is_user_verified: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      diet_type: "veg" | "non_veg" | "eggetarian"
      family_bg_type: "agriculture" | "business" | "service" | "other"
      family_type: "nuclear" | "joint"
      family_values: "traditional" | "moderate" | "liberal"
      gender_type: "male" | "female"
      income_range: "below_5L" | "5_10L" | "10_20L" | "20_50L" | "50L_plus"
      interest_status: "pending" | "accepted" | "declined"
      location_pref: "same_city" | "same_state" | "open"
      manglik_type: "yes" | "no" | "partial" | "unknown"
      marital_status_type: "never_married" | "divorced" | "widowed"
      photo_visibility: "public" | "blur_until_mutual"
      profile_visibility: "everyone" | "mutual_only"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      diet_type: ["veg", "non_veg", "eggetarian"],
      family_bg_type: ["agriculture", "business", "service", "other"],
      family_type: ["nuclear", "joint"],
      family_values: ["traditional", "moderate", "liberal"],
      gender_type: ["male", "female"],
      income_range: ["below_5L", "5_10L", "10_20L", "20_50L", "50L_plus"],
      interest_status: ["pending", "accepted", "declined"],
      location_pref: ["same_city", "same_state", "open"],
      manglik_type: ["yes", "no", "partial", "unknown"],
      marital_status_type: ["never_married", "divorced", "widowed"],
      photo_visibility: ["public", "blur_until_mutual"],
      profile_visibility: ["everyone", "mutual_only"],
    },
  },
} as const
