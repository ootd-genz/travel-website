export const CMS_RESOURCES = [
  "trips",
  "destinations",
  "activities",
  "trip-types",
  "blog",
  "promotions",
] as const;

export type CmsResource = (typeof CMS_RESOURCES)[number];

export type CmsActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: Record<string, string[]>;
};

export const INITIAL_CMS_ACTION_STATE: CmsActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type CmsOption = { id: string; label: string };

export type CmsRelationOptions = {
  destinations: CmsOption[];
  activities: CmsOption[];
  tripTypes: CmsOption[];
  trips: CmsOption[];
};
