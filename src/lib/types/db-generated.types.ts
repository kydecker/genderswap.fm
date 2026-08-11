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
    PostgrestVersion: "11.2.0 (c820efb)"
  }
  public: {
    Tables: {
      covers: {
        Row: {
          contributor: string | null
          cover_id: string
          created_at: string
          description: string | null
          fts: unknown
          id: number
          original_id: string
          slug: string
          tags: Database["public"]["Enums"]["tags"][] | null
        }
        Insert: {
          contributor?: string | null
          cover_id: string
          created_at?: string
          description?: string | null
          fts?: unknown
          id?: number
          original_id: string
          slug: string
          tags?: Database["public"]["Enums"]["tags"][] | null
        }
        Update: {
          contributor?: string | null
          cover_id?: string
          created_at?: string
          description?: string | null
          fts?: unknown
          id?: number
          original_id?: string
          slug?: string
          tags?: Database["public"]["Enums"]["tags"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "covers_cover_id_fkey"
            columns: ["cover_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "covers_original_id_fkey"
            columns: ["original_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          acousticness: number | null
          album_img: string[]
          album_name: string
          album_year: number
          artists: string[]
          created_at: string
          danceability: number | null
          duration_ms: number | null
          energy: number | null
          gender: Database["public"]["Enums"]["gender"][]
          id: string
          instrumentalness: number | null
          key: number | null
          liveness: number | null
          loudness: number | null
          mode: number | null
          name: string
          speechiness: number | null
          tempo: number | null
          time_signature: number | null
          url: string
          valence: number | null
        }
        Insert: {
          acousticness?: number | null
          album_img: string[]
          album_name: string
          album_year: number
          artists: string[]
          created_at?: string
          danceability?: number | null
          duration_ms?: number | null
          energy?: number | null
          gender: Database["public"]["Enums"]["gender"][]
          id: string
          instrumentalness?: number | null
          key?: number | null
          liveness?: number | null
          loudness?: number | null
          mode?: number | null
          name: string
          speechiness?: number | null
          tempo?: number | null
          time_signature?: number | null
          url: string
          valence?: number | null
        }
        Update: {
          acousticness?: number | null
          album_img?: string[]
          album_name?: string
          album_year?: number
          artists?: string[]
          created_at?: string
          danceability?: number | null
          duration_ms?: number | null
          energy?: number | null
          gender?: Database["public"]["Enums"]["gender"][]
          id?: string
          instrumentalness?: number | null
          key?: number | null
          liveness?: number | null
          loudness?: number | null
          mode?: number | null
          name?: string
          speechiness?: number | null
          tempo?: number | null
          time_signature?: number | null
          url?: string
          valence?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_random_cover_slug: { Args: never; Returns: string }
    }
    Enums: {
      gender: "male" | "female" | "other"
      tags:
        | "acousticness_up"
        | "acousticness_down"
        | "danceability_up"
        | "danceability_down"
        | "duration_up"
        | "duration_down"
        | "energy_up"
        | "energy_down"
        | "instrumentalness_up"
        | "instrumentalness_down"
        | "key_change"
        | "tempo_up"
        | "tempo_down"
        | "time_signature_change"
        | "transition_ftm"
        | "transition_mtf"
        | "valence_up"
        | "valence_down"
        | "years_apart_10"
        | "years_apart_20"
        | "years_apart_30"
        | "years_apart_40"
        | "years_apart_50"
        | "transition_ftf"
        | "transition_mtm"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      gender: ["male", "female", "other"],
      tags: [
        "acousticness_up",
        "acousticness_down",
        "danceability_up",
        "danceability_down",
        "duration_up",
        "duration_down",
        "energy_up",
        "energy_down",
        "instrumentalness_up",
        "instrumentalness_down",
        "key_change",
        "tempo_up",
        "tempo_down",
        "time_signature_change",
        "transition_ftm",
        "transition_mtf",
        "valence_up",
        "valence_down",
        "years_apart_10",
        "years_apart_20",
        "years_apart_30",
        "years_apart_40",
        "years_apart_50",
        "transition_ftf",
        "transition_mtm",
      ],
    },
  },
} as const
