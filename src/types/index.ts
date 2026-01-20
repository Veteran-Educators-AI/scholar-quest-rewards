/**
 * Scholar Quest Rewards - Centralized Type System
 *
 * This module provides type-safe definitions for all entities, API contracts,
 * and utility types used throughout the application.
 *
 * @example
 * import { StudentProfile, Assignment, ApiResponse } from "@/types";
 * import { UserId, asUserId } from "@/types/utils/branded";
 * import { isPassingScore, isStudent } from "@/types/utils/guards";
 */

// Entity types
export * from "./entities";

// API types
export * from "./api";

// Utility types
export * from "./utils";
