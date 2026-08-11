export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      covers: {
        Row: {
          contributor: string | null;
          cover_id: string;
          created_at: string;
          description: string | null;
          id: number;
          original_id: string;
          slug: string;
          tags: Database["public"]["Enums"]["tags"][] | null;
        };
        Insert: {
          contributor?: string | null;
          cover_id: string;
          created_at?: string;
          description?: string | null;
          id?: number;
          original_id: string;
          slug: string;
          tags?: Database["public"]["Enums"]["tags"][] | null;
        };
        Update: {
          contributor?: string | null;
          cover_id?: string;
          created_at?: string;
          description?: string | null;
          id?: number;
          original_id?: string;
          slug?: string;
          tags?: Database["public"]["Enums"]["tags"][] | null;
        };
        Relationships: [
          {
            foreignKeyName: "covers_cover_id_fkey";
            columns: ["cover_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "covers_original_id_fkey";
            columns: ["original_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      songs: {
        Row: {
          acousticness: number | null;
          album_img: string[];
          album_name: string;
          album_year: number;
          artists: string[];
          created_at: string;
          danceability: number | null;
          duration_ms: number | null;
          energy: number | null;
          gender: Database["public"]["Enums"]["gender"][];
          id: string;
          instrumentalness: number | null;
          key: number | null;
          liveness: number | null;
          loudness: number | null;
          mode: number | null;
          name: string;
          speechiness: number | null;
          tempo: number | null;
          time_signature: number | null;
          url: string;
          valence: number | null;
        };
        Insert: {
          acousticness?: number | null;
          album_img: string[];
          album_name: string;
          album_year: number;
          artists: string[];
          created_at?: string;
          danceability?: number | null;
          duration_ms?: number | null;
          energy?: number | null;
          gender: Database["public"]["Enums"]["gender"][];
          id: string;
          instrumentalness?: number | null;
          key?: number | null;
          liveness?: number | null;
          loudness?: number | null;
          mode?: number | null;
          name: string;
          speechiness?: number | null;
          tempo?: number | null;
          time_signature?: number | null;
          url: string;
          valence?: number | null;
        };
        Update: {
          acousticness?: number | null;
          album_img?: string[];
          album_name?: string;
          album_year?: number;
          artists?: string[];
          created_at?: string;
          danceability?: number | null;
          duration_ms?: number | null;
          energy?: number | null;
          gender?: Database["public"]["Enums"]["gender"][];
          id?: string;
          instrumentalness?: number | null;
          key?: number | null;
          liveness?: number | null;
          loudness?: number | null;
          mode?: number | null;
          name?: string;
          speechiness?: number | null;
          tempo?: number | null;
          time_signature?: number | null;
          url?: string;
          valence?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_random_cover_slug: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      gender: "male" | "female" | "other";
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
        | "transition_mtm";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
