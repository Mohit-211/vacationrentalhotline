// Shapes of the data exchanged with the API, inferred from how the app uses it.

export type Id = number | string;

/** Envelope every API response uses. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

/** Body the API sends with error responses. */
export interface ApiErrorBody {
  message?: string;
  status?: number;
}

// ---- Auth --------------------------------------------------------------------

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  tokens: { access: { token: string } };
}

export interface RegisterInput {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  confirm_password: string;
  terms?: boolean;
}

/** Sets a new password using the token from the reset email. */
export interface ResetPasswordInput {
  password: string;
  confirm_password: string;
  token: string | null;
}

/** Changes the password of the logged-in user. */
export interface ChangePasswordInput {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface TokenInput {
  token: string | null;
}

// ---- Profile -----------------------------------------------------------------

export interface UserProfileDetails {
  name?: string;
  mobile?: string;
  address?: string;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  zip_code?: string;
}

export interface UserProfile {
  email: string;
  mobile?: string;
  user_profile?: UserProfileDetails;
}

export interface UpdateProfileInput {
  name: string;
  email: string;
  mobile?: string;
  address: string;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  zip_code: string;
}

// ---- Locations ---------------------------------------------------------------

export interface Country {
  id: number;
  name: string;
}

export interface State {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
}

/** `country/:id` returns the country together with its states. */
export interface CountryWithStates extends Country {
  all_state: State[];
}

// ---- Properties --------------------------------------------------------------

export type SubscriptionStatus = "ACTIVATE" | "DEACTIVATE";

export interface PropertyNote {
  id: number;
  notes: string;
}

/** Property fields as entered in the form or mapped from a CSV row. */
export interface PropertyInput {
  property_owner_name?: string;
  property_owner_email_1?: string;
  property_owner_email_2?: string;
  property_owner_mobile_number_1?: string;
  property_owner_mobile_number_2?: string;
  address_line_1?: string;
  address_line_2?: string;
  country?: string | number | null;
  state?: string | number | null;
  city?: string | number | null;
  zip_code?: string;
}

export interface Property extends PropertyInput {
  id: number;
  full_address?: string;
  subscription_status?: SubscriptionStatus;
  subscription_end_date?: string | null;
  validity?: string | number | null;
  payment_status?: string;
  property_notes?: PropertyNote[];
}

export interface NoteInput {
  notes: string;
}

// ---- Payments ----------------------------------------------------------------

export interface PaymentTotal {
  totalAmount: number;
}

export interface PaymentIntentInput {
  paymentMethod: "card";
  amount: number;
  currency: string;
  property_id: Id[];
  description: string;
}

export interface PaymentIntent {
  clientSecret: string;
}

// ---- Contact -----------------------------------------------------------------

export interface ContactInput {
  name: string;
  email: string;
  contact_number: string | undefined;
  requirements: string;
}
