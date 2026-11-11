import {
  DEFAULT_CREATED_AT_FIELD,
  DEFAULT_ID_FIELD,
  DEFAULT_LEGACY_DATA_FIELD,
  DEFAULT_SCHEMA_VERSION_FIELD,
} from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
  },
  encryptedSecret: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  enabledAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
  },
  lastUsedTimeStep: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
  },
  recoveryCodeHashes: {
    database: {
      type: "TEXT[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
  },
  failedAttempts: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
  },
  lastFailedAttemptAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"UserTwoFactorAuths">>;

export default schema
