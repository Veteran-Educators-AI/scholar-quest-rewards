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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          scopes: string[]
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          scopes?: string[]
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          token_hash?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          class_id: string
          coin_reward: number
          created_at: string
          description: string | null
          due_at: string
          external_ref: string | null
          id: string
          printable_url: string | null
          standard_id: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          subject: string | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          class_id: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          due_at: string
          external_ref?: string | null
          id?: string
          printable_url?: string | null
          standard_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          subject?: string | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          class_id?: string
          coin_reward?: number
          created_at?: string
          description?: string | null
          due_at?: string
          external_ref?: string | null
          id?: string
          printable_url?: string | null
          standard_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          subject?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "nys_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          answers: Json | null
          assignment_id: string
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["attempt_mode"]
          rejection_reason: string | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at: string | null
          time_spent_seconds: number | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          answers?: Json | null
          assignment_id: string
          created_at?: string
          id?: string
          mode: Database["public"]["Enums"]["attempt_mode"]
          rejection_reason?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at?: string | null
          time_spent_seconds?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          answers?: Json | null
          assignment_id?: string
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["attempt_mode"]
          rejection_reason?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id?: string
          submitted_at?: string | null
          time_spent_seconds?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          criteria: Json | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          assignments_completed: number
          challenge_id: string
          completed_at: string | null
          id: string
          joined_at: string
          rewards_claimed: boolean
          student_id: string
        }
        Insert: {
          assignments_completed?: number
          challenge_id: string
          completed_at?: string | null
          id?: string
          joined_at?: string
          rewards_claimed?: boolean
          student_id: string
        }
        Update: {
          assignments_completed?: number
          challenge_id?: string
          completed_at?: string | null
          id?: string
          joined_at?: string
          rewards_claimed?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          badge_id: string | null
          coin_bonus: number
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          min_assignments: number
          start_date: string
          theme: string
          title: string
          xp_bonus: number
        }
        Insert: {
          badge_id?: string | null
          coin_bonus?: number
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          min_assignments?: number
          start_date: string
          theme: string
          title: string
          xp_bonus?: number
        }
        Update: {
          badge_id?: string | null
          coin_bonus?: number
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          min_assignments?: number
          start_date?: string
          theme?: string
          title?: string
          xp_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string
          created_at: string
          grade_band: string | null
          grade_level: number | null
          id: string
          name: string
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_code: string
          created_at?: string
          grade_band?: string | null
          grade_level?: number | null
          id?: string
          name: string
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_code?: string
          created_at?: string
          grade_band?: string | null
          grade_level?: number | null
          id?: string
          name?: string
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      collectibles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          rarity: Database["public"]["Enums"]["collectible_rarity"]
          slot: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rarity?: Database["public"]["Enums"]["collectible_rarity"]
          slot?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rarity?: Database["public"]["Enums"]["collectible_rarity"]
          slot?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipped_items: {
        Row: {
          collectible_id: string | null
          created_at: string
          id: string
          slot: string
          student_id: string
          updated_at: string
        }
        Insert: {
          collectible_id?: string | null
          created_at?: string
          id?: string
          slot: string
          student_id: string
          updated_at?: string
        }
        Update: {
          collectible_id?: string | null
          created_at?: string
          id?: string
          slot?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipped_items_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_students: {
        Row: {
          class_id: string | null
          class_name: string | null
          coin_potential: number | null
          created_at: string
          email: string | null
          external_id: string
          first_name: string | null
          full_name: string
          grade_level: number | null
          grades: Json | null
          id: string
          last_name: string | null
          linked_at: string | null
          linked_user_id: string | null
          misconceptions: Json | null
          overall_average: number | null
          remediation_recommendations: Json | null
          skill_tags: string[] | null
          source: string | null
          sync_timestamp: string | null
          teacher_id: string | null
          teacher_name: string | null
          updated_at: string
          weak_topics: Json | null
          xp_potential: number | null
        }
        Insert: {
          class_id?: string | null
          class_name?: string | null
          coin_potential?: number | null
          created_at?: string
          email?: string | null
          external_id: string
          first_name?: string | null
          full_name: string
          grade_level?: number | null
          grades?: Json | null
          id?: string
          last_name?: string | null
          linked_at?: string | null
          linked_user_id?: string | null
          misconceptions?: Json | null
          overall_average?: number | null
          remediation_recommendations?: Json | null
          skill_tags?: string[] | null
          source?: string | null
          sync_timestamp?: string | null
          teacher_id?: string | null
          teacher_name?: string | null
          updated_at?: string
          weak_topics?: Json | null
          xp_potential?: number | null
        }
        Update: {
          class_id?: string | null
          class_name?: string | null
          coin_potential?: number | null
          created_at?: string
          email?: string | null
          external_id?: string
          first_name?: string | null
          full_name?: string
          grade_level?: number | null
          grades?: Json | null
          id?: string
          last_name?: string | null
          linked_at?: string | null
          linked_user_id?: string | null
          misconceptions?: Json | null
          overall_average?: number | null
          remediation_recommendations?: Json | null
          skill_tags?: string[] | null
          source?: string | null
          sync_timestamp?: string | null
          teacher_id?: string | null
          teacher_name?: string | null
          updated_at?: string
          weak_topics?: Json | null
          xp_potential?: number | null
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          coins_earned: number | null
          completed_at: string | null
          correct_count: number
          created_at: string
          game_id: string
          id: string
          score: number
          streak_max: number | null
          student_id: string
          time_spent_seconds: number | null
          total_questions: number
          xp_earned: number | null
        }
        Insert: {
          coins_earned?: number | null
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          game_id: string
          id?: string
          score?: number
          streak_max?: number | null
          student_id: string
          time_spent_seconds?: number | null
          total_questions?: number
          xp_earned?: number | null
        }
        Update: {
          coins_earned?: number | null
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          game_id?: string
          id?: string
          score?: number
          streak_max?: number | null
          student_id?: string
          time_spent_seconds?: number | null
          total_questions?: number
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "skill_games"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          token_hash: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          token_hash: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          token_hash?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      lotto_draws: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          prize_description: string
          prize_image_url: string | null
          start_date: string
          title: string
          winner_id: string | null
          winner_selected_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          prize_description: string
          prize_image_url?: string | null
          start_date?: string
          title: string
          winner_id?: string | null
          winner_selected_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          prize_description?: string
          prize_image_url?: string | null
          start_date?: string
          title?: string
          winner_id?: string | null
          winner_selected_at?: string | null
        }
        Relationships: []
      }
      lotto_entries: {
        Row: {
          assignment_id: string | null
          draw_id: string
          earned_at: string
          id: string
          reason: string
          student_id: string
        }
        Insert: {
          assignment_id?: string | null
          draw_id: string
          earned_at?: string
          id?: string
          reason?: string
          student_id: string
        }
        Update: {
          assignment_id?: string | null
          draw_id?: string
          earned_at?: string
          id?: string
          reason?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotto_entries_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lotto_entries_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "lotto_draws"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          icon: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          icon?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          icon?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      nys_standards: {
        Row: {
          cluster: string | null
          code: string
          created_at: string
          domain: string
          grade_band: string
          id: string
          standard_text: string
          subject: string
        }
        Insert: {
          cluster?: string | null
          code: string
          created_at?: string
          domain: string
          grade_band: string
          id?: string
          standard_text: string
          subject: string
        }
        Update: {
          cluster?: string | null
          code?: string
          created_at?: string
          domain?: string
          grade_band?: string
          id?: string
          standard_text?: string
          subject?: string
        }
        Relationships: []
      }
      parent_point_pledges: {
        Row: {
          bonus_coins: number
          claimed: boolean
          claimed_at: string | null
          coin_threshold: number
          created_at: string
          id: string
          is_active: boolean
          parent_id: string
          reward_description: string
          reward_type: string
          student_id: string
          updated_at: string
        }
        Insert: {
          bonus_coins?: number
          claimed?: boolean
          claimed_at?: string | null
          coin_threshold: number
          created_at?: string
          id?: string
          is_active?: boolean
          parent_id: string
          reward_description: string
          reward_type?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          bonus_coins?: number
          claimed?: boolean
          claimed_at?: string | null
          coin_threshold?: number
          created_at?: string
          id?: string
          is_active?: boolean
          parent_id?: string
          reward_description?: string
          reward_type?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_reward_pledges: {
        Row: {
          badge_id: string
          claimed: boolean
          claimed_at: string | null
          created_at: string
          id: string
          is_active: boolean
          parent_id: string
          reward_description: string
          student_id: string
          updated_at: string
        }
        Insert: {
          badge_id: string
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          parent_id: string
          reward_description: string
          student_id: string
          updated_at?: string
        }
        Update: {
          badge_id?: string
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          parent_id?: string
          reward_description?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_parent_student"
            columns: ["parent_id", "student_id"]
            isOneToOne: false
            referencedRelation: "parent_students"
            referencedColumns: ["parent_id", "student_id"]
          },
          {
            foreignKeyName: "parent_reward_pledges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_students: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          relationship: string
          student_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          relationship?: string
          student_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          relationship?: string
          student_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      pending_enrollments: {
        Row: {
          class_id: string
          created_at: string
          email: string
          id: string
          processed: boolean
          processed_at: string | null
          student_name: string | null
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          email: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          student_name?: string | null
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          email?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          student_name?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      point_deductions: {
        Row: {
          class_id: string
          created_at: string
          id: string
          points_deducted: number
          reason: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          points_deducted: number
          reason: string
          student_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          points_deducted?: number
          reason?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      practice_questions: {
        Row: {
          answer_key: Json
          created_at: string
          difficulty: number
          hint: string | null
          id: string
          options: Json | null
          order_index: number
          practice_set_id: string
          prompt: string
          question_type: string
          skill_tag: string | null
        }
        Insert: {
          answer_key: Json
          created_at?: string
          difficulty?: number
          hint?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          practice_set_id: string
          prompt: string
          question_type?: string
          skill_tag?: string | null
        }
        Update: {
          answer_key?: Json
          created_at?: string
          difficulty?: number
          hint?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          practice_set_id?: string
          prompt?: string
          question_type?: string
          skill_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_questions_practice_set_id_fkey"
            columns: ["practice_set_id"]
            isOneToOne: false
            referencedRelation: "practice_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sets: {
        Row: {
          coin_reward: number
          completed_at: string | null
          created_at: string
          description: string | null
          external_ref: string | null
          id: string
          printable_url: string | null
          score: number | null
          skill_tags: string[] | null
          source: string
          started_at: string | null
          status: string
          student_id: string
          title: string
          total_questions: number | null
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          printable_url?: string | null
          score?: number | null
          skill_tags?: string[] | null
          source?: string
          started_at?: string | null
          status?: string
          student_id: string
          title: string
          total_questions?: number | null
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          printable_url?: string | null
          score?: number | null
          skill_tags?: string[] | null
          source?: string
          started_at?: string | null
          status?: string
          student_id?: string
          title?: string
          total_questions?: number | null
          xp_reward?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          preferred_language: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_key: Json
          assignment_id: string
          created_at: string
          difficulty: number
          hint: string | null
          id: string
          options: Json | null
          order_index: number
          prompt: string
          question_type: Database["public"]["Enums"]["question_type"]
          skill_tag: string | null
        }
        Insert: {
          answer_key: Json
          assignment_id: string
          created_at?: string
          difficulty?: number
          hint?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          prompt: string
          question_type?: Database["public"]["Enums"]["question_type"]
          skill_tag?: string | null
        }
        Update: {
          answer_key?: Json
          assignment_id?: string
          created_at?: string
          difficulty?: number
          hint?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          prompt?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          skill_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_ledger: {
        Row: {
          assignment_id: string | null
          coin_delta: number
          created_at: string
          id: string
          reason: string
          student_id: string
          xp_delta: number
        }
        Insert: {
          assignment_id?: string | null
          coin_delta?: number
          created_at?: string
          id?: string
          reason: string
          student_id: string
          xp_delta?: number
        }
        Update: {
          assignment_id?: string | null
          coin_delta?: number
          created_at?: string
          id?: string
          reason?: string
          student_id?: string
          xp_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "reward_ledger_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_games: {
        Row: {
          attempts_count: number
          best_time_seconds: number | null
          coin_reward: number
          created_at: string
          difficulty: number
          external_ref: string | null
          game_data: Json
          game_type: string
          high_score: number | null
          id: string
          last_played_at: string | null
          skill_tag: string
          source: string
          status: string
          student_id: string
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          attempts_count?: number
          best_time_seconds?: number | null
          coin_reward?: number
          created_at?: string
          difficulty?: number
          external_ref?: string | null
          game_data?: Json
          game_type: string
          high_score?: number | null
          id?: string
          last_played_at?: string | null
          skill_tag: string
          source?: string
          status?: string
          student_id: string
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          attempts_count?: number
          best_time_seconds?: number | null
          coin_reward?: number
          created_at?: string
          difficulty?: number
          external_ref?: string | null
          game_data?: Json
          game_type?: string
          high_score?: number | null
          id?: string
          last_played_at?: string | null
          skill_tag?: string
          source?: string
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      student_collectibles: {
        Row: {
          collectible_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          collectible_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          collectible_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_collectibles_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invite_links: {
        Row: {
          class_id: string | null
          created_at: string
          expires_at: string
          external_ref: string | null
          id: string
          student_email: string | null
          student_name: string | null
          teacher_id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          expires_at?: string
          external_ref?: string | null
          id?: string
          student_email?: string | null
          student_name?: string | null
          teacher_id: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          expires_at?: string
          external_ref?: string | null
          id?: string
          student_email?: string | null
          student_name?: string | null
          teacher_id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_invite_links_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          accommodations: string[] | null
          coins: number
          created_at: string
          current_streak: number
          grade_level: number | null
          id: string
          longest_streak: number
          math_level: string | null
          reading_level: string | null
          skill_tags: string[] | null
          streak_shield_available: boolean
          strengths: string[] | null
          updated_at: string
          user_id: string
          weaknesses: string[] | null
          xp: number
        }
        Insert: {
          accommodations?: string[] | null
          coins?: number
          created_at?: string
          current_streak?: number
          grade_level?: number | null
          id?: string
          longest_streak?: number
          math_level?: string | null
          reading_level?: string | null
          skill_tags?: string[] | null
          streak_shield_available?: boolean
          strengths?: string[] | null
          updated_at?: string
          user_id: string
          weaknesses?: string[] | null
          xp?: number
        }
        Update: {
          accommodations?: string[] | null
          coins?: number
          created_at?: string
          current_streak?: number
          grade_level?: number | null
          id?: string
          longest_streak?: number
          math_level?: string | null
          reading_level?: string | null
          skill_tags?: string[] | null
          streak_shield_available?: boolean
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
          weaknesses?: string[] | null
          xp?: number
        }
        Relationships: []
      }
      student_standard_mastery: {
        Row: {
          attempts_count: number
          correct_count: number
          created_at: string
          id: string
          last_attempt_at: string | null
          mastered_at: string | null
          mastery_level: string
          standard_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          attempts_count?: number
          correct_count?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          mastered_at?: string | null
          mastery_level?: string
          standard_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          attempts_count?: number
          correct_count?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          mastered_at?: string | null
          mastery_level?: string
          standard_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_standard_mastery_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "nys_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      student_status_logs: {
        Row: {
          class_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_at: string
          status: Database["public"]["Enums"]["student_status_type"]
          student_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          status: Database["public"]["Enums"]["student_status_type"]
          student_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          status?: Database["public"]["Enums"]["student_status_type"]
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_status_logs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_assets: {
        Row: {
          attempt_id: string
          created_at: string
          file_type: string | null
          file_url: string
          id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_assets_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_event_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          response: Json | null
          status: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          response?: Json | null
          status?: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          response?: Json | null
          status?: string
          teacher_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_streak_warnings: { Args: never; Returns: undefined }
      deduct_student_points: {
        Args: {
          p_class_id: string
          p_points: number
          p_reason: string
          p_student_id: string
        }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_teacher_of_class: {
        Args: { p_class_id: string; p_teacher_id: string }
        Returns: boolean
      }
      process_invite_link: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      teacher_can_view_student: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
      }
    }
    Enums: {
      assignment_status: "pending" | "active" | "completed" | "archived"
      attempt_mode: "paper" | "in_app"
      attempt_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "verified"
        | "rejected"
      collectible_rarity: "common" | "rare" | "epic" | "legendary"
      question_type:
        | "multiple_choice"
        | "short_answer"
        | "numeric"
        | "drag_order"
        | "matching"
      student_status_type:
        | "on_task"
        | "off_task"
        | "needs_support"
        | "excellent"
        | "absent"
        | "late"
      user_role: "student" | "teacher" | "parent" | "admin"
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
      assignment_status: ["pending", "active", "completed", "archived"],
      attempt_mode: ["paper", "in_app"],
      attempt_status: [
        "not_started",
        "in_progress",
        "submitted",
        "verified",
        "rejected",
      ],
      collectible_rarity: ["common", "rare", "epic", "legendary"],
      question_type: [
        "multiple_choice",
        "short_answer",
        "numeric",
        "drag_order",
        "matching",
      ],
      student_status_type: [
        "on_task",
        "off_task",
        "needs_support",
        "excellent",
        "absent",
        "late",
      ],
      user_role: ["student", "teacher", "parent", "admin"],
    },
  },
} as const
